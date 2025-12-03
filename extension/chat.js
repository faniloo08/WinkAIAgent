/* global chrome */

// Variables globales
let chatContainer
let messageInput
let sendBtn
let typingIndicator
let conversationHistory = []

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Chat] Interface chat chargée')
  
  // Récupérer les éléments du DOM
  chatContainer = document.getElementById('chatContainer')
  messageInput = document.getElementById('messageInput')
  sendBtn = document.getElementById('sendBtn')
  typingIndicator = document.getElementById('typingIndicator')
  
  // Vérifier que tous les éléments existent
  if (!chatContainer) {
    console.error('[Chat] ❌ Element #chatContainer non trouvé')
  }
  if (!messageInput) {
    console.error('[Chat] ❌ Element #messageInput non trouvé')
    return // Arrêter l'initialisation si l'input n'existe pas
  }
  if (!sendBtn) {
    console.error('[Chat] ❌ Element #sendBtn non trouvé')
  }
  if (!typingIndicator) {
    console.warn('[Chat] ⚠️ Element #typingIndicator non trouvé')
  }
  
  console.log('[Chat] ✅ Tous les éléments sont chargés')
  
  // Focus automatique sur l'input
  messageInput.focus()
  
  // Gérer l'envoi avec Enter
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  })
  
  // Gérer l'envoi avec le bouton
  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendMessage)
  }
})

async function handleSendMessage() {
  const message = messageInput.value.trim()
  
  if (!message) {
    console.log('[Chat] Message vide, annulation')
    return
  }
  
  console.log('[Chat] Envoi du message:', message)
  console.log('[Chat] Historique AVANT:', JSON.stringify(conversationHistory))
  
  // Afficher le message de l'utilisateur
  addMessage(message, 'user')
  messageInput.value = ''
  
  // IMPORTANT: Ajouter le message utilisateur à l'historique AVANT l'appel API
  conversationHistory.push({ role: 'user', content: message })
  
  console.log('[Chat] Historique AVEC user message:', JSON.stringify(conversationHistory))
  
  // Désactiver l'input pendant le traitement
  messageInput.disabled = true
  if (sendBtn) sendBtn.disabled = true
  
  // Afficher l'indicateur de saisie
  if (typingIndicator) {
    typingIndicator.classList.add('active')
  }
  
  try {
    console.log('[Chat] Appel API avec historique complet...')
    // Appeler l'API - elle reçoit l'historique avec le dernier message user
    const response = await getAIResponse(message)
    
    console.log('[Chat] Réponse reçue:', response)
    
    // Ajouter la réponse de l'assistant à l'historique
    conversationHistory.push({ role: 'assistant', content: response })
    
    console.log('[Chat] Historique FINAL:', JSON.stringify(conversationHistory))
    console.log('[Chat] Nombre de messages dans historique:', conversationHistory.length)
    
    // Afficher la réponse
    addMessage(response, 'bot')
    
  } catch (error) {
    console.error('[Chat] Erreur:', error)
    // Retirer le dernier message user en cas d'erreur
    conversationHistory.pop()
    addMessage("Désolé, j'ai rencontré une erreur. Pouvez-vous réessayer ?", 'bot')
  } finally {
    // Réactiver l'input
    if (typingIndicator) {
      typingIndicator.classList.remove('active')
    }
    messageInput.disabled = false
    if (sendBtn) sendBtn.disabled = false
    messageInput.focus()
  }
}

function addMessage(text, sender) {
  if (!chatContainer) {
    console.error('[Chat] Cannot add message: chatContainer is null')
    return
  }
  
  const messageDiv = document.createElement('div')
  messageDiv.className = `message ${sender}`
  messageDiv.textContent = text
  
  chatContainer.appendChild(messageDiv)
  
  // Scroll vers le bas
  chatContainer.scrollTop = chatContainer.scrollHeight
}

async function getAIResponse(message) {
  try {
    console.log('[Chat] Fetch API:', 'http://localhost:3000/api/chat')
    console.log('[Chat] Envoi historique:', JSON.stringify(conversationHistory))
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory.slice(0, -1) // Envoyer l'historique SANS le dernier message user
      })
    })

    console.log('[Chat] Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Chat] API Error:', errorData)
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log('[Chat] API Response data:', data)
    
    // Gérer l'envoi d'email si nécessaire
    if (data.shouldSendEmail) {
      console.log('[Chat] 📧 SEND_EMAIL détecté')
      
      if (data.emailSent) {
        console.log('[Chat] ✅ Email envoyé avec succès:', data.emailResult)
      } else {
        console.log('[Chat] ❌ Email NON envoyé')
      }
    }
    
    return data.response || "Désolé, je n'ai pas pu générer une réponse."
    
  } catch (error) {
    console.error('[Chat] getAIResponse error:', error)
    throw error
  }
}

function extractEmail(text) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
  const match = text.match(emailRegex)
  return match ? match[0] : null
}

// Fonction pour envoyer via votre backend (à adapter)
async function sendEmailViaBackend(email) {
  try {
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateEmail: email,
        candidateName: 'Candidat',
        postTitle: 'Poste',
        interviewDate: 'À définir',
        interviewTime: 'À définir',
        interviewDuration: 'À définir',
        interviewLocation: 'À définir'
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('[Chat] Erreur envoi email:', error)
    return false
  }
}