# Order-to-Audit ERP - REST API Documentation
## API Version: v1
**Base URL**: `/api/v1`

> For detailed Authentication, JWT Token Lifecycle, RBAC Permission Matrix, and Security Invariants, refer to [authentication-and-rbac.md](file:///d:/INTERNSHIP/nit-intern/docs/api/authentication-and-rbac.md).
> For Master Data Management (Customers, Suppliers, Products, Murukku 200g BOM, Raw Materials, Packaging, Units, Pricing), refer to [master-data-management.md](file:///d:/INTERNSHIP/nit-intern/docs/api/master-data-management.md).

All responses follow the standard JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "timestamp": "2026-11-20T17:30:00.000Z",
    "correlationId": "req-98f2b1"
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-11-20T17:30:00.000Z"
  }
}
```

---

## 1. System Health Endpoints

### `GET /api/v1/health`
Returns full diagnostic health status of the application and database.

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-11-20T17:30:00.000Z",
    "uptimeSeconds": 142.85,
    "environment": "development",
    "database": {
      "status": "connected",
      "latencyMs": 4
    },
    "memory": {
      "rssMB": 58.2,
      "heapUsedMB": 32.4
    }
  }
}
```

### `GET /api/v1/health/ping`
Lightweight heartbeat for container orchestrators.
**Response `200 OK`**:
```json
{
  "status": "pong",
  "timestamp": "2026-11-20T17:30:00.000Z"
}
```

---

## 2. Authentication Endpoints

### `POST /api/v1/auth/login`
Authenticates a user and returns their identity, role, and permissions.

**Request Body**:
```json
{
  "email": "owner@enterprise.com",
  "password": "DemoPass@2026"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c1f109a0-628f-4c59-bfbc-2ea39f04d70c",
      "email": "owner@enterprise.com",
      "firstName": "Vikram",
      "lastName": "Singhania",
      "roles": ["OWNER"]
    },
    "token": "mock-jwt-token-foundation"
  }
}
```
