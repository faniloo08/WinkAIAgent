import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, status } = await request.json()
    
    if (!email || !status) {
      console.error("[Confirm] Missing email or status")
      return NextResponse.json(
        { error: "Email et status requis" }, 
        { status: 400 }
      )
    }

    console.log("[Confirm] Updating interview status:", { email, status })

    const supabase = getSupabaseAdmin()

    // Trouver le dernier email envoyé à ce candidat
    const { data: existingRecord, error: findError } = await supabase
      .from('email_history')
      .select('*')
      .eq('candidate_email', email)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (findError) {
      console.error("[Confirm] Error finding record:", findError)
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    if (!existingRecord) {
      console.error("[Confirm] No email record found for:", email)
      return NextResponse.json({ 
        error: "Aucun email trouvé pour cette adresse" 
      }, { status: 404 })
    }

    console.log("[Confirm] Found record:", existingRecord.id)

    // Mettre à jour le statut
    const { data, error } = await supabase
      .from('email_history')
      .update({
        status: status, // 'confirmed', 'declined', 'no_response'
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      })
      .eq('id', existingRecord.id)
      .select()
      .single()

    if (error) {
      console.error("[Confirm] Supabase update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[Confirm] ✅ Status updated successfully:", data)

    return NextResponse.json({ 
      success: true, 
      message: `Statut mis à jour : ${status}`,
      record: data 
    })

  } catch (error) {
    console.error("[Confirm] Exception:", error)
    return NextResponse.json(
      { 
        error: "Erreur lors de la confirmation",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}