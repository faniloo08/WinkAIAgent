/* global chrome */

console.log("[v0] WinkLab AI Agent content script loaded at", new Date().toISOString())

// Configuration
const CONFIG = {
  backendUrl: "http://localhost:3000/api/send-email",
  columnContainerSelector: '.cmcxc3',
  columnTitleSelector: '[title="Entretien responsable recrutement"]',
  candidateCardSelector: '.cmcxj3',
  candidateNameSelector: '.cmcxn3',
  candidateEmailSelector: '.coaXaZaR',
}

// Verify the script is running
if (document.readyState === "loading") {
  console.log("[v0] Document still loading, waiting for DOMContentLoaded")
  document.addEventListener("DOMContentLoaded", initializeAgent)
} else {
  console.log("[v0] Document already loaded, initializing immediately")
  initializeAgent()
}

function initializeAgent() {
  console.log("[v0] Initializing WinkLab AI Agent")

  try {
    createFloatingWidget()
    console.log("[v0] Floating widget created successfully")
  } catch (error) {
    console.error("[v0] Error creating widget:", error)
  }

  try {
    initializeObserver()
    console.log("[v0] Observer initialized successfully")
  } catch (error) {
    console.error("[v0] Error initializing observer:", error)
  }

  try {
    checkForNewCandidates()
    console.log("[v0] Initial candidate check completed")
  } catch (error) {
    console.error("[v0] Error checking candidates:", error)
  }
}

function createFloatingWidget() {
  // Check if widget already exists
  if (document.getElementById("winklab-ai-widget")) {
    console.log("[v0] Widget already exists, skipping creation")
    return
  }

  const widget = document.createElement("div")
  widget.id = "winklab-ai-widget"
  widget.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    font-size: 28px;
    z-index: 9999;
    transition: transform 0.2s, box-shadow 0.2s;
    user-select: none;
  `

  widget.innerHTML = "🤖"

  widget.addEventListener("mouseenter", () => {
    widget.style.transform = "scale(1.1)"
    widget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.6)"
  })

  widget.addEventListener("mouseleave", () => {
    widget.style.transform = "scale(1)"
    widget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)"
  })

  widget.addEventListener("click", () => {
    console.log("[v0] Widget clicked! Sending message to background...")
    
    // Feedback visuel immédiat
    widget.style.transform = "scale(0.95)"
    widget.style.opacity = "0.6"
    
    // Envoyer le message au background script
    chrome.runtime.sendMessage({ action: "openChat" }, (response) => {
      // Gérer la réponse
      if (chrome.runtime.lastError) {
        console.error("[v0] Error:", chrome.runtime.lastError.message)
        alert("Erreur lors de l'ouverture du chat. Vérifiez que chat.html existe.")
      } else {
        console.log("[v0] Response from background:", response)
      }
      
      // Restaurer le style
      setTimeout(() => {
        widget.style.transform = "scale(1)"
        widget.style.opacity = "1"
      }, 200)
    })
  })

  document.body.appendChild(widget)
  console.log("[v0] Floating widget successfully added to page")
}

function initializeObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        checkForNewCandidates()
      }
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  console.log("[v0] MutationObserver initialized")
}

function checkForNewCandidates() {
  const titleDiv = document.querySelector(CONFIG.columnTitleSelector)

  let section = null
  if (titleDiv) {
    section = titleDiv.closest(CONFIG.columnContainerSelector)
  }

  if (!section) {
    console.log("[v0] Section 'Entretien responsable' non trouvée")
    return
  }

  const candidates = section.querySelectorAll(CONFIG.candidateCardSelector)
  console.log("[v0] Trouvé", candidates.length, "cartes de candidat dans la bonne colonne")

  candidates.forEach((card) => {
    if (card.dataset.processed === "true") return

    const name = card.querySelector(CONFIG.candidateNameSelector)?.textContent || "Inconnu"
    const email = card.querySelector(CONFIG.candidateEmailSelector)?.textContent || ""

    if (email) {
      markCardForProcessing(card)
      console.log("[v0] Nouveau candidat détecté:", { name, email })
    }
  })
}

function markCardForProcessing(card) {
  card.dataset.processed = "true"

  const button = document.createElement("button")
  button.textContent = "📧 Envoyer email"
  button.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 6px 12px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    z-index: 1000;
    transition: background-color 0.2s;
  `

  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "#2563eb"
  })

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "#3b82f6"
  })

  button.onclick = () => sendEmailForCandidate(card)
  card.style.position = "relative"
  card.appendChild(button)
}

async function sendEmailForCandidate(card) {
  const name = card.querySelector(CONFIG.candidateNameSelector)?.textContent || "Candidat"
  const email = card.querySelector(CONFIG.candidateEmailSelector)?.textContent || ""

  if (!email) {
    alert("Email du candidat non trouvé")
    return
  }

  const interviewData = {
    candidateName: name,
    candidateEmail: email,
    postTitle: document.querySelector('[class*="post-title"]')?.textContent || "Poste non spécifié",
    interviewDate: "À définir",
    interviewTime: "À définir",
    interviewDuration: "À définir",
    interviewLocation: "À définir",
  }

  try {
    const response = await fetch(CONFIG.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(interviewData),
    })

    if (response.ok) {
      alert("Email envoyé avec succès à " + email)
      console.log("[v0] Email envoyé:", interviewData)
    } else {
      const errorText = await response.text()
      console.error("[v0] Erreur serveur:", errorText)
      alert("Erreur lors de l'envoi de l'email")
    }
  } catch (error) {
    console.error("[v0] Erreur:", error)
    alert("Erreur lors de l'envoi de l'email: " + error.message)
  }
}