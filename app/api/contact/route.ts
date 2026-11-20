import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, location, city, email, product, message } = body;
    const customerCity = (location || city || "").trim();

    // Basic server-side validation
    if (!name || !phone || !message || !customerCity) {
      return NextResponse.json(
        { error: "Name, phone, location/city, and message are required." },
        { status: 400 }
      );
    }

    // Try saving lead to Supabase
    try {
      const supabase = getAdminClient();
      const { error } = await (supabase.from("leads" as any) as any).insert([
        {
          name: name.trim(),
          phone: phone.trim(),
          city: customerCity,
          email: email?.trim() || null,
          product_interest: product || "General Inquiry",
          notes: message.trim(),
          source: "Website",
          priority: "high",
          status: "new",
        },
      ]);

      if (error) {
        console.warn("Could not insert lead to Supabase (check keys/tables):", error.message);
      } else {
        console.log("✅ Lead successfully saved to Supabase:", name, phone);
      }
    } catch (dbErr: any) {
      console.warn("Supabase lead logging error:", dbErr?.message);
    }

    return NextResponse.json(
      { success: true, message: "Thank you! Our team will contact you shortly." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process form submission." },
      { status: 500 }
    );
  }
}
