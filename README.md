# Zafkiel Arcade 1: Emperor of Time 🕒🌑

![Zafkiel Arcade Header](assets/header.png)

[![Version](https://img.shields.io/badge/version-1.0.0-crimson.svg)](https://github.com/Curzyori/Zafkiel-Arcade-1)
[![License](https://img.shields.io/badge/license-MIT-gold.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Linux-black.svg)](https://github.com/Curzyori/Zafkiel-Arcade-1)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20SQLite-blue.svg)](https://github.com/Curzyori/Zafkiel-Arcade-1)

**Zafkiel Arcade** is a high-stakes, time-manipulating survival game inspired by the aesthetic of *Kurumi Tokisaki*. Built with a robust **Modular Monolith** architecture, it combines real-time game logic with secure backend persistence and a stunning Gothic-Crimson interface.

---

## 🎭 Game Concept: "City of Devouring Time"

In this arcade environment, time is your greatest resource and your deadliest enemy. You play as the **Emperor of Time**, managing your *Time Essence* while surviving against aggressive temporal anomalies.

### ⚔️ Key Mechanics
- **Temporal Survival**: Your HP (*Time Essence*) drains constantly (-1/s). You must collect **Essence Stars** to survive.
- **Aggressive Difficulty Scaling**: The longer you survive, the more aggressive the temporal rift becomes. Enemies spawn faster and move quicker as your score increases.
- **Temporal Skills**: Use the power of Zafkiel to manipulate the battlefield:
    - 🕒 **REWIND**: Reverse the flow of time to reposition yourself.
    - ❄️ **FREEZE**: Stop all entities in their tracks for strategic planning.
    - ⚡ **ACCEL**: Speed up time to quickly harvest resources (High Risk/High Reward).
    - 🌌 **COLLECT**: A massive temporal vacuum that sucks in all nearby entities.

---

## 🛠️ Technical Architecture

The project is designed with scalability and security in mind, suitable for a professional portfolio.

### 🏗️ Core Stack
- **Frontend**: Vite + React with **Framer Motion** for liquid-smooth animations and **Lucide React** for iconography.
- **Backend**: **Express.js v5** (Modular Monolith) with structured middleware.
- **Database**: **PostgreSQL** via **Supabase** for cloud persistence and Vercel compatibility.
- **Validation**: **Zero-Trust** architecture using **Zod** for schema validation on every API endpoint.
- **Security**: Implementation of `express-rate-limit` and custom CORS policies to prevent exploitation.

### 📁 Directory Structure
```text
Zafkiel-Arcade-1/
├── core/
│   └── engine.js          # Centralized game & time-manipulation logic
├── interface/
│   ├── api/               # Secure Express backend (Routes, Controllers, Middleware)
│   └── web/               # Modern React Frontend (Vite)
├── utils/
│   ├── validation.js      # Zod-powered input schemas
│   ├── logger.js          # Structured Winston logging for audit trails
│   └── errors.js          # Universal error handling wrappers
├── arcade.db              # Persistent SQLite storage
└── assets/                # Visual branding & game assets
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v22.x or higher
- **CPU**: x64 or ARM64 (for `better-sqlite3` native bindings)

### Installation & Setup

1. **Clone & Install Dependencies**
   ```bash
   git clone https://github.com/Curzyori/Zafkiel-Arcade-1.git
   cd Zafkiel-Arcade-1
   npm install
   ```

2. **Native Build (Crucial for Linux/VPS)**
   If you are running on a Linux environment, rebuild the native SQLite bindings:
   ```bash
   npm rebuild better-sqlite3
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   UPABASE_URL=Supabase URL
   SUPABASE_ANON_KEY=sb_publishable_Your_Anon_Key
   ```

### Execution

**Development Mode:**
```bash
# Start Backend & Frontend concurrently
npm run dev
```

**Production (Docker):**
```bash
docker build -t zafkiel-arcade .
docker run -p 3000:3000 zafkiel-arcade
```

---

## 📜 Audit & Logging
The system maintains a **Temporal Log** (Audit Trail) of every major action taken in the engine. Logs are stored in `combined.log` and the `temporal_logs` table in the database, allowing for detailed activity visualization and security monitoring.

---

## 🤝 Contributing
This project is part of a professional portfolio. While it is open-source, it represents a specific architectural vision. Feel free to fork and experiment with your own temporal theories!

**Embrace the nightmare. Control the clock.** 🕒🌑
