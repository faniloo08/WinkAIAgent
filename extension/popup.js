// /popup.js

document.getElementById("openDashboard")?.addEventListener("click", () => {
  // --- CORRECTION : OUVRIR DIRECTEMENT L'URL EXTERNE ---
  const dashboardUrl = "http://localhost:3000/dashboard"
  window.chrome.tabs.create({ url: dashboardUrl })
  
  // Optionnel : fermer le popup après avoir lancé l'action
  window.close() 
})

window.chrome.storage.local.get(["status"], (result) => {
  const statusElement = document.getElementById("status")
  if (result?.status === "inactive") {
    statusElement.textContent = "Inactif ✗"
  }
})

console.log("[v0] Popup script loaded")