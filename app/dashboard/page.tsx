"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Candidate {
  id: string
  email: string
  name: string
  position: string
  status: string
  interview_date: string
  interview_time: string
  created_at: string
}

export default function Dashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    confirmed: 0,
    reminder_sent: 0,
  })

  useEffect(() => {
    fetchCandidates()
    const interval = setInterval(fetchCandidates, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchCandidates() {
    try {
      const { data, error } = await supabase.from("candidates").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setCandidates(data || [])

      // Calculate stats
      const newStats = {
        total: data?.length || 0,
        sent: data?.filter((c) => c.status === "sent").length || 0,
        confirmed: data?.filter((c) => c.status === "confirmed").length || 0,
        reminder_sent: data?.filter((c) => c.status === "reminder_sent").length || 0,
      }
      setStats(newStats)
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching candidates:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel("candidates-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, () => {
        fetchCandidates()
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
      case "reminder_sent":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Email envoyé"
      case "confirmed":
        return "Confirmé"
      case "reminder_sent":
        return "Relance envoyée"
      case "pending":
        return "En attente"
      default:
        return status
    }
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          WinkLab AI Agent - Dashboard
        </h1>
        <p style={{ color: "#666" }}>Gestion de l'automatisation des emails d'entretien</p>
      </header>

      <div
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
          Statut de l'Agent
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
            }}
          />
          <span style={{ fontSize: "1rem", color: "#374151" }}>
            Extension active - En attente de candidats en "Entretien responsable"
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginTop: "2rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard label="Total de candidats" value={stats.total} color="#3b82f6" />
        <StatCard label="Emails envoyés" value={stats.sent} color="#10b981" />
        <StatCard label="Confirmés" value={stats.confirmed} color="#8b5cf6" />
        <StatCard label="Relances envoyées" value={stats.reminder_sent} color="#f59e0b" />
      </div>

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
          Historique des Candidats
        </h2>

        {loading ? (
          <p style={{ color: "#666" }}>Chargement...</p>
        ) : candidates.length === 0 ? (
          <p style={{ color: "#999" }}>
            Aucun candidat pour le moment. Quand vous mettrez un candidat en "Entretien responsable" sur WinkLab, il
            apparaîtra ici.
          </p>
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
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Candidat
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Poste
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Date entretien
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        color: "#111827",
                      }}
                    >
                      {candidate.name}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      {candidate.email}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#666",
                      }}
                    >
                      {candidate.position}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      {candidate.interview_date && candidate.interview_time
                        ? `${candidate.interview_date} à ${candidate.interview_time}`
                        : "Non définie"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: getStatusColor(candidate.status),
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                        }}
                      >
                        {getStatusLabel(candidate.status)}
                      </span>
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
        }}
      >
        <p>Version 2.0.0 - WinkLab AI Agent avec Chatbot</p>
        <p>Dashboard en temps réel connecté à Supabase.</p>
      </footer>
    </div>
  )
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
      }}
    >
      <p style={{ color: "#666", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>{label}</p>
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
