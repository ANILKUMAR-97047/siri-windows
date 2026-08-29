import { NextResponse } from "next/server";

// TODO: Connect to real email service (e.g. Resend, EmailJS, SendGrid)
// This handler currently just logs the form data and returns a success response.

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, phone, email, product, message } = body;

    // Basic server-side validation
    if (!name || !phone || !message) {
      return NextResponse.json(
        { error: "Name, phone, and message are required." },
        { status: 400 }
      );
    }

    // Log the submission (replace with email service in production)
    console.log("📧 New contact form submission:");
    console.log("  Name:", name);
    console.log("  Phone:", phone);
    console.log("  Email:", email || "Not provided");
    console.log("  Product Interest:", product || "Not specified");
    console.log("  Message:", message);

    // TODO: Send email notification
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'Siri Windows <noreply@siriwindows.in>',
    //   to: 'your-email@example.com',
    //   subject: `New inquiry from ${name}`,
    //   html: `<p>Name: ${name}</p><p>Phone: ${phone}</p>...`,
    // });

    return NextResponse.json(
      { success: true, message: "Form submitted successfully!" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to process form submission." },
      { status: 500 }
    );
  }
}
