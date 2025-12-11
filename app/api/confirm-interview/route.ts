import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, status } = await request.json()
    
    if (!email || !status) {
      return NextResponse.json(
        { error: "Email et status requis" }, 
        { status: 400 }
      )
    }

    console.log("[Confirm] Updating interview status:", { email, status })

    const supabase = getSupabaseAdmin()

    // Après :
    const { data, error } = await supabase
      .from('email_history')
      .update({
        status: status,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      })
      .eq('candidate_email', email)
      .order('sent_at', { ascending: false })
      .limit(1)
      .select()
      .maybeSingle() // ✅ Utilise maybeSingle()

    if (error) {
      console.error("[Confirm] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[Confirm] Status updated successfully:", data)

    return NextResponse.json({ 
      success: true, 
      message: `Statut mis Ã  jour : ${status}`,
      record: data 
    })

  } catch (error) {
    console.error("[Confirm] Error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la confirmation" }, 
      { status: 500 }
    )
  }
}