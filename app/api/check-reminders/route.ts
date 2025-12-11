import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // 🔒 Sécurité : Vérifier que c'est bien Make qui appelle (optionnel)
    const apiKey = request.headers.get('x-api-key')
    if (apiKey && apiKey !== process.env.MAKE_API_KEY) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    console.log("[Check-Reminders] Starting automatic reminder check...")

    const supabase = getSupabaseAdmin()

    // 📅 Calculer les dates : entre 1 et 2 jours
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000) // -1 jour
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000) // -2 jours

    console.log("[Check-Reminders] Searching emails between:", {
      from: twoDaysAgo.toISOString(),
      to: oneDayAgo.toISOString()
    })

    // 🔍 Récupérer les emails qui nécessitent une relance
    const { data: emailsToRemind, error: fetchError } = await supabase
      .from('email_history')
      .select('*')
      .eq('status', 'pending') // Pas encore confirmé
      .lt('reminder_count', 3) // Maximum 3 rappels
      .gte('sent_at', twoDaysAgo.toISOString()) // Envoyé il y a au moins 1 jour
      .lte('sent_at', oneDayAgo.toISOString()) // Mais pas plus de 2 jours
      .order('sent_at', { ascending: true })

    if (fetchError) {
      console.error("[Check-Reminders] Fetch error:", fetchError)
      return NextResponse.json({ 
        error: "Erreur lors de la récupération des emails" 
      }, { status: 500 })
    }

    if (!emailsToRemind || emailsToRemind.length === 0) {
      console.log("[Check-Reminders] No emails to remind")
      return NextResponse.json({ 
        success: true,
        message: "Aucun email à relancer pour le moment",
        reminders_sent: 0
      })
    }

    console.log(`[Check-Reminders] Found ${emailsToRemind.length} emails to remind`)

    const results = []
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 📧 Envoyer une relance pour chaque email
    for (const email of emailsToRemind) {
      console.log(`[Check-Reminders] Processing: ${email.candidate_email}`)

      try {
        // Appeler ton API send-reminder existante
        const response = await fetch(`${APP_URL}/api/send-reminder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.candidate_email
          })
        })

        const data = await response.json()

        if (response.ok) {
          console.log(`[Check-Reminders] ✅ Reminder sent to: ${email.candidate_email}`)
          results.push({
            success: true,
            email: email.candidate_email,
            candidate_name: email.candidate_name,
            reminder_count: data.reminderCount || email.reminder_count + 1
          })
        } else {
          console.error(`[Check-Reminders] ❌ Failed for: ${email.candidate_email}`, data.error)
          results.push({
            success: false,
            email: email.candidate_email,
            error: data.error
          })
        }
      } catch (error) {
        console.error(`[Check-Reminders] ❌ Error for: ${email.candidate_email}`, error)
        results.push({
          success: false,
          email: email.candidate_email,
          error: "Erreur d'envoi"
        })
      }

      // ⏱️ Petite pause entre chaque envoi pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`[Check-Reminders] ✅ Completed: ${successCount} success, ${failureCount} failures`)

    return NextResponse.json({
      success: true,
      message: `${successCount} rappel(s) envoyé(s) avec succès`,
      reminders_sent: successCount,
      failures: failureCount,
      details: results
    })

  } catch (error) {
    console.error("[Check-Reminders] Global error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la vérification des rappels" },
      { status: 500 }
    )
  }
}