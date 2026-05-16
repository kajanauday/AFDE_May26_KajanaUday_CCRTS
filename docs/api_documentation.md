# CCRTS API Documentation

**Base URL:** `http://localhost:8000`  
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication `/api/auth`

### POST /api/auth/register
Register a new user (defaults to `customer` role).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "password": "securepassword"
}
```
**Response 201:**
```json
{
  "data": { "id": 7, "name": "John Doe", "email": "john@example.com", "role": "customer" },
  "message": "User registered successfully"
}
```

---

### POST /api/auth/login
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "admin@ccrts.com",
  "password": "admin123"
}
```
**Response 200:**
```json
{
  "data": {
    "access_token": "eyJhbGci...",
    "token_type": "bearer",
    "user": { "id": 1, "name": "System Admin", "email": "admin@ccrts.com", "role": "admin" }
  },
  "message": "Login successful"
}
```

---

### GET /api/auth/me
Get current authenticated user's profile.

**Response 200:**
```json
{
  "data": { "id": 1, "name": "System Admin", "email": "admin@ccrts.com", "role": "admin", "phone": "..." },
  "message": "OK"
}
```

---

## Complaints `/api/complaints`

### GET /api/complaints
List complaints with optional filters.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status |
| `priority` | string | Filter by priority |
| `category_id` | int | Filter by category |
| `assigned_agent_id` | int | Filter by agent |
| `search` | string | Search in title/description/complaint number |
| `my_complaints` | bool | Return only current user's complaints |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20) |

**Response 200:**
```json
{
  "data": {
    "items": [...],
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "message": "OK"
}
```

---

### POST /api/complaints
Create a new complaint. Auto-generates complaint number and SLA deadline.

**Request Body:**
```json
{
  "title": "Internet service is down",
  "description": "Complete outage since 8 AM. Multiple users affected.",
  "category_id": 2,
  "priority": "critical"
}
```
**Response 201:**
```json
{
  "data": {
    "id": 6,
    "complaint_number": "CCRTS-20260515-0006",
    "title": "Internet service is down",
    "status": "open",
    "priority": "critical",
    "sla_deadline": "2026-05-15T12:00:00Z"
  },
  "message": "Complaint registered successfully"
}
```

---

### GET /api/complaints/{id}
Get full complaint detail including history and feedback.

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "complaint_number": "CCRTS-20260515-0001",
    "title": "...",
    "status": "in_progress",
    "priority": "high",
    "customer": { "id": 5, "name": "David Customer" },
    "assigned_agent": { "id": 2, "name": "Alice Support" },
    "category": { "id": 1, "name": "Billing Issues" },
    "history": [...],
    "feedback": null
  },
  "message": "OK"
}
```

---

### PUT /api/complaints/{id}/assign
Assign complaint to a support agent. Role: admin, supervisor.

**Request Body:**
```json
{ "agent_id": 2 }
```

---

### PUT /api/complaints/{id}/status
Update complaint status and optionally add a comment.

**Request Body:**
```json
{
  "status": "in_progress",
  "comment": "Investigating the billing records."
}
```

**Valid status transitions:**
```
open → assigned → in_progress → pending_customer_response → resolved → closed
                                                          ↘ escalated ↗
```

---

### PUT /api/complaints/{id}/escalate
Escalate a complaint. Role: supervisor, admin.

**Request Body:**
```json
{ "comment": "SLA breach imminent. Escalating to Level 2." }
```

---

### DELETE /api/complaints/{id}
Delete a complaint. Role: admin only.

---

## Dashboard `/api/dashboard`

### GET /api/dashboard/stats
Returns aggregated statistics for the dashboard.

**Response 200:**
```json
{
  "data": {
    "total_complaints": 120,
    "open_complaints": 35,
    "in_progress_complaints": 20,
    "resolved_complaints": 50,
    "escalated_complaints": 8,
    "closed_complaints": 7,
    "sla_breached_count": 5,
    "avg_resolution_hours": 18.4,
    "complaints_by_category": [
      { "category": "Billing Issues", "count": 30 }
    ],
    "complaints_by_priority": [
      { "priority": "high", "count": 45 }
    ],
    "complaints_by_status": [
      { "status": "open", "count": 35 }
    ],
    "monthly_trend": [
      { "month": "2025-12", "count": 18 },
      { "month": "2026-01", "count": 22 }
    ]
  }
}
```

---

### GET /api/dashboard/agent-performance
Returns per-agent complaint handling statistics. Role: admin, supervisor, quality_team.

**Response 200:**
```json
{
  "data": [
    {
      "agent_id": 2,
      "agent_name": "Alice Support",
      "total_assigned": 25,
      "resolved": 18,
      "pending": 7,
      "avg_resolution_hours": 14.2
    }
  ]
}
```

---

## Users `/api/users`

### GET /api/users
List all users. Role: admin.

**Query Params:** `role`, `is_active`, `page`, `limit`

### GET /api/users/agents
Get all support agents (for assignment dropdown). Role: admin, supervisor.

### POST /api/users
Create a user. Role: admin.

### PUT /api/users/{id}
Update user details. Role: admin or self.

### DELETE /api/users/{id}
Soft-delete (deactivate) user. Role: admin.

---

## Categories `/api/categories`

### GET /api/categories
List all categories. Public.

### POST /api/categories
Create category. Role: admin.

### DELETE /api/categories/{id}
Delete category. Role: admin.

---

## Feedback `/api/feedback`

### POST /api/feedback/complaints/{complaint_id}/feedback
Submit customer feedback. Only allowed when complaint is `resolved` or `closed`.

**Request Body:**
```json
{
  "rating": 4,
  "comments": "Issue resolved quickly, good support."
}
```

### GET /api/feedback/complaints/{complaint_id}/feedback
Get feedback for a complaint.

---

## Notifications `/api/notifications`

### GET /api/notifications
Get current user's notifications.

### PUT /api/notifications/{id}/read
Mark a single notification as read.

### PUT /api/notifications/read-all
Mark all notifications as read.

---

## SLA Rules

| Priority | Resolution SLA |
|----------|---------------|
| Critical | 4 hours       |
| High     | 24 hours      |
| Medium   | 48 hours      |
| Low      | 72 hours      |

---

## Default Credentials (Seed Data)

| Role          | Email               | Password |
|---------------|---------------------|----------|
| Admin         | admin@ccrts.com     | admin123 |
| Support Agent | alice@ccrts.com     | admin123 |
| Support Agent | bob@ccrts.com       | admin123 |
| Supervisor    | carol@ccrts.com     | admin123 |
| Customer      | david@example.com   | admin123 |
| Quality Team  | eve@ccrts.com       | admin123 |
