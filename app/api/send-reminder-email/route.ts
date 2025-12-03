import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

interface SendReminderRequest {
  candidateEmail: string
  candidateName: string
  position: string
  interviewDate: string
  interviewTime: string
}

export async function POST(request: NextRequest) {
  try {
    const { candidateEmail, candidateName, position, interviewDate, interviewTime }: SendReminderRequest =
      await request.json()

    console.log('[API] Send reminder email request:', {
      candidateEmail,
      candidateName,
      position
    })

    // Validate inputs
    if (!candidateEmail || !candidateName || !position || !interviewDate || !interviewTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate new confirmation token
    const confirmationToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Send email via EmailJS (reminder template)
    console.log('[API] Sending reminder via EmailJS...')
    const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID_2,
        template_id: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_2,
        user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY_2,
        template_params: {
          to_email: candidateEmail,
          candidate_name: candidateName,
          position: position,
          interview_date: interviewDate,
          interview_time: interviewTime,
          confirmation_link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/confirm-interview?email=${encodeURIComponent(candidateEmail)}&token=${confirmationToken}`,
        },
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('[API] EmailJS error:', errorData)
      throw new Error("Failed to send reminder email")
    }

    console.log('[API] Reminder sent successfully via EmailJS')

    // Update candidate in database
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: candidate, error: updateError } = await supabaseAdmin
      .from("candidates")
      .update({ 
        status: "reminder_sent",
        updated_at: new Date().toISOString()
      })
      .eq("email", candidateEmail)
      .select()
      .single()

    if (updateError) {
      console.error("[API] Database error:", updateError)
      throw updateError
    }

    console.log('[API] Candidate status updated to reminder_sent')

    // Log reminder sent
    if (candidate) {
      await supabaseAdmin.from("emails_sent").insert({
        candidate_id: candidate.id,
        email_type: "reminder",
        status: "sent",
      })

      // Save new confirmation token
      await supabaseAdmin.from("confirmations").insert({
        candidate_id: candidate.id,
        confirmation_token: confirmationToken,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Reminder email sent successfully",
    })
  } catch (error) {
    console.error("[API] Send reminder error:", error)
    return NextResponse.json({ 
      error: "Failed to send reminder",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}