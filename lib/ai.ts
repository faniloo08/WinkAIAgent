interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context?: string,
): Promise<string> {
  const systemPrompt = `Tu es un assistant IA pour gérer les convocations d'entretien dans un système ATS (WinkLab).

Tes fonctionnalités disponibles:
1. Envoyer un email de convocation d'entretien à un candidat (tu dois demander l'email)
2. Envoyer un email de rappel/relance si le candidat n'a pas confirmé
3. Consulter le tableau de bord des candidats et leurs statuts
4. Notifier quand un candidat a confirmé sa disponibilité

Réponds en français, sois professionnel et utile.
${context ? `\nContexte actuel: ${context}` : ""}

Quand l'utilisateur veut envoyer un email, tu dois:
- Demander l'email du candidat
- Demander le nom du candidat
- Demander le poste
- Demander la date de l'entretien
- Demander l'heure de l'entretien
- Demander la durée de l'entretien
- Demander la Modalité de l'entretien

Une fois tu as toutes les infos, dis "SEND_EMAIL" dans ta réponse.`

  try {
    console.log('[AI] Generating response with OpenRouter (native API)...')
    console.log('[AI] Conversation history:', JSON.stringify(conversationHistory))
    console.log('[AI] User message:', userMessage)

    // Construire les messages pour OpenRouter
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ]

    console.log('[AI] Messages to send:', JSON.stringify(messages))

    // Appel direct à l'API OpenRouter (sans Vercel AI SDK)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'WinkAI Agent'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // ⬅️ Nouveau modèle
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[AI] OpenRouter API error:', errorData)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('[AI] OpenRouter response:', data)

    const text = data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse."

    console.log('[AI] Response generated successfully:', text)
    return text

  } catch (error) {
    console.error("[AI] Error generating chat response:", error)
    if (error instanceof Error) {
      console.error("[AI] Error details:", error.message)
      console.error("[AI] Error stack:", error.stack)
    }
    throw error
  }
}