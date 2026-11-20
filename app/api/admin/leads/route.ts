import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

// GET all leads (ordered newest first)
export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase.from("leads" as any) as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST a new lead
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getAdminClient();

    const { data, error } = await (supabase.from("leads" as any) as any)
      .insert([body])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}

// PATCH to update lead status, notes, or priority
// Automatically converts lead to Client in `clients` table when status is set to 'won'
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch current lead details
    const { data: currentLead, error: fetchErr } = await (supabase.from("leads" as any) as any)
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !currentLead) {
      return NextResponse.json({ error: fetchErr?.message || "Lead not found" }, { status: 404 });
    }

    let convertedClientId = currentLead.converted_client_id;
    let convertedClient = null;

    // 2. If status is set to 'won', automatically convert lead to a Client
    if (updates.status === "won") {
      // Check if a client already exists with converted_client_id or matching phone number
      let existingClient = null;
      if (currentLead.converted_client_id) {
        const { data: c } = await (supabase.from("clients" as any) as any)
          .select("*")
          .eq("id", currentLead.converted_client_id)
          .maybeSingle();
        existingClient = c;
      }

      if (!existingClient && currentLead.phone) {
        const { data: c } = await (supabase.from("clients" as any) as any)
          .select("*")
          .eq("phone", currentLead.phone)
          .maybeSingle();
        existingClient = c;
      }

      if (existingClient) {
        convertedClientId = existingClient.id;
        convertedClient = existingClient;
      } else {
        // Create new client record in `clients` table
        const { data: newClient, error: clientErr } = await (supabase.from("clients" as any) as any)
          .insert([
            {
              name: currentLead.name,
              phone: currentLead.phone,
              email: currentLead.email || null,
              address: currentLead.address || null,
              city: currentLead.city || "Tanuku",
              company_name: currentLead.name,
              source: currentLead.source || "Website",
              status: "active",
              notes: currentLead.product_interest
                ? `Converted from Lead. Product interest: ${currentLead.product_interest}${currentLead.notes ? ` (${currentLead.notes})` : ""}`
                : currentLead.notes || "Converted from Lead Management inquiry",
            },
          ])
          .select()
          .single();

        if (clientErr) {
          console.error("Failed to auto-create client for won lead:", clientErr);
        } else if (newClient) {
          convertedClientId = newClient.id;
          convertedClient = newClient;
        }
      }
    }

    // 3. Update the lead record with new status and linked client ID
    const { data, error } = await (supabase.from("leads" as any) as any)
      .update({
        ...updates,
        converted_client_id: convertedClientId || currentLead.converted_client_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      client: convertedClient,
      converted_client_id: convertedClientId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}
