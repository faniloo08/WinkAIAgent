import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

interface SendEmailRequest {
  candidateEmail: string
  candidateName: string
  position: string
  interviewDate: string
  interviewTime: string
  modalite?: string
  duree?: string
}

// Generate Google Calendar link
function generateGoogleCalendarLink(title: string, date: string, time: string, duration = 30) {
  const startDate = new Date(`${date}T${time}`)
  const endDate = new Date(startDate.getTime() + duration * 60000)

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "")

  const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}`

  return calendarLink
}

export async function POST(request: NextRequest) {
  try {
    const { 
      candidateEmail, 
      candidateName, 
      position, 
      interviewDate, 
      interviewTime,
      modalite = "En ligne",
      duree = "30"
    }: SendEmailRequest = await request.json()

    console.log('[API] Send interview email request:', {
      candidateEmail,
      candidateName,
      position,
      interviewDate,
      interviewTime
    })

    // Validate inputs
    if (!candidateEmail || !candidateName || !position || !interviewDate || !interviewTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate confirmation token
    const confirmationToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Generate Google Calendar link
    const googleCalendarLink = generateGoogleCalendarLink(
      `Entretien - ${position}`, 
      interviewDate, 
      interviewTime,
      parseInt(duree)
    )

    // Send email via EmailJS
    console.log('[API] Sending email via EmailJS...')
    const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        template_id: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: candidateEmail,
          candidate_name: candidateName,
          position: position,
          interview_date: interviewDate,
          interview_time: interviewTime,
          duration: `${duree} minutes`,
          modalite: modalite,
          google_calendar_link: googleCalendarLink,
          confirmation_link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/confirm-interview?email=${encodeURIComponent(candidateEmail)}&token=${confirmationToken}`,
        },
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('[API] EmailJS error:', errorData)
      throw new Error("Failed to send email via EmailJS")
    }

    console.log('[API] Email sent successfully via EmailJS')

    // Save to database
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from("candidates")
      .upsert({
        email: candidateEmail,
        name: candidateName,
        position: position,
        interview_date: interviewDate,
        interview_time: interviewTime,
        google_calendar_link: googleCalendarLink,
        status: "sent",
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (candidateError) {
      console.error("[API] Database error:", candidateError)
      throw candidateError
    }

    console.log('[API] Candidate saved to database:', candidate)

    // Log email sent
    if (candidate) {
      await supabaseAdmin.from("emails_sent").insert({
        candidate_id: candidate.id,
        email_type: "interview",
        status: "sent",
      })

      // Save confirmation token
      await supabaseAdmin.from("confirmations").insert({
        candidate_id: candidate.id,
        confirmation_token: confirmationToken,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Email envoyé avec succès",
      candidate,
    })
  } catch (error) {
    console.error("[API] Send email error:", error)
    return NextResponse.json({ 
      error: "Failed to send email",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}