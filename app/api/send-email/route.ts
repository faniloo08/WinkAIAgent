import { type NextRequest, NextResponse } from "next/server"

interface EmailPayload {
  candidateName: string
  candidateEmail: string
  postTitle: string
  interviewDate: string
  interviewTime: string
  interviewDuration: string
  interviewLocation: string
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
        model: "google/gemma-3-27b-it:free",
        messages: [
          {
            role: "user",
            content: `Tu es un assistant RH professionnel. Génère un email de convocation à un entretien d'embauche en français avec le format suivant:

Données:
- Nom candidat: ${payload.candidateName}
- Poste: ${payload.postTitle}
- Date: ${payload.interviewDate}
- Heure: ${payload.interviewTime}
- Durée: ${payload.interviewDuration}
- Lieu/Lien: ${payload.interviewLocation}

Réponds UNIQUEMENT avec le JSON suivant (pas d'autre texte):
{
  "subject": "Objet de l'email",
  "body": "Corps du email"
}

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
    console.log("[v0] OpenRouter response:", openRouterData)

    const emailContent = JSON.parse(openRouterData.choices[0].message.content)
    console.log("[v0] Parsed email content:", emailContent)

    // Envoi via EmailJS
    const emailJsResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: payload.candidateEmail,
          subject: emailContent.subject,
          message: emailContent.body,
          candidate_name: payload.candidateName,
          post_title: payload.postTitle,
          interview_date: payload.interviewDate,
          interview_time: payload.interviewTime,
          interview_duration: payload.interviewDuration,
          interview_location: payload.interviewLocation,
        },
      }),
    })

    if (!emailJsResponse.ok) {
      const error = await emailJsResponse.text()
      console.error("[v0] EmailJS error:", error)
      return NextResponse.json({ error: "EmailJS API error" }, { status: 500 })
    }

    console.log("[v0] Email sent successfully")
    return NextResponse.json({ success: true, message: "Email envoyé avec succès" })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
