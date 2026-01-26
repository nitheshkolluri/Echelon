
# Echelon by Gemini | Strategic Market Agent Simulation

![Echelon Banner](https://img.shields.io/badge/Status-Hackathon_MVP-success?style=for-the-badge&color=emerald) ![Gemini 2.0](https://img.shields.io/badge/AI-Gemini_2.0_Flash-blue?style=for-the-badge&logo=google) ![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

**Echelon is a high-fidelity, agent-based market simulation platform designed to test business feasibility.** 

We don't just chat about strategy; we **simulate** it. Echelon injects your startup idea into a living, breathing market of Gemini-powered competitor agents who adapt, negotiate, and fight for market share in real-time.

---

## 🚀 The Vision

For the **Google Gemini 3 Hackathon**, we built Echelon to answer a simple question:  
*"What if you could A/B test your startup strategy against the world's smartest AI before writing a single line of code?"*

Echelon uses **Gemini 2.0 Flash** to:
1.  **Understand** your unique business concept.
2.  **Generate** a realistic local market with distinct competitor archetypes.
3.  **Simulate** monthly evolution, pricing wars, and consumer demand shifts.
4.  **Explain** the "Why" behind your success (or failure) with executive-level clarity.

---

## ✨ Key Features

-   **🧠 Agentic Competitors**: Rivals aren't static scripts. They have memory, goals, and strategic personalities (e.g., "Predatory Discounter" or "Premium Boutique").
-   **🌍 Dynamic Simulation Engine**: A deterministic physics engine handles market share, revenue, and churn, while Gemini handles the *strategy* and *logic*.
-   **⚡ Gemini 2.0 Integrated**: Uses the latest Flash model for rapid reasoning, low-latency strategy updates, and complex negotiation simulation.
-   **📊 Live Dashboard**: Watch the battle unfold with real-time graphs, event logs, and success metrics.
-   **🐳 Production Ready**: Fully Dockerized, Next.js 14 App Router, and server-side secure.

---

## 🛠️ Tech Stack

-   **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion, Recharts
-   **AI Core**: Google Gemini 2.0 Flash (via `@google/genai` SDK)
-   **Simulation**: Custom deterministic typescript math engine + Agentic Reasoning Loop
-   **Deployment**: Docker & Docker Compose

---

## 🏁 Quick Start

### Option 1: Docker (Recommended)

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/nitheshkolluri/Echelon.git
    cd Echelon
    ```

2.  **Set API Key**
    Create a `.env.local` file:
    ```bash
    GEMINI_API_KEY=your_gemini_key_here
    ```

3.  **Run**
    ```bash
    docker-compose up --build
    ```
    Open [http://localhost:3000](http://localhost:3000)

### Option 2: Local Node

1.  `npm install`
2.  `export GEMINI_API_KEY=your_key`
3.  `npm run dev`

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👥 Authors

**Nithesh Kolluri**  
*Lead Developer & Architect*

Built for the Google Gemini 3 Hackathon.
