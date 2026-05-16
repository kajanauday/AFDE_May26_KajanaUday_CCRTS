# Customer Complaint & Resolution Tracking System (CCRTS)

**Capstone Project | AFDE May 2026 | Uday Kajana**  
Repository: `AFDE_May26_KajanaUday_CCRTS`

---

## Project Overview

The **Customer Complaint & Resolution Tracking System (CCRTS)** is a centralized, full-stack web application that helps organizations efficiently manage, monitor, and resolve customer complaints. It provides a structured workflow from complaint initiation to closure, with role-based dashboards, SLA tracking, escalation management, and analytics.

---

## Features Implemented

### Core Features
- **User Authentication** — JWT-based login/register with role-based access control
- **Complaint Registration** — Auto-generated complaint IDs, category selection, priority levels
- **Complaint Lifecycle** — Status workflow: Open → Assigned → In Progress → Resolved → Closed
- **Escalation Management** — Escalate unresolved complaints with SLA breach tracking
- **SLA Tracking** — Automatic SLA deadlines by priority (Critical: 4h, High: 24h, Medium: 48h, Low: 72h)
- **Complaint History** — Full audit trail of every status change with timestamps
- **Feedback System** — Customer satisfaction ratings (1–5 stars) for resolved complaints
- **Notifications** — In-app notifications for assignments, status updates, and escalations
- **Dashboard & Analytics** — Real-time stats, charts, monthly trends, agent performance
- **Search & Filter** — Filter by status, priority, category, agent; keyword search
- **User Management** — Admin CRUD for users across all roles
- **Reports Dashboard** — Category analysis, agent performance, resolution metrics

### Roles
| Role | Capabilities |
|------|-------------|
| Customer | Register complaints, track status, submit feedback |
| Support Agent | Manage assigned complaints, update status, add resolution notes |
| Supervisor | Monitor queues, handle escalations, view SLA breaches |
| Administrator | Full system access: users, categories, all complaints, analytics |
| Quality Team | View reports, analyze trends, monitor service quality |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Backend** | FastAPI (Python) |
| **Database** | SQLite via SQLAlchemy ORM |
| **Auth** | JWT (python-jose), bcrypt (passlib) |
| **API Style** | REST with JSON responses |
| **Dev Tools** | GitHub, VS Code, Postman |

---

## Project Structure

```
AFDE_May26_KajanaUday_CCRTS/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/               # Axios instance with JWT interceptor
│   │   ├── components/        # Layout, Sidebar, Header, StatCard, Badges
│   │   ├── context/           # Auth context
│   │   └── pages/             # Login, Register, Dashboard, Complaints, Reports, etc.
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                   # FastAPI backend
│   ├── main.py                # App entry, CORS, seeding, routers
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic v2 schemas
│   ├── auth.py                # JWT utilities
│   ├── database.py            # SQLAlchemy engine + session
│   └── routers/               # auth, complaints, users, dashboard, feedback, notifications
│
├── database/                  # Database assets
│   ├── schema.sql             # Full SQLite schema
│   └── seed_data.sql          # Sample data
│
├── screenshots/               # UI screenshots
├── docs/
│   └── api_documentation.md   # Full API reference
├── README.md
├── requirements.txt
└── .gitignore
```

---

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm
- Git

---

### Backend Setup

```bash
# Clone the repository
git clone <repository-url>
cd AFDE_May26_KajanaUday_CCRTS

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start the backend server
cd backend
uvicorn main:app --reload --port 8000
```

The backend auto-creates the SQLite database and seeds default roles, users, and categories on first startup.

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

### Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

- Frontend: http://localhost:5173

---

### Database Setup

The SQLite database (`backend/database/ccrts.db`) is created automatically on backend startup.

To inspect or reset manually:
```bash
sqlite3 backend/database/ccrts.db < database/schema.sql
sqlite3 backend/database/ccrts.db < database/seed_data.sql
```

---

## Default Login Credentials

| Role          | Email                | Password |
|---------------|----------------------|----------|
| Admin         | admin@ccrts.com      | admin123 |
| Support Agent | alice@ccrts.com      | admin123 |
| Support Agent | bob@ccrts.com        | admin123 |
| Supervisor    | carol@ccrts.com      | admin123 |
| Customer      | david@example.com    | admin123 |
| Quality Team  | eve@ccrts.com        | admin123 |

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/complaints` | List complaints with filters |
| POST | `/api/complaints` | Create new complaint |
| GET | `/api/complaints/{id}` | Get complaint detail |
| PUT | `/api/complaints/{id}/status` | Update complaint status |
| PUT | `/api/complaints/{id}/assign` | Assign complaint to agent |
| PUT | `/api/complaints/{id}/escalate` | Escalate complaint |
| GET | `/api/complaints/{id}/history` | Get complaint history |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/agent-performance` | Agent performance data |
| GET | `/api/users` | List users (admin) |
| GET | `/api/users/agents` | List support agents |
| GET | `/api/categories` | List complaint categories |
| POST | `/api/feedback/complaints/{id}/feedback` | Submit feedback |
| GET | `/api/notifications` | Get user notifications |

Full API documentation: [docs/api_documentation.md](docs/api_documentation.md)

---

## SLA Policy

| Priority | Resolution Time |
|----------|----------------|
| Critical | 4 hours |
| High | 24 hours |
| Medium | 48 hours |
| Low | 72 hours |

SLA deadlines are automatically calculated when a complaint is created. Breached SLAs are highlighted in red on the dashboard and complaint list.

---

## Submission Checklist

- [x] GitHub repository updated with daily commits
- [x] README.md complete with setup instructions
- [x] Backend API implemented (FastAPI)
- [x] Frontend UI implemented (React + Tailwind)
- [x] Database schema and seed data provided
- [x] CRUD operations for complaints
- [x] Search and filter functionality
- [x] Role-based access control
- [x] Dashboard with charts and analytics
- [x] API documentation in docs/
- [x] .gitignore configured

---

## Author

**Uday Kajana**  
AFDE May 2026 Batch  
Email: uday.k@prodapt.com
