import { type NextRequest, NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/ai"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory = [] } = body

    console.log("[API] Received message:", message)
    console.log("[API] Conversation history:", conversationHistory)

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!Array.isArray(conversationHistory)) {
      console.error("[API] Invalid conversation history format:", conversationHistory)
      return NextResponse.json({ error: "Invalid conversation history format" }, { status: 400 })
    }

    const cleanHistory = conversationHistory
      .filter((msg: any) => msg && msg.role && msg.content)
      .map((msg: any) => ({
        role: msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        content: String(msg.content)
      }))

    console.log("[API] Clean history:", cleanHistory)

    const supabaseAdmin = getSupabaseAdmin()
    
    // 🔄 CHANGEMENT : Récupérer depuis email_history au lieu de candidates
    const { data: emailHistory, error: dbError } = await supabaseAdmin
      .from("email_history")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(10)

    if (dbError) {
      console.error("[API] Database error:", dbError)
    }

    // 🔄 CHANGEMENT : Construire le contexte avec email_history
    const context = emailHistory && emailHistory.length > 0
      ? `Emails récents: ${emailHistory.map((e: any) => 
          `${e.candidate_name} (${e.post_title}) - Statut: ${e.status}, Date entretien: ${e.interview_date}`
        ).join(" | ")}`
      : "Aucun email d'entretien récent trouvé."

    console.log("[API] Generating AI response...")

    const response = await generateChatResponse(message, cleanHistory, context)

    console.log("[API] AI response generated:", response)

    const shouldSendEmail = response.includes("SEND_EMAIL")

    let emailSent = false
    let emailResult = null

    if (shouldSendEmail) {
      console.log("[API] 📧 SEND_EMAIL detected! Extracting candidate info from conversation...")
      
      try {
        const fullConversation = [
          ...cleanHistory, 
          { role: 'user', content: message },
          { role: 'assistant', content: response }
        ].map(m => m.content).join('\n')
        
        console.log("[API] Full conversation for extraction:", fullConversation)

        // Regex améliorées
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9_-]+)?)/i
        const nomRegex = /(?:nom.*?(?:c'est|est)\s+|s'appelle\s+|candidat.*?c'est\s+)([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)?)/i
        const posteRegex = /(?:pour\s+devenir\s+|postule\s+pour\s+(?:devenir\s+)?|poste\s+de\s+|poste\s*:\s*)([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/i
        const dateRegex = /(\d{2}\/\d{2}\/\d{4})/i
        const heureRegex = /(?:à|a)\s+(\d{1,2})[h:](\d{2})/i
        const dureeRegex = /(?:durera?|durée|pendant)\s+(\d+)\s*(?:mn|min|minutes?)/i
        const modaliteRegex = /(?:en\s+)?(visioconférence|visio|présentiel|ligne|hybride|téléphonique)/i

        const emailMatch = fullConversation.match(emailRegex)
        const nomMatch = fullConversation.match(nomRegex)
        const posteMatch = fullConversation.match(posteRegex)
        const dateMatch = fullConversation.match(dateRegex)
        const heureMatch = fullConversation.match(heureRegex)
        const dureeMatch = fullConversation.match(dureeRegex)
        const modaliteMatch = fullConversation.match(modaliteRegex)

        console.log("[API] Extraction results:", {
          email: emailMatch?.[1],
          nom: nomMatch?.[1],
          poste: posteMatch?.[1],
          date: dateMatch?.[1],
          heure: heureMatch ? `${heureMatch[1]}:${heureMatch[2]}` : null,
          duree: dureeMatch?.[1],
          modalite: modaliteMatch?.[1]
        })

        // Vérification des champs obligatoires
        if (!emailMatch || !nomMatch || !posteMatch || !dateMatch || !heureMatch) {
          const missingFields = []
          if (!emailMatch) missingFields.push("email")
          if (!nomMatch) missingFields.push("nom")
          if (!posteMatch) missingFields.push("poste")
          if (!dateMatch) missingFields.push("date")
          if (!heureMatch) missingFields.push("heure")

          console.error("[API] ❌ Champs manquants:", missingFields.join(", "))
          
          return NextResponse.json({
            response: `Je n'ai pas pu extraire toutes les informations nécessaires. Il manque : ${missingFields.join(", ")}. Pouvez-vous me les donner à nouveau ?`,
            shouldSendEmail: false,
            emailSent: false,
            missingFields
          })
        }

        // ✅ TypeScript sait maintenant que tous les champs existent
        const formattedTime = `${heureMatch[1].padStart(2, '0')}:${heureMatch[2]}`

        const emailPayload = {
          candidateName: nomMatch[1].trim(),
          candidateEmail: emailMatch[1].trim(),
          postTitle: posteMatch[1].trim(),
          interviewDate: dateMatch[1].trim(),
          interviewTime: formattedTime,
          interviewDuration: dureeMatch ? `${dureeMatch[1]} minutes` : "30 minutes",
          interviewLocation: modaliteMatch ? 
            (modaliteMatch[1].toLowerCase().includes('ligne') || 
             modaliteMatch[1].toLowerCase().includes('visio') || 
             modaliteMatch[1].toLowerCase().includes('téléphonique') ? 
              "Visioconférence (lien envoyé par email)" : 
              "En présentiel") : 
            "Visioconférence"
        }

        console.log("[API] 📧 Calling /api/send-email with payload:", emailPayload)

        const emailApiResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailPayload)
          }
        )

        console.log("[API] Email API response status:", emailApiResponse.status)

        if (emailApiResponse.ok) {
          emailResult = await emailApiResponse.json()
          emailSent = true
          console.log("[API] ✅ Email sent successfully:", emailResult)
        } else {
          const errorText = await emailApiResponse.text()
          console.error("[API] ❌ Email sending failed. Status:", emailApiResponse.status)
          console.error("[API] Error response:", errorText)
        }

      } catch (extractError) {
        console.error("[API] ❌ Error extracting email data:", extractError)
      }
    }

    let cleanResponse = response.replace(/SEND_EMAIL/gi, "").trim()
    
    if (emailSent && emailResult) {
      cleanResponse = `✅ **Email de convocation envoyé avec succès !**\n\n📧 Le candidat recevra l'invitation à l'adresse indiquée.\n\nVous pouvez suivre le statut dans le dashboard.`
    } else if (shouldSendEmail && !emailSent) {
      cleanResponse += `\n\n⚠️ Note: L'email n'a pas pu être envoyé automatiquement. Veuillez vérifier les informations dans les logs.`
    }

    // Gérer les rappels
    if (response.includes("SEND_REMINDER:")) {
      const emailMatch = response.match(/SEND_REMINDER:([^\s]+)/i)
      if (emailMatch) {
        const targetEmail = emailMatch[1]
        
        const reminderResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-reminder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: targetEmail })
          }
        )
        
        if (reminderResponse.ok) {
          cleanResponse = cleanResponse.replace(/SEND_REMINDER:[^\s]+/gi, "")
          cleanResponse += "\n\n✅ Rappel envoyé avec succès !"
        }
      }
    }

    // Gérer la vérification de statut
    if (response.includes("CHECK_STATUS:")) {
      const emailMatch = response.match(/CHECK_STATUS:([^\s]+)/i)
      if (emailMatch) {
        const targetEmail = emailMatch[1]
        
        const { data: statusData } = await supabaseAdmin
          .from("email_history")
          .select("*")
          .eq("candidate_email", targetEmail)
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle()
              
        if (statusData) {
          cleanResponse = cleanResponse.replace(/CHECK_STATUS:[^\s]+/gi, "")
          cleanResponse += `\n\n📊 Statut : **${statusData.status}**\n`
          cleanResponse += `📧 Email envoyé le : ${new Date(statusData.sent_at).toLocaleDateString()}\n`
          if (statusData.confirmed_at) {
            cleanResponse += `✅ Confirmé le : ${new Date(statusData.confirmed_at).toLocaleDateString()}`
          }
        }
      }
    }

    // 🔄 CHANGEMENT : Retourner emailHistory au lieu de candidates
    return NextResponse.json({
      response: cleanResponse || response,
      shouldSendEmail,
      emailSent,
      emailResult,
      emailHistory: emailHistory || [], // Changé de candidates à emailHistory
    })
  } catch (error) {
    console.error("[API] Chat error:", error)
    
    if (error instanceof Error) {
      console.error("[API] Error message:", error.message)
      console.error("[API] Error stack:", error.stack)
    }
    
    return NextResponse.json(
      { 
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}