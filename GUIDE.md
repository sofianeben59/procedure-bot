# 🤖 Bot Discord — Procédure Judiciaire
## Guide d'installation complet (pas à pas)

---

## 📁 FICHIERS INCLUS
- `index.js` → Le code du bot
- `.env` → Votre token secret Discord
- `package.json` → Les dépendances du bot
- `GUIDE.md` → Ce guide

---

## ÉTAPE 1 — Créer votre bot sur Discord

1. Allez sur https://discord.com/developers/applications
2. Cliquez sur **"New Application"** (haut à droite)
3. Donnez un nom à votre bot (ex: "Procédure Bot") → Cliquez **Create**
4. Dans le menu gauche, cliquez sur **"Bot"**
5. Cliquez sur **"Reset Token"** → Copiez le token affiché
6. ⚠️ **NE PARTAGEZ JAMAIS ce token avec personne**

### Activer les permissions du bot :
Dans la page **Bot**, activez ces 3 options :
- ✅ PRESENCE INTENT
- ✅ SERVER MEMBERS INTENT
- ✅ MESSAGE CONTENT INTENT

---

## ÉTAPE 2 — Inviter le bot sur votre serveur

1. Dans le menu gauche → **"OAuth2"** → **"URL Generator"**
2. Cochez **"bot"** dans SCOPES
3. Cochez ces permissions dans BOT PERMISSIONS :
   - ✅ Send Messages
   - ✅ Read Messages/View Channels
   - ✅ Use Slash Commands
   - ✅ Embed Links
4. Copiez l'URL générée en bas → Ouvrez-la dans votre navigateur
5. Choisissez votre serveur → Cliquez **Autoriser**

---

## ÉTAPE 3 — Configurer le fichier .env

Ouvrez le fichier `.env` et remplacez :
```
DISCORD_TOKEN=METTEZ_VOTRE_TOKEN_ICI
```
Par votre vrai token copié à l'étape 1 :
```
DISCORD_TOKEN=MTIzN...votre_vrai_token_ici
```

---

## ÉTAPE 4 — Héberger le bot gratuitement sur Railway

1. Créez un compte gratuit sur https://railway.app
2. Cliquez **"New Project"** → **"Deploy from GitHub repo"**
   - OU cliquez **"Deploy from template"** → cherchez **Node.js**
3. Uploadez vos 3 fichiers : `index.js`, `package.json`, `.env`
4. Dans les paramètres du projet → **"Variables"** → ajoutez :
   - Clé : `DISCORD_TOKEN`
   - Valeur : votre token
5. Cliquez **Deploy** → Votre bot démarre automatiquement ✅

---

## ÉTAPE 5 — Utiliser le bot

Dans n'importe quel salon de votre serveur, tapez :
```
!procedure
```
Le bot vous posera les questions avec des boutons cliquables jusqu'au résultat final.

---

## 🔁 LOGIQUE DU BOT

```
!procedure
    │
    ├── 🔴 Rouge → Procédure normale ✅
    │
    └── 🟢 Verte
            │
            ├── Crime OU refuse les chefs ?
            │       │
            │       ├── NON (accepte + pas de crime) → Procédure sans procureur ✅
            │       │
            │       └── OUI → Appel procureur
            │                   │
            │                   ├── Procureur dispo → Verdict procureur ✅
            │                   │
            │                   └── Procureur indispo
            │                           │
            │                           ├── Pas de crime → Appel CS
            │                           │       ├── CS dispo → Verdict CS ✅
            │                           │       └── CS indispo → Bracelet 🚨
            │                           │
            │                           └── Crime/refus → Bracelet direct 🚨
            │                               (CS ne peut pas gérer)
```

---

## ❓ BESOIN D'AIDE ?

Si vous avez une question, revenez sur Claude et décrivez votre problème.
