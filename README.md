# 🗣️ English Coach — AI Agent Pipeline

An orchestration system with 3 AI agents built with **NestJS + Angular + Groq API**.

---

## 🏗️ Architecture

```
User (Text or MP3)
        ↓
NestJS Backend (Port 3000)
        ↓
Orchestrator Service
        ↓
[Groq Whisper] → transcription (audio only)
        ↓
Agent 1: Grammar Service   → corrects grammar mistakes
        ↓ output passed to
Agent 2: Vocabulary Service → improves word choices
        ↓ both outputs passed to
Agent 3: Coach Service      → final score + feedback
        ↓
Angular Frontend (Port 4200)
```

---

## ⚙️ Setup

### 1. Get Free Groq API Key
- Go to https://console.groq.com
- Sign up with Google (no credit card)
- Create API Key → copy it

### 2. Backend Setup
```bash
cd backend
npm install
# Open .env and paste your GROQ_API_KEY
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
ng serve
```

### 4. Open
http://localhost:4200

---

## 📁 Structure

```
backend/src/
├── groq/
│   ├── groq.module.ts          ← exports GroqService
│   └── groq.service.ts         ← single LLM caller (all agents use this)
├── agents/
│   ├── grammar.service.ts      ← Agent 1
│   ├── vocabulary.service.ts   ← Agent 2 (takes Agent 1 output)
│   └── coach.service.ts        ← Agent 3 (takes Agent 1 + 2 output)
├── upload/
│   └── whisper.service.ts      ← Groq Whisper transcription
├── orchestrator/
│   ├── orchestrator.module.ts
│   ├── orchestrator.service.ts ← runs the pipeline in order
│   └── orchestrator.controller.ts
├── app.module.ts
└── main.ts

frontend/src/app/
├── services/
│   └── orchestrator.service.ts ← HTTP calls to backend
├── components/practice/
│   ├── practice.component.ts
│   ├── practice.component.html
│   └── practice.component.css
└── app.component.ts
```

---

## 🔌 API Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /orchestrator/run | `{ text: string }` | Run pipeline on typed text |
| POST | /orchestrator/upload-audio | `FormData(audio: File)` | Transcribe MP3 + run pipeline |

---

## 🛠️ Tech Stack

| Layer | Tech | Cost |
|-------|------|------|
| LLM | Groq (llama3-8b-8192) | Free |
| Transcription | Groq Whisper | Free |
| Backend | NestJS 11 | Free |
| Frontend | Angular 20 | Free |
| Total | — | $0 |
