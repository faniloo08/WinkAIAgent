# WinkLab AI Agent

Automatise l'envoi d'emails de convocation d'entretien pour vos candidats sur WinkLab.

## Installation

### 1. Prérequis
- Node.js 18+ installé
- npm ou yarn
- Chrome ou Chromium

### 2. Cloner et installer les dépendances

\`\`\`bash
# Créer le dossier du projet
mkdir wink-ai-agent
cd wink-ai-agent

# Copier tous les fichiers listés ci-dessous
# Puis installer les dépendances
npm install
\`\`\`

### 3. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :



### 4. Démarrer le serveur local

\`\`\`bash
npm run dev
\`\`\`

Le serveur démarre sur `http://localhost:3000`

### 5. Charger l'extension Chrome

1. Ouvrez Chrome et allez sur `chrome://extensions/`
2. Activez le "Mode développeur" (coin haut-droit)
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier `extension/` de votre projet

### 6. Adapter les sélecteurs CSS

Vous DEVEZ adapter les sélecteurs CSS dans `extension/content.js` selon votre interface WinkLab :

**Dans la console du navigateur (F12), inspectez les éléments suivants et notez leurs classes CSS :**

- La section "Entretien responsable"
- Une carte candidat
- Le nom du candidat
- L'email du candidat
- Le titre du poste

Puis mettez à jour le `CONFIG` dans `extension/content.js`.

## Utilisation

1. Allez sur WinkLab
2. Mettez des candidats dans la section "Entretien responsable"
3. Cliquez sur le bouton "📧 Envoyer email" qui apparaît sur chaque carte
4. L'email sera généré par IA et envoyé automatiquement

## Structure des fichiers

\`\`\`
wink-ai-agent/
├── app/
│   ├── api/send-email/route.ts      # API backend
│   ├── dashboard/page.tsx            # Dashboard
│   ├── layout.tsx                    # Layout racine
│   └── globals.css                   # Styles globaux
├── extension/
│   ├── manifest.json                 # Configuration extension
│   ├── content.js                    # Script d'injection WinkLab
│   ├── background.js                 # Service worker
│   ├── popup.html                    # Popup extension
│   └── popup.js                      # Logique popup
├── package.json
├── next.config.js
└── tsconfig.json
\`\`\`

## Dépannage

### L'extension n'envoie pas d'emails
- Vérifiez que le serveur local (`npm run dev`) est lancé
- Regardez la console (F12) pour les erreurs
- Assurez-vous que les sélecteurs CSS sont corrects

### Erreur OpenRouter
- Vérifiez que votre clé API OpenRouter est valide
- Vérifiez que vous avez du crédit disponible

### Erreur EmailJS
- Vérifiez les IDs EmailJS dans `.env.local`
- Testez directement sur le site EmailJS

## Support

Pour plus d'aide, consultez :
- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [WinkLab Documentation](https://app.wink-lab.com)
