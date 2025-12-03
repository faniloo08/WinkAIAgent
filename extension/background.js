/* global chrome */

console.log("[v0] Background script loaded at", new Date().toISOString())

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[v0] Message received:", request)

  if (request.action === "openChat") {
    console.log("[v0] openChat action received!")
    
    const chatUrl = chrome.runtime.getURL("chat.html")
    console.log("[v0] Chat URL:", chatUrl)
    
    // Option 1: Ouvrir dans une popup centrée (Chrome calcule la position automatiquement)
    chrome.windows.create({
      url: chatUrl,
      type: "popup",
      width: 500,
      height: 600
      // Pas de left/top = Chrome centre automatiquement
    }, (window) => {
      if (chrome.runtime.lastError) {
        console.error("[v0] Error:", chrome.runtime.lastError)
        sendResponse({ status: "error", error: chrome.runtime.lastError.message })
      } else {
        console.log("[v0] ✅ Window created:", window)
        sendResponse({ status: "opened" })
      }
    })
    
    return true // CRUCIAL pour sendResponse asynchrone
  }

  if (request.action === "openDashboard") {
    chrome.tabs.create({ url: "http://localhost:3000/dashboard" }, () => {
      console.log("[v0] Dashboard tab opened")
      sendResponse({ status: "opened" })
    })
    return true
  }
})

chrome.runtime.onInstalled.addListener(() => {
  console.log("[v0] Extension installed/updated")
})