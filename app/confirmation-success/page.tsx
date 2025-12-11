"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function ConfirmationSuccess() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    if (email) {
      confirmInterview(email)
    } else {
      setStatus("error")
    }
  }, [email])

  async function confirmInterview(candidateEmail: string) {
    try {
      console.log("[Confirmation] Confirming for:", candidateEmail)
      
      const response = await fetch("/api/confirm-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: candidateEmail,
          status: "confirmed",
        }),
      })

      console.log("[Confirmation] Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[Confirmation] Success:", data)
        setStatus("success")
      } else {
        const errorData = await response.json()
        console.error("[Confirmation] Error:", errorData)
        setStatus("error")
      }
    } catch (error) {
      console.error("[Confirmation] Exception:", error)
      setStatus("error")
    }
  }

  return (
    <div style={{ 
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "2rem"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "3rem",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        textAlign: "center"
      }}>
        {status === "loading" && (
          <>
            <div style={{
              width: "60px",
              height: "60px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #667eea",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1.5rem"
            }} />
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "#333" }}>
              Confirmation en cours...
            </h1>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#10b981",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "3rem"
            }}>
              ✓
            </div>
            <h1 style={{ 
              fontSize: "2rem", 
              marginBottom: "1rem", 
              color: "#10b981",
              fontWeight: "bold"
            }}>
              Confirmation réussie !
            </h1>
            <p style={{ 
              fontSize: "1.1rem", 
              color: "#666", 
              marginBottom: "2rem",
              lineHeight: "1.6"
            }}>
              Votre présence à l'entretien a été confirmée avec succès. 
              Vous recevrez un email de confirmation sous peu.
            </p>
            <div style={{
              backgroundColor: "#f0fdf4",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid #86efac",
              marginBottom: "1.5rem"
            }}>
              <p style={{ margin: 0, color: "#166534", fontSize: "0.9rem" }}>
                📧 Email confirmé : <strong>{email}</strong>
              </p>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#999" }}>
              Vous pouvez fermer cette page.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#ef4444",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "3rem",
              color: "white"
            }}>
              ✕
            </div>
            <h1 style={{ 
              fontSize: "2rem", 
              marginBottom: "1rem", 
              color: "#ef4444",
              fontWeight: "bold"
            }}>
              Erreur
            </h1>
            <p style={{ 
              fontSize: "1.1rem", 
              color: "#666", 
              marginBottom: "1rem" 
            }}>
              Une erreur s'est produite lors de la confirmation.
            </p>
            <p style={{ fontSize: "0.9rem", color: "#999" }}>
              Veuillez contacter l'équipe RH directement.
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}