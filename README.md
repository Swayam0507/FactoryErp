# 🏭 Factory ERP System — VivekBhai Industries

A production-ready **Factory Attendance, Salary & Employee Management System** built with Next.js 15, Supabase, and TypeScript.

## 🚀 Quick Start

### 1. Set up environment variables
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and fill in your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Set up database
Run `supabase/schema.sql` in your Supabase SQL Editor (Dashboard → SQL Editor → New Query → paste → Run).

### 3. Create your first Super Admin
In Supabase Dashboard → Authentication → Users → Invite User (or Add User).
Then in SQL Editor run:
```sql
INSERT INTO public.admins (id, name, email, role)
VALUES ('<user-id-from-auth>', 'Your Name', 'your@email.com', 'super_admin');
```

### 4. Install & run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + ShadCN UI |
| Backend | Supabase (Auth + Postgres + Storage) |
| Charts | Recharts |
| PDF Export | jsPDF + jspdf-autotable |
| Excel Export | XLSX |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| WhatsApp | Meta Cloud API |

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Reset Password
│   ├── (dashboard)/     # All protected pages
│   └── api/             # API routes (admin create/delete, WhatsApp)
├── components/layout/   # Sidebar, Topbar
├── hooks/               # useAuth, useEmployees, useAttendance, useAdvances, useSalary
├── lib/
│   ├── supabase/        # Client + Server clients
│   ├── pdf/             # jsPDF salary slip generator
│   ├── excel/           # XLSX exporters
│   ├── whatsapp/        # Meta Cloud API sender
│   └── validations/     # Zod schemas
└── types/               # All TypeScript interfaces
```

## 👥 User Roles

| Role | Permissions |
|---|---|
| **Super Admin** | Full access, settings, admin management |
| **Admin** | Employees, attendance, advances, reports |
| **Viewer** | Read-only access to all data |

## 📱 WhatsApp Integration

Configure Meta WhatsApp Business API in **Settings → WhatsApp**:
1. Get Phone Number ID from Meta Business Manager
2. Get Access Token from Meta Developers
3. Enter credentials and enable notifications

## 💾 Database

See `supabase/schema.sql` for the complete database schema including:
- All tables with proper constraints
- Row-Level Security (RLS) policies
- Performance indexes
- Storage bucket for factory assets
