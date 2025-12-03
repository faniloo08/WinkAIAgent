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

    // Valider le format de l'historique
    if (!Array.isArray(conversationHistory)) {
      console.error("[API] Invalid conversation history format:", conversationHistory)
      return NextResponse.json({ error: "Invalid conversation history format" }, { status: 400 })
    }

    // Nettoyer l'historique pour s'assurer que les rôles sont corrects
    const cleanHistory = conversationHistory
      .filter((msg: any) => msg && msg.role && msg.content)
      .map((msg: any) => ({
        role: msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        content: String(msg.content)
      }))

    console.log("[API] Clean history:", cleanHistory)

    // Get candidates for context
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: candidates, error: dbError } = await supabaseAdmin
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (dbError) {
      console.error("[API] Database error:", dbError)
    }

    const context = candidates && candidates.length > 0
      ? `Candidats récents: ${candidates.map((c: any) => `${c.name} (${c.status})`).join(", ")}`
      : "Aucun candidat récent trouvé."

    console.log("[API] Generating AI response...")

    // Generate response
    const response = await generateChatResponse(message, cleanHistory, context)

    console.log("[API] AI response generated:", response)

    // Check if we need to send an email
    const shouldSendEmail = response.includes("SEND_EMAIL")

    // Extract email data if SEND_EMAIL is detected
    let emailSent = false
    let emailData = null

    if (shouldSendEmail) {
      console.log("[API] SEND_EMAIL detected, extracting candidate info...")
      
      // Extract candidate info from conversation history
      const fullConversation = [...cleanHistory, { role: 'user', content: message }].map(m => m.content).join(' ')
      
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
      const emailMatch = fullConversation.match(emailRegex)
      
      if (emailMatch) {
        emailData = {
          candidateEmail: emailMatch[0],
          // Vous pouvez ajouter une extraction plus sophistiquée ici
          // Pour l'instant, on demande à l'utilisateur de confirmer
        }
        console.log("[API] Extracted email:", emailData.candidateEmail)
      }
    }

    return NextResponse.json({
      response: response.replace("SEND_EMAIL", "").trim(),
      shouldSendEmail,
      emailData,
      candidates: candidates || [],
    })
  } catch (error) {
    console.error("[API] Chat error:", error)
    
    // Log détaillé de l'erreur
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