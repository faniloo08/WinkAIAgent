import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron secret (ou autoriser en dev)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON] Unauthorized request')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('[CRON] Starting reminder check...')

    const supabaseAdmin = getSupabaseAdmin()

    // Get candidates with status 'sent' and created more than 48 hours ago
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

    const { data: candidates, error } = await supabaseAdmin
      .from("candidates")
      .select("*")
      .eq("status", "sent")
      .lt("created_at", fortyEightHoursAgo.toISOString())

    if (error) {
      console.error('[CRON] Error fetching candidates:', error)
      throw error
    }

    console.log('[CRON] Found candidates needing reminder:', candidates?.length || 0)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No reminders to send",
        sent: 0,
      })
    }

    let remindersSent = 0
    let remindersFailed = 0

    // Send reminder emails
    for (const candidate of candidates) {
      try {
        console.log(`[CRON] Sending reminder to ${candidate.email}...`)

        const reminderResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-reminder-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateEmail: candidate.email,
              candidateName: candidate.name,
              position: candidate.position,
              interviewDate: candidate.interview_date,
              interviewTime: candidate.interview_time,
            }),
          },
        )

        if (reminderResponse.ok) {
          remindersSent++
          console.log(`[CRON] ✅ Reminder sent to ${candidate.email}`)
        } else {
          remindersFailed++
          console.error(`[CRON] ❌ Failed to send reminder to ${candidate.email}`)
        }
      } catch (err) {
        remindersFailed++
        console.error(`[CRON] ❌ Exception sending reminder to ${candidate.email}:`, err)
      }
    }

    console.log(`[CRON] Reminder job complete. Sent: ${remindersSent}, Failed: ${remindersFailed}`)

    return NextResponse.json({
      success: true,
      message: `Reminders sent successfully`,
      sent: remindersSent,
      failed: remindersFailed,
      total: candidates.length,
    })
  } catch (error) {
    console.error("[CRON] Cron reminder error:", error)
    return NextResponse.json({ 
      error: "Failed to send reminders",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}