import emailjs from "@emailjs/browser"

export interface SendEmailParams {
  to_email: string
  to_name: string
  candidate_name: string
  position: string
  interview_date: string
  interview_time: string
  interview_mode: string
  confirmation_link?: string
}

export interface SendReminderEmailParams {
  to_email: string
  candidate_name: string
  position: string
  interview_date: string
  interview_time: string
  confirmation_link?: string
}

let emailjsInitialized = false

function initializeEmailJS() {
  if (!emailjsInitialized) {
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    if (!publicKey) {
      throw new Error("NEXT_PUBLIC_EMAILJS_PUBLIC_KEY is not configured")
    }
    emailjs.init(publicKey)
    emailjsInitialized = true
  }
}

export async function sendInterviewEmail(params: SendEmailParams): Promise<string> {
  try {
    initializeEmailJS()

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID

    if (!serviceId || !templateId) {
      throw new Error("EmailJS interview email configuration is missing")
    }

    const response = await emailjs.send(serviceId, templateId, {
      to_email: params.to_email,
      to_name: params.to_name,
      candidate_name: params.candidate_name,
      position: params.position,
      interview_date: params.interview_date,
      interview_time: params.interview_time,
      interview_mode: params.interview_mode,
      confirmation_link: params.confirmation_link || "",
    })

    console.log("[EmailJS] Interview email sent successfully:", response)
    return response.status.toString()
  } catch (error) {
    console.error("[EmailJS] Error sending interview email:", error)
    throw error
  }
}

export async function sendReminderEmail(params: SendReminderEmailParams): Promise<string> {
  try {
    initializeEmailJS()

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID_2
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_2

    if (!serviceId || !templateId) {
      throw new Error("EmailJS reminder email configuration is missing")
    }

    const response = await emailjs.send(serviceId, templateId, {
      to_email: params.to_email,
      candidate_name: params.candidate_name,
      position: params.position,
      interview_date: params.interview_date,
      interview_time: params.interview_time,
      confirmation_link: params.confirmation_link || "",
    })

    console.log("[EmailJS] Reminder email sent successfully:", response)
    return response.status.toString()
  } catch (error) {
    console.error("[EmailJS] Error sending reminder email:", error)
    throw error
  }
}
