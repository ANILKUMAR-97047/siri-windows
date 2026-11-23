import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = ((formData.get("folder") as string) || "staff").replace(/[^a-zA-Z0-9_-]/g, "");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Limit size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image file exceeds 10MB limit. Please compress or choose a smaller photo." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Prepare clean unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const cleanBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 35);
    const fileName = `${folder}_${Date.now()}_${cleanBase}.${ext}`;
    const storagePath = `${folder}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try "uploads" bucket first, create if missing, fallback to "gallery"
    let bucketName = "uploads";
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const names = buckets?.map((b) => b.name) || [];
      if (!names.includes("uploads")) {
        const { error: createErr } = await supabase.storage.createBucket("uploads", {
          public: true,
          fileSizeLimit: MAX_SIZE,
        });
        if (createErr && names.includes("gallery")) {
          bucketName = "gallery";
        }
      }
    } catch {
      bucketName = "gallery";
    }

    let { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    // If upload to primary bucket failed (e.g. RLS or permissions), fallback to "gallery"
    if (uploadError && bucketName !== "gallery") {
      console.warn(`Upload to ${bucketName} failed (${uploadError.message}), retrying with 'gallery'...`);
      bucketName = "gallery";
      const retry = await supabase.storage
        .from("gallery")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });
      uploadError = retry.error;
    }

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      filename: fileName,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
