import { type NextRequest, NextResponse } from "next/server"
import { Resend } from 'resend'
import { getSupabaseAdmin } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailPayload {
  candidateName: string
  candidateEmail: string
  postTitle: string
  interviewDate: string
  interviewTime: string
  interviewDuration: string
  interviewLocation: string
}

// 🎨 TON TEMPLATE EMAIL ICI
function generateEmailTemplate(payload: EmailPayload, aiGeneratedBody: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convocation Entretien</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
          
          <!-- Header avec gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎯 Convocation à un entretien
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                BNJ Teammaker - Système de recrutement
              </p>
            </td>
          </tr>

          <!-- Corps du message -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Bonjour <strong>${payload.candidateName}</strong>,
              </p>
              
              <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                ${aiGeneratedBody}
              </p>

              <!-- Carte des détails de l'entretien -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="margin: 0 0 20px 0; color: #667eea; font-size: 18px; font-weight: 600;">
                      📋 Détails de l'entretien
                    </h2>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #555555;">
                          <strong>📅 Date :</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 15px; color: #333333; text-align: right;">
                          ${payload.interviewDate}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #555555;">
                          <strong>🕐 Heure :</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 15px; color: #333333; text-align: right;">
                          ${payload.interviewTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #555555;">
                          <strong>⏱️ Durée :</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 15px; color: #333333; text-align: right;">
                          ${payload.interviewDuration}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #555555;">
                          <strong>💼 Poste :</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 15px; color: #333333; text-align: right;">
                          ${payload.postTitle}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #555555;">
                          <strong>📍 Modalité :</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 15px; color: #333333; text-align: right;">
                          ${payload.interviewLocation}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Bouton de confirmation (optionnel) -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/confirmation-success?email=${encodeURIComponent(payload.candidateEmail)}"  
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Confirmer ma présence
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0 0; font-size: 15px; line-height: 1.6; color: #666666;">
                Nous vous prions de confirmer votre présence dès que possible.
              </p>

              <p style="margin: 20px 0 0 0; font-size: 15px; line-height: 1.6; color: #666666;">
                Cordialement,<br>
                <strong style="color: #667eea;">L'équipe RH BNJ Teammaker</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                Cet email a été envoyé automatiquement par BNJ Teammaker
              </p>
              <p style="margin: 0; font-size: 12px; color: #bbbbbb;">
                © ${new Date().getFullYear()} BNJ Teammaker. Tous droits réservés.
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

export async function POST(request: NextRequest) {
  try {
    const payload: EmailPayload = await request.json()

    console.log("[v0] Payload received:", payload)

    // Appel à OpenRouter pour générer le contenu email
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: `Tu es un assistant RH professionnel. Génère un email de convocation à un entretien d'embauche en français.

Données:
- Nom candidat: ${payload.candidateName}
- Poste: ${payload.postTitle}
- Date: ${payload.interviewDate}
- Heure: ${payload.interviewTime}
- Durée: ${payload.interviewDuration}
- Lieu/Lien: ${payload.interviewLocation}

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide (sans backticks, sans markdown).
Format exact: {"subject":"Objet","body":"Corps de l'email"}

L'email doit être professionnel, courtois et concis.`,
          },
        ],
      }),
    })

    if (!openRouterResponse.ok) {
      const error = await openRouterResponse.text()
      console.error("[v0] OpenRouter error:", error)
      return NextResponse.json({ error: "OpenRouter API error" }, { status: 500 })
    }

    const openRouterData = await openRouterResponse.json()
    let rawContent = openRouterData.choices[0].message.content.trim()

    // Nettoyer les backticks markdown
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    rawContent = rawContent.trim()
    console.log("[v0] Cleaned content:", rawContent)

    // Parser le JSON
    let emailContent
    try {
      emailContent = JSON.parse(rawContent)
    } catch (parseError) {
      console.error("[v0] JSON parse error, using fallback")
      emailContent = {
        subject: `Convocation - Entretien ${payload.postTitle}`,
        body: `Bonjour ${payload.candidateName},\n\nNous avons le plaisir de vous convoquer à un entretien pour le poste de ${payload.postTitle}.\n\nDate: ${payload.interviewDate}\nHeure: ${payload.interviewTime}\nDurée: ${payload.interviewDuration}\nModalité: ${payload.interviewLocation}\n\nNous vous prions de confirmer votre présence.\n\nCordialement,\nL'équipe RH`
      }
    }

    console.log("[v0] Email content:", emailContent)

    // ✅ Envoi via Resend avec ton template
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: payload.candidateEmail,
      subject: emailContent.subject,
      html: generateEmailTemplate(payload, emailContent.body),
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    console.log("[v0] Email sent successfully via Resend:", data)

    // ✅ Enregistrer dans Supabase
    const supabase = getSupabaseAdmin()
    
    const { data: emailRecord, error: dbError } = await supabase
      .from('email_history')
      .insert({
        candidate_name: payload.candidateName,
        candidate_email: payload.candidateEmail,
        post_title: payload.postTitle,
        interview_date: payload.interviewDate,
        interview_time: payload.interviewTime,
        interview_duration: payload.interviewDuration,
        interview_location: payload.interviewLocation,
        email_subject: emailContent.subject,
        email_body: emailContent.body,
        status: 'sent',
        resend_email_id: data?.id,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Supabase error:", dbError)
      // On continue quand même, l'email est envoyé
    } else {
      console.log("[v0] Email record saved to Supabase:", emailRecord)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email envoyé avec succès",
      emailId: data?.id,
      recordId: emailRecord?.id,
      emailContent 
    })

  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}