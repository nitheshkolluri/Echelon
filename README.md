
# Echelon by Gemini | Strategic Market Simulation

Echelon is a high-fidelity, agent-based market simulation platform designed for business feasibility analysis. It uses the Gemini 2.5 and 3.0 series models to simulate complex competitive dynamics in real-world regional contexts.

## 🚀 Overview

Unlike traditional static business plan tools, Echelon creates a living digital economy. When you input a business idea and a region, the system:
1.  **Synthesizes Competitors**: Identifies real-world or high-fidelity synthetic incumbents in your specific area.
2.  **Models Behavioral Agents**: Deploys AI agents with distinct archetypes (e.g., "Premium Leader", "Budget Provider") that react to your pricing and quality changes.
3.  **Simulates 36 Months of Data**: Runs a localized simulation based on population density, visits per month, and market sentiment.
4.  **Generates an Elite Audit**: Produces a board-ready feasibility report with Radar charts, SWOT analysis, and head-to-head competitive metrics.

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Animation**: Framer Motion
- **Data Visualization**: Recharts (Radar, Area, Scatter, Bar)
- **AI Core**: @google/genai (Gemini 3 Pro/Flash)
- **Icons**: Lucide React

## ⚙️ Configuration

To maintain security, this application does not hardcode API keys. It relies on the environment variable `process.env.API_KEY`.

### For Developers
1. Clone the repository.
2. Ensure your execution environment has the `API_KEY` variable exported:
   ```bash
   export API_KEY=your_gemini_api_key_here
   ```
3. The application will automatically pick up the key via the `@google/genai` initialization in `services/geminiService.ts`.

## 📂 Project Structure

- `App.tsx`: The main application controller and dashboard UI.
- `types.ts`: TypeScript definitions for market states and agent behaviors.
- `services/`:
    - `geminiService.ts`: AI orchestration, prompt engineering, and report synthesis.
    - `simulationEngine.ts`: The mathematical model for market share and revenue calculation.
- `index.html`: Main entry point with ESM module imports.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
