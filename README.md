# Projet JS_L2_GL - Plateforme Collaborative

Ce projet est une application web full-stack conçue comme une plateforme collaborative. Elle intègre des fonctionnalités en temps réel pour la communication, la gestion d'événements, le partage de fichiers et des quiz interactifs. L'application est divisée en deux parties principales : un backend construit avec Node.js/Express et un frontend avec React.js.

## 🚀 Fonctionnalités Clés

L'analyse du code révèle les fonctionnalités suivantes :

### Backend (Serveur)
- **Gestion des Utilisateurs et Authentification** : Inscription, connexion et gestion des profils utilisateurs avec authentification sécurisée par JWT (JSON Web Tokens).
- **Messagerie en Temps Réel** : Salons de discussion (rooms) où les utilisateurs peuvent envoyer et recevoir des messages, fichier instantanément grâce à Socket.IO.
- **Gestion de Présence** : Suivi des utilisateurs en ligne et hors ligne.
- **Gestion d'Événements** : Création, consultation et gestion d'événements.
- **Partage de Fichiers** : Upload et gestion de fichiers via des middlewares (Multer), permettant aux utilisateurs de partager des documents.
- **Quiz Interactifs** : Un système de quiz que les utilisateurs peuvent passer.
- **Sécurité** : Utilisation de middlewares pour la validation des données, la gestion des permissions (admin/utilisateur) et la protection des routes.

### Frontend (Client)
- **Interface Réactive** : Interface utilisateur moderne et dynamique construite avec React.
- **Navigation et Routage** : Navigation fluide entre les pages (Accueil, Connexion, Tableau de bord) en utilisant `react-router-dom`.
- **Composants UI** :
  - **Authentification** : Pages de connexion et d'inscription.
  - **Tableau de bord** : Une vue principale après connexion (`DashBoardLayout`).
  - **Messagerie** : Composants pour afficher la liste des discussions et interagir dans une page de discussion.
  - **Événements** : Cartes et formulaires pour afficher et créer des événements.
  - **Fichiers** : Sections pour voir ses fichiers et en publier.
  - **Quiz** : Section dédiée pour participer aux quiz.
- **Communication avec le Backend** : Utilisation d'Axios pour les requêtes API REST et de `socket.io-client` pour la communication en temps réel.

## 🛠️ Technologies Utilisées

### **Backend**
- **Environnement** : Node.js
- **Framework** : Express.js
- **Base de données** : MongoDB avec Mongoose
- **Communication temps réel** : Socket.IO
- **Authentification** : JSON Web Token (jsonwebtoken), Bcrypt
- **Gestion des uploads** : Multer
- **Variables d'environnement** : `dotenv`

### **Frontend**
- **Bibliothèque** : React.js
- **Outil de build** : Vite
- **Routage** : React Router DOM
- **Client HTTP** : Axios
- **Client temps réel** : Socket.IO Client
- **Style** : Tailwind CSS, Lucide React (icônes)
- **Notifications** : React Hot Toast, React Toastify

## ⚙️ Installation et Lancement

Suivez ces étapes pour lancer le projet sur votre machine locale.

### **Prérequis**
- Node.js (version 18 ou supérieure)
- npm
- Une instance de MongoDB en cours d'exécution (locale ou cloud comme MongoDB Atlas)

### 1. Configuration du Backend

```bash
# 1. Allez dans le dossier du backend
cd backEnd

# 2. Installez les dépendances
npm install

# 3. Créez un fichier .env à la racine de /backEnd et configurez-le
# Inspirez-vous de .env.example (s'il existe) ou utilisez les clés suivantes :
# MONGO_URI=<Votre chaîne de connexion MongoDB>
# JWT_SECRET=<Votre clé secrète pour les tokens>
# PORT=5000

# 4. Lancez le serveur de développement
npm run dev
```
Le serveur backend devrait maintenant tourner sur `http://localhost:5000`.

### 2. Configuration du Frontend

```bash
# 1. Depuis la racine du projet, allez dans le dossier du frontend
cd frontEnd

# 2. Installez les dépendances
npm install

# 3. Lancez le serveur de développement Vite
npm run dev
```
L'application React est maintenant accessible à l'adresse indiquée par Vite (généralement `http://localhost:5173`).
