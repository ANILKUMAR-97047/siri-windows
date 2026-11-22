import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Validate mime type
    const validMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/heic",
      "image/heif",
    ];
    if (!validMimes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload JPG, PNG, WEBP, or AVIF image." },
        { status: 400 }
      );
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

    // Ensure bucket exists
    await supabase.storage.createBucket("gallery", {
      public: true,
      fileSizeLimit: MAX_SIZE,
    }).catch(() => {});

    // Generate unique sanitized filename
    const ext = file.name.split(".").pop() || "jpg";
    const cleanBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const fileName = `${cleanBase}_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("gallery")
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName,
    });
  } catch (err: any) {
    console.error("Gallery image upload error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
