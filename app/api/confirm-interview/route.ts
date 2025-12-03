import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    const email = request.nextUrl.searchParams.get("email")

    console.log('[API] Confirmation request:', { token, email })

    if (!token || !email) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erreur de confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Lien de confirmation invalide</h1>
          <p>Le lien de confirmation est invalide ou a expiré.</p>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify token exists
    const { data: confirmationData, error: confirmError } = await supabaseAdmin
      .from("confirmations")
      .select("*, candidates(*)")
      .eq("confirmation_token", token)
      .is("confirmed_at", null)
      .single()

    if (confirmError || !confirmationData) {
      console.error('[API] Token not found or already used:', confirmError)
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Confirmation déjà effectuée</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .warning { color: #f59e0b; }
          </style>
        </head>
        <body>
          <h1 class="warning">⚠️ Confirmation déjà effectuée</h1>
          <p>Vous avez déjà confirmé votre présence à cet entretien.</p>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }

    // Update candidate status to confirmed
    const { data: candidate, error: updateError } = await supabaseAdmin
      .from("candidates")
      .update({ 
        status: "confirmed",
        updated_at: new Date().toISOString()
      })
      .eq("email", email)
      .select()
      .single()

    if (updateError) {
      console.error('[API] Error updating candidate:', updateError)
      throw updateError
    }

    console.log('[API] Candidate confirmed:', candidate)

    // Log confirmation
    await supabaseAdmin
      .from("confirmations")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("confirmation_token", token)

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Confirmation réussie</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .success { 
            background: white;
            color: #059669;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-width: 500px;
            margin: 0 auto;
          }
          h1 { margin: 0 0 20px 0; }
          p { margin: 10px 0; color: #4b5563; }
          .details { 
            background: #f3f4f6; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 20px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ Confirmation réussie !</h1>
          <p>Merci ${candidate.name} !</p>
          <p>Votre présence à l'entretien pour le poste de <strong>${candidate.position}</strong> est bien confirmée.</p>
          <div class="details">
            <p><strong>📅 Date :</strong> ${candidate.interview_date}</p>
            <p><strong>🕐 Heure :</strong> ${candidate.interview_time}</p>
          </div>
          <p style="margin-top: 20px; font-size: 14px;">Vous recevrez un email de rappel la veille de l'entretien.</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )

  } catch (error) {
    console.error("[API] Confirm interview error:", error)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erreur</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc2626; }
        </style>
      </head>
      <body>
        <h1 class="error">❌ Erreur</h1>
        <p>Une erreur est survenue lors de la confirmation. Veuillez réessayer.</p>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}