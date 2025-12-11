import { type NextRequest, NextResponse } from "next/server"
import { Resend } from 'resend'
import { getSupabaseAdmin } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    console.log("[Reminder] Sending reminder to:", email)

    const supabase = getSupabaseAdmin()

    const { data: lastEmail, error: fetchError } = await supabase
      .from('email_history')
      .select('*')
      .eq('candidate_email', email)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError || !lastEmail) {
      console.error("[Reminder] Email not found:", fetchError)
      return NextResponse.json({ error: "Email non trouvé" }, { status: 404 })
    }

    if (lastEmail.status === 'confirmed') {
      return NextResponse.json({ 
        error: "Le candidat a déjà confirmé" 
      }, { status: 400 })
    }

    if (lastEmail.reminder_count >= 3) {
      return NextResponse.json({ 
        error: "Nombre maximum de rappels atteint (3)" 
      }, { status: 400 })
    }

    // Envoyer l'email de rappel
    const { data: emailData, error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `Rappel - Confirmation d'entretien pour ${lastEmail.post_title}`,
      html: generateReminderTemplate(lastEmail),
    })

    if (sendError) {
      console.error("[Reminder] Send error:", sendError)
      return NextResponse.json({ error: "Erreur d'envoi" }, { status: 500 })
    }

    // Mettre à jour le compteur de rappels
    const { error: updateError } = await supabase
      .from('email_history')
      .update({
        reminder_count: lastEmail.reminder_count + 1,
        last_reminder_at: new Date().toISOString(),
      })
      .eq('id', lastEmail.id)

    if (updateError) {
      console.error("[Reminder] Update error:", updateError)
    }

    console.log("[Reminder] Reminder sent successfully")

    return NextResponse.json({ 
      success: true, 
      message: "Rappel envoyé avec succès",
      reminderCount: lastEmail.reminder_count + 1 
    })

  } catch (error) {
    console.error("[Reminder] Error:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du rappel" }, 
      { status: 500 }
    )
  }
}

function generateReminderTemplate(emailData: any): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
          
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Rappel - Confirmation d'entretien
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Bonjour <strong>${emailData.candidate_name}</strong>,
              </p>
              
              <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Nous n'avons pas encore reçu votre confirmation pour l'entretien concernant le poste de <strong>${emailData.post_title}</strong>.
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff7ed; border-radius: 8px; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="margin: 0 0 20px 0; color: #f59e0b; font-size: 18px; font-weight: 600;">
                      Rappel des détails
                    </h2>
                    
                    <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #555555;">
                      <strong>Date :</strong> ${emailData.interview_date}<br>
                      <strong>Heure :</strong> ${emailData.interview_time}<br>
                      <strong>Durée :</strong> ${emailData.interview_duration}<br>
                      <strong>Modalité :</strong> ${emailData.interview_location}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/confirmation-success?email=${encodeURIComponent(emailData.candidate_email)}" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Confirmer maintenant
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0 0; font-size: 15px; line-height: 1.6; color: #666666;">
                Merci de nous confirmer votre disponibilité dès que possible.
              </p>

              <p style="margin: 20px 0 0 0; font-size: 15px; line-height: 1.6; color: #666666;">
                Cordialement,<br>
                <strong style="color: #f59e0b;">L'équipe RH BNJ Teammaker</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                Ceci est un rappel automatique envoyé par BNJ Teammaker
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}