# Lawyer App - AI Legal Matching & Management Platform

An AI-powered legal matching and case management application designed to streamline case routing, attorney-client matching, and legal document automation.

---

## 🏛️ Project Overview

The **Lawyer App** is a confidential law firm workflow platform with a modern dark-themed glassmorphism UI.

- **Frontend**: Built with React (Vite), React Router, Bootstrap, and custom CSS for a sleek, responsive user interface.
- **Backend**: Powered by Node.js and Express.
- **AI & Automation**: Uses OpenRouter (GPT models) for intelligent case extraction and drafting legal notices, along with `pdfkit` for automated PDF document generation.

---

## ✨ Key Features

### 1. 📥 Intake Portal
- Upload case documents or paste case facts.
- **AI Information Extraction**: Automatically extracts relevant facts, key issues, and practice areas.
- **Deterministic & AI Attorney Matching**: Ranks and matches the best-fitting attorneys based on expertise and performance data.

### 2. 📊 Lawyer Dashboard & Analytics
- **Performance Analytics**: Visualizes lawyer stats, case volume, and success rates per practice area.
- **Recent Assignments**: Tabbed workflow allowing attorneys to view, accept, or reject incoming cases.

### 3. 📄 Automated Document Generation
- **Engagement Letters (PDF)**: Instantly generates and downloads tailored PDF retainer agreements using `pdfkit`, auto-filling client facts and assigned lawyer details.
- **AI-Powered Legal Notice Drafting**: Generates formal first-draft legal notices (e.g., cease and desist) using OpenRouter AI. Drafts are displayed in a custom modal and can be downloaded as Markdown (`.md`).

### 4. 🌍 Full English Localization
- Cleanly localized legal terms, practice areas (e.g., *Employment Law*, *Civil Code*), and demo cases.

### 5. 🔒 Security & Authentication
- **Protected Routes**: The entire application, including the Intake Portal and Lawyer Dashboard, is secured behind a login screen.
- **Simple Login**: Employs a basic mock JWT authentication setup for quick testing and demonstration.

---

## 💾 Data Architecture & Persistence

Data is currently stored and persisted locally via JSON data files:
- `backend/data/lawyers.json`: Attorney profiles, practice areas, and performance metrics.
- `backend/data/approvals.json`: Intake cases, approval statuses, and cached AI-generated draft documents.

---

## 🚀 Quick Start & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Ensure `.env` in the backend directory contains your configuration (e.g., `OPENROUTER_API_KEY`, `PORT=3001`).

### 3. Run Development Servers
Start both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Backend Health Check**: `http://localhost:3001/health`

> **Note**: To access the application, use the default credentials:
> **Username**: `admin`
> **Password**: `admin`

---

## 🧪 Verification & Building

- **Backend Unit Tests**: `npm test`
- **Frontend Production Build**: `npm run build --workspace frontend`

---

## 🔜 Future Roadmap

- **Database Migration**: Transition local JSON files (`lawyers.json`, `approvals.json`) to PostgreSQL or MongoDB.
- **Role-Based Access Control (RBAC)**: Expand the current simple authentication system to support individualized attorney accounts and granular permissions.
- **Export Enhancements**: Support exporting AI legal notice drafts directly to `.docx` and `.pdf` formats.
