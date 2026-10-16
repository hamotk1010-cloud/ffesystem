# WorkSpace FFE

**Subtitle:** Asset & Employee Tracking
**System:** Furniture, Fixtures & Equipment (FFE) Monitoring System for Offices

---

## 1. Overview

WorkSpace FFE is a full-stack workplace asset management system designed to monitor, track, and audit office Furniture, Fixtures, and Technical Equipment (FFE). It features:

- **Dashboard Overview:** Real-time asset counts, valuation in Philippine Peso (₱), assignment metrics, category breakdown, recently updated inventory, and staff directory highlights.
- **Master FFE Inventory:** Searchable and filterable master directory with list/grid toggle, status management (Available, Assigned, Maintenance, Retired), unassign capabilities, and filter-aware PDF report export.
- **Staff & Employee Directory:** Employee records, assigned asset counters, individual PDF Asset Accountability Receipts (with signatures & legal acknowledgment), QR badges, and safe deletion guards.
- **Asset Visual Gallery:** Grid of asset photo cards, Google Drive image support, category placeholder fallbacks, and photo lightbox viewer.
- **QR Code Manager:** Scannable badge center with PNG downloads, browser test scanner, print-friendly ID badges with company branding, and clipboard link copying.
- **Live QR Scanner Modal:** Integrated camera scanning (`html5-qrcode`) with manual Employee ID fallback for instantaneous custody checks.
- **Public Profile Verification (`/?view=employee&id=EMP-101`):** No login required. Anyone scanning a physical badge can view the personnel's custody list in real-time.
- **Admin Authentication & Security:** JWT session tokens, bcrypt-hashed passwords, and in-app password update modal with validation.

---

## 2. Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`
*(Can be changed in the app at any time via the "[Security Settings]" button in the header)*

---

## 3. Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router
- **Backend:** Node.js, Express, SQLite (`sql.js` WebAssembly engine, persistent file storage in `data/workspace_ffe.db`)
- **Libraries:**
  - `qrcode` (QR code generation)
  - `html5-qrcode` (Live webcam / camera QR scanning)
  - `jspdf` & `jspdf-autotable` (PDF reports & employee accountability sheets)
  - `bcryptjs` (Password hashing)
  - `jsonwebtoken` (JWT authentication)
- **Styling:** Plain semantic HTML with minimal, neutral styling (flex/grid, readable spacing, native form controls, zero animations or decorative gradients).

---

## 4. Getting Started

### Prerequisites
- Node.js (v18+) or Bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default contents:
```env
PORT=3000
JWT_SECRET="workspace-ffe-super-secret-key-2026"
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 5. Seed Data Summary

On first launch, the database automatically seeds with:
- **Total Assets:** 12 items
- **Total Value:** ₱22,458.00
- **Assigned Assets:** 8 (67%)
- **Available Assets:** 3
- **In Repair (Maintenance):** 1 (AST-1010 Dyson Air Purifier)
- **Categories:**
  - Furniture: 6
  - Fixtures: 2
  - Equipment: 4
- **Personnel:** 6 employees (EMP-101 through EMP-106)
