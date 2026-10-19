# Muranga eCitizen Portal: Frontend

A web portal where Muranga County residents submit and track service requests, officers handle assigned cases, and administrators manage the system and view analytics.

| | |
|---|---|
| **Live app** | `<your deployed link>` |
| **Backend repo / API** | `<your backend link>` |
| **Design (Figma)** | https://www.figma.com/design/gmTQ1PpSwJuIhIhV61h4Qj/Untitled?node-id=0-1&t=fQCBkGKQ3hVSRrX0-0 |

## Tech stack

- Next.js (App Router) and TypeScript
- Tailwind CSS
- REST API client in `src/api`

## Features

### Core
- **Registration and sign-in** with role-based redirects (citizen, officer, admin)
- **Submit a request** with a category, a location (map picker) and an optional image
- **Request tracking** with a status timeline: Pending → In Progress → Resolved
- **Officer workspace** to review and update assigned cases
- **Admin analytics** with open vs resolved request counts and charts

### Bonus
- Account verification by email and SMS (`/verify`)
- Password reset (`/forgot`, `/reset`)
- Role-based workspaces: `/portal`, `/officer`, `/admin`
- Staff management (admin users)
- Audit logs
- Announcements
- Request assignment, departments, categories and locations management
- Reports and system settings
- Automatic logout after inactivity
- Postman collection (in the backend repo)

## Screenshots

| Page | Screenshot |
|---|---|
| Sign in | ![Sign in](docs/screenshots/signin.png) |
| Citizen dashboard | ![Citizen dashboard](docs/screenshots/dashboard.png) |
| Submit request | ![Submit request](docs/screenshots/submit-request.png) |
| Request tracking | ![Request tracking](docs/screenshots/tracking.png) |
| Officer page | ![Officer page](docs/screenshots/officer.png) |
| Admin analytics | ![Admin analytics](docs/screenshots/admin-analytics.png) |

## Design decisions

- **Colour:** a small palette with one primary colour for actions, and distinct status colours for Pending, In Progress and Resolved so progress is readable at a glance.
- **One consistent layout:** a shared app shell (header, side navigation, content area) is used by every role, so the interface feels familiar whichever workspace you are in.
- **Role-based dashboards:** citizens, officers and admins each get their own layout and navigation, and routes are guarded by role.
- **Responsive:** layouts adapt to phones, tablets and desktops.
- **Clear feedback:** validation and API errors appear in plain language next to the relevant field, and empty states explain what to do next.
- **Reusable components:** status badges, the status stepper, request cards and the activity timeline are shared, so statuses look the same everywhere.
- **Figma:** the original design is linked at the top of this README.

## Project structure

```
frontend/
├── public/                      # Static assets
├── docs/screenshots/            # README screenshots
├── src/
│   ├── app/                     # Routes (Next.js App Router)
│   │   ├── (auth)/              # Sign in, register, verify, forgot, reset
│   │   ├── (main)/              # Public pages
│   │   ├── portal/              # Citizen workspace
│   │   │   ├── submit/          #   Submit a request
│   │   │   ├── track/           #   Track request status
│   │   │   ├── requests/        #   My requests
│   │   │   ├── services/        #   Available services
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   └── help/
│   │   ├── officer/             # Officer workspace
│   │   │   ├── dashboard/
│   │   │   └── case/            #   Case details and status updates
│   │   ├── admin/               # Admin workspace
│   │   │   ├── analytics/       #   Open vs resolved counts and charts
│   │   │   ├── requests/
│   │   │   ├── assignment/
│   │   │   ├── users/           #   Staff management
│   │   │   ├── departments/
│   │   │   ├── categories/
│   │   │   ├── locations/
│   │   │   ├── announcements/
│   │   │   ├── audit/           #   Audit logs
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── system/
│   │   ├── globals.css
│   │   └── layout.tsx           # Root layout
│   ├── api/                     # API client and endpoint calls
│   ├── components/              # Shared UI
│   │   ├── landing/             #   Landing page sections
│   │   ├── map/                 #   Location picker and map views
│   │   ├── submit/              #   Submit-request form parts
│   │   ├── AppShell.tsx         #   Shared layout for all roles
│   │   ├── AuthLayout.tsx
│   │   ├── RequireRole.tsx      #   Role-based route guard
│   │   ├── IdleLogout.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── StatusStepper.tsx
│   │   ├── ActivityTimeline.tsx
│   │   ├── RequestCard.tsx
│   │   ├── RequestSummaryCard.tsx
│   │   ├── ChartCard.tsx
│   │   ├── ProfileView.tsx
│   │   ├── Modal.tsx
│   │   ├── Logo.tsx
│   │   ├── PublicHeader.tsx
│   │   ├── PublicFooter.tsx
│   │   └── ui.tsx               #   Buttons, inputs and other primitives
│   ├── data/                    # Static data and constants
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript types
│   └── utils/                   # Helper functions
├── .env.example                 # Environment variable template
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Getting started

**Requirements:** Node.js 18 or newer, and the backend API running.

```bash
cd frontend
npm install
cp .env.example .env.local     # Windows PowerShell: copy .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:8000/api` |

Never commit `.env` or `.env.local`. Only `.env.example` belongs in the repository.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| 

## Deployment

Deployed on `<Vercel / Netlify>`. Set `NEXT_PUBLIC_API_URL` in the host's environment settings to the deployed backend URL, then redeploy.

## Roles

| Role | Workspace | Can do |
|---|---|---|
| Citizen | `/portal` | Submit and track requests, manage profile, read notifications |
| Officer | `/officer` | View assigned cases, update status |
| Admin | `/admin` | Assign requests, manage staff and lookups, view analytics, audit logs and announcements |