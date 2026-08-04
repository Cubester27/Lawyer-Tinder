# Law Firm Case Matcher

A starter full-stack web app for a confidential law firm case-routing workflow.

## What it does
- Provides a simple React UI for entering a case summary.
- Sends the case details to a Node.js/Express backend.
- Uses a deterministic ranking service to recommend the best-fitting lawyers.

## Run locally
1. Install dependencies: `npm install`
2. Start both services: `npm run dev`
3. Open the frontend at `http://localhost:5173`
4. Backend health endpoint: `http://localhost:3001/health`

## Verification
- Backend tests: `npm test`
- Frontend build: `npm run build --workspace frontend`
