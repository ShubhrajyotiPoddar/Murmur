# Murmur 🕊️
### Secure, Real-Time Messaging Architecture

**Murmur** is a high-performance, full-stack messaging application designed with a focus on real-time communication, automated lifecycle management, and scalable cloud deployment. Built using a modern TypeScript stack, it demonstrates an end-to-end architecture from secure backend services to a responsive, state-driven frontend.

🔗 **[Live Demo](http://140.245.204.147/)**

---

## 🏗️ Architecture Overview

The system follows a decoupled architecture, optimized for performance and reliability:

- **Primary Backend:** A TypeScript Node.js/Express server handling authentication, business logic, and file management.
- **WebSocket Layer:** Real-time event propagation via `ws` and Redis Pub/Sub, enabling instant messaging and online status tracking.
- **Database Layer:** PostgreSQL for persistent storage of users, relationships, and message history.
- **Caching Layer:** Redis utilized for session-based online user tracking and cross-process message synchronization.
- **Frontend:** A high-speed React application powered by Vite, utilizing Zustand for lightweight state management and a component-driven UI.

---

## ✨ Key Features

- **Real-Time Communication:** Instant message delivery using WebSockets with Redis fallback logic.
- **Automated Lifecycle Management:** A built-in cleanup service that prunes expired media and synchronizes database state.
- **Secure Authentication:** JWT-based stateless authentication with password hashing via `bcryptjs`.
- **Media Uploads:** Integrated file handling for sharing attachments within conversations.
- **Relationship Management:** Request-based system for managing contacts and pending connections.
- **Cloud Native:** Architecture specifically designed for deployment on Oracle Cloud Infrastructure (OCI).

---

## 🛠️ Tech Stack

### Backend
- **Language:** TypeScript
- **Framework:** Node.js / Express
- **Database:** PostgreSQL (Persistence)
- **Cache/PubSub:** Redis (Real-time state)
- **Auth:** JWT (JSON Web Tokens)
- **Tools:** `node-cron` (Job scheduling), `multer` (File uploads)

### Frontend
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **State Management:** Zustand
- **Routing:** React Router 7
- **Styling:** Vanilla CSS / Responsive Design
- **API Client:** Axios

### Infrastructure & DevOps
- **Hosting:** Oracle Cloud Infrastructure (OCI) Compute Instance (Ubuntu)
- **Server:** Node.js Environment
- **Security:** SSH-key based access, environment-based configuration

---

## 📂 Project Structure

```text
Murmur/
├── primary_backend/      # Express API & WebSocket Server
│   ├── src/
│   │   ├── config/       # DB & Redis configurations
│   │   ├── controller/   # Request handlers
│   │   ├── middleware/   # Auth & Upload guards
│   │   ├── routes/       # API route definitions
│   │   └── services/     # Socket logic & Cleanup jobs
├── secondary_frontend/   # React/Vite Application
│   ├── src/
│   │   ├── api/          # Axios interceptors & endpoints
│   │   ├── features/     # Feature-based components
│   │   ├── hooks/        # Custom React hooks
│   │   └── store/        # Zustand state stores
└── Design/               # Original HTML/CSS Mockups
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (Optional, required for real-time features)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/murmur.git
cd murmur
```

### 2. Backend Setup
```bash
cd primary_backend
npm install
# Create a .env file based on .env.example
npm run build
npm start
```

### 3. Frontend Setup
```bash
cd ../secondary_frontend
npm install
# Create a .env file based on .env.example
npm run dev
```

---

## ☁️ Deployment Note

This project is deployed on an **Oracle Cloud VM**. Leveraging my background as an **OCI Cloud Architect Associate**, the infrastructure was manually provisioned and configured for optimal performance, including:
- Configuring Virtual Cloud Networks (VCNs) and Security Lists.
- Setting up a production-ready Node.js environment.
- Managing persistent data with PostgreSQL and high-speed state with Redis.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Created with passion by a Junior Software Engineer & OCI Cloud Architect.*
