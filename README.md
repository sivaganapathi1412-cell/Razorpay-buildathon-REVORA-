# REVORA AI — Agentic Commerce Growth & Revenue Recovery Platform
### Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce

**Revora AI** is an autonomous, explainable, and safety-bounded agentic commerce platform built for modern e-commerce merchants. It provides two coordinated real-time engines:
- **Engine A (AI Growth Engine):** Conversational shopping intent parsing, hybrid semantic catalog search, and margin-aware dynamic bundle/cross-sell generation (*+₹299 AI Incremental Revenue*).
- **Engine B (AI Revenue Recovery Engine):** Real-time checkout anomaly detection, bank auth/network failure diagnosis, cart preservation, and safe 1-click Razorpay test retry intervention (*+₹2,798 AI Recovered Revenue*).

---

## 🏛️ Architectural Highlights & Standards

1. **Python Version Standard:** **Python 3.11** is the standardized and recommended runtime for the Revora backend (tested on Python 3.11.13 in `backend/.venv`).
2. **Modular Monolith & Strict Tenant Isolation:** 
   - Multi-tenant architecture where `merchant_id` is **strictly derived from validated server-side JWT authentication tokens**.
   - Cross-tenant data tampering is rejected at the database query level via `get_current_merchant`.
3. **Deterministic Commerce & Safety Core:** Base prices, discounts, margin calculations, and Razorpay payment states are strictly governed by deterministic Python backend rules and database constraints.
4. **Multi-Dimensional Attribution (Zero Double-Counting):**
   - Baseline Revenue ($R_{\text{base}} = \text{₹}2,499$)
   - AI Incremental Revenue ($R_{\text{growth}} = +\text{₹}299$)
   - Recovered Revenue ($R_{\text{recov}} = \text{₹}2,798$)
   - **Total Net Merchant Revenue:** $\text{₹}2,798$ (The system never incorrectly sums overlapping attribution metrics).
5. **Secret & Git Hygiene:** All `.env`, `.env.*`, and virtual environments are strictly excluded via `.gitignore`. Zero credentials or private keys are exposed in client code.

---

## 📁 Repository Structure

```
hackathon-project/
├── backend/
│   ├── .venv/                # Standardized Python 3.11 virtual environment
│   ├── alembic/              # Database migration scripts
│   │   └── versions/
│   │       ├── 04e3fbbaba28_initial_revora_schema.py
│   │       └── da61b603b0a1_add_merchant_onboarding_fields.py
│   ├── alembic.ini           # Alembic configuration
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py       # Tenant isolation dependencies (get_current_user, get_current_merchant)
│   │   │   └── v1/
│   │   │       ├── api.py
│   │   │       └── endpoints/
│   │   │           ├── auth.py       # Register, Login, Me, Logout
│   │   │           ├── health.py     # System & database health
│   │   │           └── merchant.py   # Profile GET/PUT
│   │   ├── core/             # Security (bcrypt, JWT), database, enums, config, logging
│   │   ├── models/           # 18 SQLAlchemy 2.x async models with Decimal precision
│   │   ├── schemas/          # Pydantic auth, merchant, attribution, catalog schemas
│   │   ├── services/         # Pluggable AI provider abstraction (Gemini / Mock)
│   │   └── seed/             # Seeding script with demo owner account (owner@revora.demo)
│   ├── tests/                # 10 Automated tests (auth, isolation, e2e, attribution, seed)
│   ├── requirements.txt      # Python dependencies
│   ├── pytest.ini            # Asyncio test configuration
│   └── .env.example          # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (storefront)/ # Public Customer Storefront (Catalog, Product, Cart, Checkout, Recovery)
│   │   │   ├── (merchant)/   # Protected Merchant Center (Dashboard, Growth, Recovery, Audit, Safety)
│   │   │   ├── login/        # Merchant Sign In UI (with 1-click demo login)
│   │   │   ├── register/     # Merchant Store Registration UI
│   │   │   ├── onboarding/   # Store Setup & Safety Policy Summary
│   │   │   ├── globals.css   # Dark-first theme styling
│   │   │   ├── layout.tsx    # Root layout with AuthProvider & Inter font
│   │   │   └── page.tsx      # Central Portal Hub
│   │   ├── components/       # UI primitives (Button, Card, Badge, Modal) & Navbars
│   │   ├── lib/              # Auth context (useAuth), API client, formatting utils
│   │   └── types/            # TypeScript interfaces for commerce, attribution, agents, audit
│   ├── package.json          # Next.js 14, Tailwind CSS, TypeScript dependencies
│   └── .env.example          # Frontend environment template
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python:** 3.11 (Recommended: `py -3.11`)
- **Node.js:** 18.0+ / npm 9.0+
- **Database:** PostgreSQL (Supabase) or local async SQLite

---

### Backend Setup (FastAPI & Python 3.11)

1. **Navigate to backend and create Python 3.11 virtual environment:**
   ```bash
   cd backend
   py -3.11 -m venv .venv
   .\.venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```

4. **Run Alembic Migrations:**
   ```bash
   alembic upgrade head
   ```

5. **Seed the Foundation Dataset & Demo Account:**
   ```bash
   python app/seed/seed_db.py
   ```
   *(Demo Account: `owner@revora.demo` / `demo_password_123`)*

6. **Run Backend Automated Tests (10/10 Suites):**
   ```bash
   python -m pytest -v
   ```

7. **Start FastAPI Server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - Health Endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - Swagger Documentation: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

### Frontend Setup (Next.js 14)

1. **Navigate to frontend:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run TypeScript Production Build:**
   ```bash
   npm run build
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   - Hub: [http://localhost:3000](http://localhost:3000)
   - Merchant Login: [http://localhost:3000/login](http://localhost:3000/login)
   - Merchant Register: [http://localhost:3000/register](http://localhost:3000/register)
   - Storefront Catalog: [http://localhost:3000/catalog](http://localhost:3000/catalog)

---

## 🧪 Phase 1 & 2 Verification Status

| Verification Area | Command Executed | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Python Standard** | `.\.venv\Scripts\python.exe --version` | ✅ `Python 3.11.13` | Verified in dedicated `.venv` |
| **Backend Tests** | `python -m pytest -v` | ✅ **10 passed** in 5.87s | Auth, tenant isolation, e2e lifecycle, math |
| **Alembic Migrations** | `alembic upgrade head` | ✅ `da61b603b0a1` (HEAD) | Phase 1 & 2 schema up to date |
| **Database Seeding** | `python app/seed/seed_db.py` | ✅ Seeded & Idempotent | 1 merchant, 1 owner, 5 categories, 10 products |
| **Frontend Production Build** | `npm run build` | ✅ **19/19 Static Routes** | Zero TypeScript / Lint warnings |
| **Secret Exclusions** | `.gitignore` Inspection | ✅ Fully Secured | All `.env`, credentials & `.venv` excluded |
