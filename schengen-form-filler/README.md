# Schengen Visa Form Filler Demo

An AI-powered assistant that helps users complete the Schengen Visa Application Form. Built with React + Chucky SDK.

## The Problem

Every year, **1.7 million Schengen visa applications are rejected** — many due to preventable form errors:
- Fields left blank instead of "N/A"
- Passport validity issues (must be valid 3+ months after departure)
- Wrong destination country selected
- Inconsistent dates across documents

This demo shows how Chucky can provide intelligent form assistance.

## Project Structure

```
schengen-form-filler/
├── src/                        # React frontend
│   ├── components/
│   │   ├── Header.tsx          # EU-branded header
│   │   ├── SchengenForm.tsx    # All 37 form fields
│   │   ├── FormField.tsx       # Individual field component
│   │   ├── ChatPanel.tsx       # AI chat interface
│   │   └── AssistantFAB.tsx    # Floating action button
│   ├── context/
│   │   ├── FormContext.tsx     # Form state management
│   │   └── ChuckyContext.tsx   # Chucky SDK integration (TOKEN GOES HERE)
│   ├── hooks/
│   │   └── useChuckyAssistant.ts
│   └── types/
│       └── form.ts             # All 37 Schengen fields
│
├── workspace/                  # ← Deploy this to Chucky
│   ├── CLAUDE.md               # Skill for Claude Code
│   └── .chucky.json            # Project config
│
└── package.json
```

## Quick Start (Demo Mode)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

The demo runs in **demo mode** with simulated AI responses by default.

---

## Using Real Chucky

### Step 1: Deploy the Workspace

The `workspace/` folder contains the skill (`CLAUDE.md`) that Claude Code will use.

```bash
cd workspace

# Initialize (first time only)
chucky init

# Deploy to Chucky
chucky deploy
```

After deployment, you'll have:
- **Project ID** in `.chucky.json`
- **HMAC Secret** in `.chucky.json`

### Step 2: Generate a Token

```bash
# Using the CLI
chucky token --expires 3600
```

Or programmatically:
```typescript
import { createToken, createBudget } from '@chucky.cloud/sdk'

const token = await createToken({
  projectId: 'your-project-id',
  secret: 'your-hmac-secret',
  userId: 'demo-user',
  budget: createBudget({
    aiDollars: 1.00,
    computeHours: 1,
    window: 'day',
  }),
})
```

### Step 3: Configure the Frontend

Edit `src/context/ChuckyContext.tsx`:

```typescript
const DEMO_MODE = false  // ← Change to false

const CHUCKY_TOKEN = 'eyJhbGciOiJIUzI1NiIs...'  // ← Paste your token
```

### Step 4: Run

```bash
npm run dev
```

Now the chat assistant connects to real Chucky and Claude!

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (React App)                       │
│  ┌───────────────────────────────┬───────────────────────┐  │
│  │     SCHENGEN FORM (React)     │   CHAT PANEL          │  │
│  │                               │                       │  │
│  │  ┌─────────────────────┐      │   User: "My name     │  │
│  │  │ Surname: [SMITH   ] │◄─────│         is John"     │  │
│  │  └─────────────────────┘      │                       │  │
│  │  ┌─────────────────────┐      │   AI: "I've filled   │  │
│  │  │ First Name: [JOHN] │◄─────│        your name..."  │  │
│  │  └─────────────────────┘      │                       │  │
│  └───────────────────────────────┴───────────────────────┘  │
│                         │                                    │
│            Chucky SDK (WebSocket) + Browser Tools            │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────────┐
              │      CHUCKYBOX            │
              │   (Cloudflare Workers)    │
              │                           │
              │   ┌───────────────────┐   │
              │   │  Claude Code CLI  │   │
              │   │                   │   │
              │   │  + CLAUDE.md      │   │
              │   │    (Schengen      │   │
              │   │     expertise)    │   │
              │   └───────────────────┘   │
              └───────────────────────────┘
```

### Browser Tools (Defined in React)

The React app provides tools that Claude can call to interact with the form:

| Tool | Description |
|------|-------------|
| `getFormLayout` | Returns all fields with current values |
| `setFieldValue` | Fill a form field |
| `highlightField` | Visually highlight a field |
| `validateField` | Check against Schengen rules |
| `getFormProgress` | Get completion % |

These tools are defined in `src/hooks/useChuckyAssistant.ts` and execute in the browser.

### Skill (CLAUDE.md in Workspace)

The `workspace/CLAUDE.md` file gives Claude:
- Knowledge of all 37 Schengen form fields
- Critical rules (passport validity, 90/180 day rule, destination selection)
- Common rejection reasons
- Guidance on how to use the tools

When you deploy the workspace, Claude Code reads this file and becomes a Schengen visa expert.

---

## Demo vs Production

| Feature | Demo Mode | Production |
|---------|-----------|------------|
| AI Responses | Simulated | Real Claude |
| Tool Execution | Pattern matching | AI-driven |
| Form Filling | Hardcoded | Dynamic |
| Cost | Free | Per-token |

---

## Selling Points

### For End Users
- Complete the form in ~20 minutes instead of 2+ hours
- Catch errors that cause 14.8% rejection rate
- Available 24/7
- Free (vs. €50-200 visa consultants)

### For Businesses (B2B2C)
- Embed in existing visa application portals
- Reduce support tickets
- Increase application success rates
- White-label ready

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build**: Vite
- **AI**: Chucky SDK → Chuckybox → Claude Code

## License

MIT
