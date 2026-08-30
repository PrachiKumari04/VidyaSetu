# 🌉 VaidyaSetu

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.x-blue.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.x-orange.svg)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/vite-latest-purple.svg)](https://vitejs.dev)

VaidyaSetu ("Bridge of the Healer") is a state-of-the-art, AI-powered integrative health platform designed to bridge the dangerous gap between **Allopathy (Modern Medicine)**, **Ayurveda (Traditional Indian Medicine)**, and **Homeopathy**.

---

## 🚨 The Problem: The Silent Crisis in Indian Healthcare
In India, **60% to 70% of chronic disease patients** concurrently use Ayurvedic or Homeopathic remedies alongside prescription Allopathic drugs, often without informing their doctors. This leads to severe, unrecognized **Herb-Drug Interactions (HDIs)** and **Drug-Drug Interactions (DDIs)**:

*   **Internal Bleeding Risk:** Combining **Guggul** (Ayurvedic cholesterol remedy) with **Warfarin** (Allopathic blood thinner) thins the blood to dangerous levels.
*   **Hypoglycemic Coma:** Combining **Giloy** (Ayurvedic immunity booster) with **Metformin** (Diabetes drug) drops blood sugar to critically low levels.
*   **Additive Hypotension:** Combining **Tulsi** or **Garlic** with **Lisinopril** (BP medication) causes severe blood pressure drops, fainting, and dizziness.

**VaidyaSetu** addresses this critical gap using AI-driven interaction mapping, fuzzy logic, and real-time medical guidelines.

---

## 🩺 Core Features & The Three Pillars

### 1. The Signature Interaction Bridge (Core USP)
*   **Real-time Interaction Checker:** Checks combinations of Allopathic drugs, Ayurvedic herbs, and Homeopathic remedies.
*   **Tiered Severity Alerts:** Displays alerts in distinct, color-coded levels (**Red** for High Risk, **Yellow** for Moderate Risk, **Blue** for Information) with mechanisms of action and PubChem/DrugBank source citations.
*   **AI Plain-Language Explainer:** Uses Groq (LLaMA-3 70B) to translate complex bio-chemical pathways into simple analogies for patients.
*   **Prescription OCR scanner:** Scans prescriptions (via Google Vision API / Groq Vision fallbacks) to extract medication lists instantly.

### 2. Early Disease Risk Prediction
*   **Indian-Context Guidelines:** Predicts risk levels for Diabetes, Hypertension, and Anemia using **ICMR (Indian Council of Medical Research)** guidelines.
*   **Rule-based & AI-hybrid Scoring:** Calculates preliminary risk scores and triggers Groq to generate personalized diagnostic advice.

### 3. AI Health Companion & Triage
*   **Multilingual Chatbot:** A floating AI companion supporting voice/text inputs and local language translations (Hindi, Tamil, Kannada, Marathi, Bengali, Telugu, and more).
*   **Triage System:** Analyzes user symptoms, lifestyle, and history to recommend appropriate medical actions.

---

## 🛠️ Technical Stack & Architecture

### Frontend
*   **Framework:** React.js (Vite)
*   **State Management:** Zustand (for multi-step forms and persistent settings)
*   **Localization:** `i18next` supporting 12+ Indian regional languages
*   **Utilities:** `jsPDF` (downloadable health reports), `Fuse.js` (fuzzy medicine matching)

### Backend
*   **Server:** Node.js + Express.js
*   **Database:** MongoDB Atlas (handles user profiles, medical reports, interaction history)
*   **Schedulers:** Background crons & heartbeats for vitals monitoring and reminder dispatching

### AI / OCR Infrastructure
*   **Primary LLM:** Groq LLaMA-3 (70B) & Gemini 2.0-Flash (bidirectional fallback orchestration for high-resilience OCR and interaction analysis)
*   **Data Aggregation:** RAG (Retrieval-Augmented Generation) pipeline targeting custom research documents, AYUSH Ministry standards, and IMPPAT data

---

## 📁 Repository Structure
```bash
VaidyaSetu/
├── backend/                  # Node.js + Express backend service
│   ├── src/
│   │   ├── models/           # MongoDB Mongoose schemas (UserProfile, Vital, LabResult, etc.)
│   │   ├── routes/           # REST endpoints (realtimeInteraction, OCR, fit, alerts, etc.)
│   │   ├── services/         # Core logic (AI, OCR, normalization, reminders, safety)
│   │   └── utils/            # Algorithmic engine (riskScorer, interactionEngine, RAG)
│   └── server.js             # Main server entrypoint
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable widgets, BodyScan3D, and Chatbot
│   │   ├── pages/            # Dashboard, Health Profile, Prescriptions, Vitals, Alerts
│   │   └── context/          # Theme and application-level React context
│   └── vite.config.js        # Vite bundler configuration
└── reference_data/           # AYUSH standards, CCRH indications, and ICMR guideline records
```

---

## 🚦 Getting Started

### 1. Prerequisites
*   Node.js (v18.x or higher)
*   MongoDB Atlas cluster

---

### 2. Configuration & Environment Variables

#### Backend Configuration
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

#### Frontend Configuration
Create a `.env.local` file inside the `frontend/` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/
VITE_CLERK_AFTER_SIGN_UP_URL=/onboarding
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

---

### 3. Installation & Run Commands

#### Setup & Start Backend:
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
# OR node server.js
```

#### Setup & Start Frontend:
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📊 Complete Data Strategy
VaidyaSetu integrates multiple standardized medical databases to verify safety and risk profiles:

| # | Source | Type | Usage inside VaidyaSetu |
|---|---|---|---|
| 1 | **IMPPAT** | Ayurveda | 1700+ Indian medicinal plants and mechanisms of action. |
| 2 | **DrugBank** | Allopathy | Allopathic drug profiles and CYP enzyme targets. |
| 3 | **ICMR** | Epidemiology | India-specific BMI cutoffs, disease risk, and thresholds. |
| 4 | **AYUSH Ministry** | Government Standards | Verified nomenclature for Ayurvedic formulations. |
| 5 | **CCRH** | Homeopathy | Homeopathic remedy interactions and indications. |
| 6 | **Google Fit API** | Fitness Integrations | Fetches physical steps and vitals data via OAuth 2.0. |
| 7 | **Google Vision** | AI OCR | Performs text extraction on prescription images. |

---

## 🔮 Future Roadmap
*   **Full ABDM Integration:** Integration with India's Ayushman Bharat Digital Mission (ABDM) and ABHA ID for seamless health records retrieval.
*   **Real-time RAG Search:** Transition static interaction databases into real-time vector embeddings matching the latest clinical trials.
*   **Emergency Contact Automation:** Instant SOS and physician alerts when severe interactions are flagged.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
