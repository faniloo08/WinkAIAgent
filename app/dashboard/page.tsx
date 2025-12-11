"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface EmailHistory {
  id: string
  candidate_email: string
  candidate_name: string
  post_title: string
  status: string
  interview_date: string
  interview_time: string
  sent_at: string
  confirmed_at: string | null
  reminder_count: number
  last_reminder_at: string | null
}

export default function Dashboard() {
  const [emails, setEmails] = useState<EmailHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    confirmed: 0,
    declined: 0,
    no_response: 0,
  })

  useEffect(() => {
    fetchEmails()
    const interval = setInterval(fetchEmails, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchEmails() {
    try {
      console.log("[Dashboard] Fetching emails from email_history...")
      
      const { data, error } = await supabase
        .from("email_history")
        .select("*")
        .order("sent_at", { ascending: false })

      if (error) {
        console.error("[Dashboard] Error fetching from email_history:", error)
        throw error
      }

      console.log("[Dashboard] Data received:", data)
      setEmails(data || [])

      // Calculate stats
      const newStats = {
        total: data?.length || 0,
        sent: data?.filter((e) => e.status === "sent").length || 0,
        confirmed: data?.filter((e) => e.status === "confirmed").length || 0,
        declined: data?.filter((e) => e.status === "declined").length || 0,
        no_response: data?.filter((e) => e.status === "no_response").length || 0,
      }
      setStats(newStats)
      setLoading(false)
    } catch (error) {
      console.error("[Dashboard] Error fetching emails:", error)
      setLoading(false)
    }
  }

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("email-history-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_history" }, () => {
        console.log("[Dashboard] Change detected, refreshing...")
        fetchEmails()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "#3b82f6"
      case "confirmed":
        return "#10b981"
      case "declined":
        return "#ef4444"
      case "no_response":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Envoyé"
      case "confirmed":
        return "✅ Confirmé"
      case "declined":
        return "❌ Refusé"
      case "no_response":
        return "⏳ Sans réponse"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  async function sendReminder(email: string) {
    try {
      const response = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        alert("Rappel envoyé avec succès !")
        fetchEmails()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      alert("Erreur lors de l'envoi du rappel")
    }
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ 
        padding: "15px", 
        background: "white", 
        borderBottom: "1px solid #e5e7eb",
        marginBottom: "1rem"
      }}>
        <button
          onClick={() => {
            // Si on est dans un popup d'extension
            if (window.opener) {
              window.close() // Ferme la fenêtre et retourne au popup
            } else {
              // Sinon, retour navigateur classique
              window.history.back()
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "transform 0.2s",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ← Retour au chat
        </button>
      </div>
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          🤖 WinkLab AI Agent - Dashboard
        </h1>
        <p style={{ color: "#666" }}>
          Suivi en temps réel des emails d'entretien automatisés
        </p>
      </header>

      {/* Status Card */}
      <div
        style={{
          backgroundColor: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          📡 Statut du système
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: "1rem", color: "#374151" }}>
            Extension active - Chatbot opérationnel
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard label="📊 Total emails" value={stats.total} color="#667eea" />
        <StatCard label="📧 Envoyés" value={stats.sent} color="#3b82f6" />
        <StatCard label="✅ Confirmés" value={stats.confirmed} color="#10b981" />
        <StatCard label="❌ Refusés" value={stats.declined} color="#ef4444" />
        <StatCard label="⏳ Sans réponse" value={stats.no_response} color="#f59e0b" />
      </div>

      {/* Table */}
      <section
        style={{
          backgroundColor: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          📋 Historique des emails
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "#666" }}>Chargement...</p>
          </div>
        ) : emails.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
              📭 Aucun email envoyé pour le moment
            </p>
            <p style={{ fontSize: "0.9rem" }}>
              Utilisez le chatbot pour envoyer votre premier email de convocation
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f9fafb",
                    borderBottom: "2px solid #e5e7eb",
                  }}
                >
                  <th style={headerStyle}>Candidat</th>
                  <th style={headerStyle}>Email</th>
                  <th style={headerStyle}>Poste</th>
                  <th style={headerStyle}>Entretien</th>
                  <th style={headerStyle}>Envoyé le</th>
                  <th style={headerStyle}>Rappels</th>
                  <th style={headerStyle}>Statut</th>
                  <th style={headerStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr
                    key={email.id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9fafb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                  >
                    <td style={cellStyle}>
                      <strong>{email.candidate_name}</strong>
                    </td>
                    <td style={{ ...cellStyle, fontSize: "0.9rem", color: "#666" }}>
                      {email.candidate_email}
                    </td>
                    <td style={cellStyle}>{email.post_title}</td>
                    <td style={{ ...cellStyle, fontSize: "0.9rem" }}>
                      {email.interview_date} à {email.interview_time}
                    </td>
                    <td style={{ ...cellStyle, fontSize: "0.85rem", color: "#666" }}>
                      {formatDateTime(email.sent_at)}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.5rem",
                          backgroundColor: email.reminder_count > 0 ? "#fef3c7" : "#f3f4f6",
                          color: email.reminder_count > 0 ? "#92400e" : "#6b7280",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {email.reminder_count}
                      </span>
                    </td>
                    <td style={{ ...cellStyle }}>
                      <span
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: getStatusColor(email.status),
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          display: "inline-block",
                        }}
                      >
                        {getStatusLabel(email.status)}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      {email.status === "sent" && email.reminder_count < 3 && (
                        <button
                          onClick={() => sendReminder(email.candidate_email)}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#f59e0b",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#d97706")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f59e0b")
                          }
                        >
                          🔔 Rappel
                        </button>
                      )}
                      {email.status === "confirmed" && (
                        <span style={{ color: "#10b981", fontSize: "0.85rem" }}>
                          Confirmé le {email.confirmed_at ? formatDate(email.confirmed_at) : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer
        style={{
          marginTop: "2rem",
          paddingTop: "2rem",
          borderTop: "1px solid #e5e7eb",
          color: "#999",
          fontSize: "0.875rem",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0.25rem 0" }}>
          <strong>Version 2.0.0</strong> - WinkLab AI Agent avec Chatbot IA
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          Dashboard en temps réel • Powered by Supabase & Resend
        </p>
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

const headerStyle = {
  padding: "1rem",
  textAlign: "left" as const,
  fontWeight: 600,
  color: "#374151",
  fontSize: "0.9rem",
}

const cellStyle = {
  padding: "1rem",
  color: "#111827",
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        borderLeft: `4px solid ${color}`,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)"
        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <p style={{ color: "#666", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>
        {label}
      </p>
      <p
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: color,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  )
}