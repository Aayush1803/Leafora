# VEYRA — Next.js Frontend Application

The modern, responsive web application for **VEYRA (Visual Evaluation & Yield Risk Assessment)**, built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.

---

## Key Features

* **Drag-and-Drop Image Ingestion:** Interactive upload dropzone supporting file drag-and-drop, native file picker browsing, and mobile camera capture.
* **Instant Client Pre-flight:** Validates file extension (`.jpg`, `.jpeg`, `.png`) and file size ($\le 10\text{ MB}$) in the browser before sending network requests.
* **Confidence Badges:** Displays visual indicator tiers based on diagnosis certainty (High $\ge 85\%$, Moderate $60–84\%$, Low $< 60\%$).
* **Top-3 Differential Visualizer:** Ranks candidates with comparative probability bars, providing transparency into model certainty.
* **Agronomic Remedy Profiles:** Renders curated disease summaries, biological pathogen causes, and organic/chemical remediation recommendations.
* **Educational Pages:** Dedicated `/about` and `/insights` routes detailing project background and the 211-class taxonomy.

---

## Technology Stack

* **Framework:** Next.js 16.3.8 (App Router, Turbopack)
* **Library:** React 19.0.0
* **Language:** TypeScript 5.x
* **Styling:** Tailwind CSS 3.4
* **Animations:** Framer Motion
* **Icons:** Lucide React
* **Deployment Target:** Vercel Global Edge Network

---

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the `veyra/` directory:

```env
# Point to local FastAPI backend:
NEXT_PUBLIC_API_URL=http://localhost:8000

# OR point to live production backend on Render:
# NEXT_PUBLIC_API_URL=https://vriksh.onrender.com
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm run start
```

---

## Application Structure

```
veyra/
├── app/
│   ├── layout.tsx         # Root layout with navigation and footer
│   ├── page.tsx           # Home page with upload workspace & results panel
│   ├── about/page.tsx     # Project mission, technology stack, and ethics
│   ├── insights/page.tsx  # Interactive disease taxonomy & model insights
│   └── globals.css        # Global CSS variables and utility styles
├── components/
│   ├── Navigation.tsx     # Responsive top header & mobile drawer
│   ├── UploadWorkspace.tsx# Drag-and-drop file ingestion zone
│   ├── ResultPanel.tsx    # Diagnostic results, top-3 candidates, remedies
│   ├── ConfidenceDisplay.tsx # Visual confidence badge & tier indicator
│   └── Footer.tsx         # Disclaimer and project links
├── lib/
│   └── api.ts             # Typed fetch client connecting to FastAPI backend
├── public/                # Static SVG icons and favicon
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind design tokens
└── tsconfig.json          # TypeScript compiler configuration
```

---

## Deployment (Vercel)

The frontend is deployed to **Vercel** with automatic GitHub integration:
* **Root Directory:** `veyra`
* **Build Command:** `npm run build`
* **Output Directory:** `.next`
* **Environment Variable:** `NEXT_PUBLIC_API_URL=https://vriksh.onrender.com`

---

## Cross-Documentation Links

* [System Architecture (`../docs/ARCHITECTURE.md`)](../docs/ARCHITECTURE.md)
* [Product Requirements Document (`../docs/PRD.md`)](../docs/PRD.md)
* [Backend API Specification (`../docs/API.md`)](../docs/API.md)
* [Local Setup Guide (`../docs/SETUP.md`)](../docs/SETUP.md)
