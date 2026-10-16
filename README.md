# BankSentinel

BankSentinel is a full-stack banking security demonstration. It combines a React interface with an Express and MongoDB API to demonstrate authentication, multi-factor authentication (MFA), basic intrusion detection, intrusion logging, role-based admin views, and a decoy honeypot experience.

> **Project scope:** This is an educational prototype, not a production banking system. Account balances and transaction responses are sample data. Do not use real customer information, credentials, or financial transactions.

## Project Goals

- Demonstrate password-based registration and login with hashed passwords.
- Add time-based one-time password (TOTP) MFA for customer accounts.
- Detect selected suspicious login patterns and record intrusion events.
- Present customer, administrator, and decoy dashboard experiences.
- Provide a starting point for a project report on layered application security.

## Features

- **Authentication:** Express routes for registration, login, MFA setup, and MFA verification; passwords are hashed with `bcryptjs` and sessions use JSON Web Tokens.
- **MFA:** TOTP secrets and QR codes are generated with `speakeasy` and `qrcode`.
- **Intrusion detection and throttling:** Login middleware applies a request limit and checks selected payload patterns and request metadata. Login logic tracks repeated password and OTP failures.
- **Behavioral anomaly checks:** Banking routes inspect request rate, access time, and user-agent strings using a heuristic score.
- **Intrusion records:** MongoDB stores detection type, timestamp, IP address, user-agent, and logged actions.
- **Admin view:** Authorized admin roles can review intrusion logs and request that a user be marked as blocked.
- **Decoy view:** Some detected login attempts receive a decoy identity and are routed to a honeypot-style dashboard.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Axios, lucide-react |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Authentication and security utilities | JSON Web Token, bcryptjs, speakeasy, express-rate-limit |

## Architecture

```text
React + Vite frontend (port 5173 by default)
        |
        | HTTP requests to http://localhost:5000
        v
Express API (port 5000 by default)
  /api/auth       registration, login, MFA
  /api/banking    dashboard, banking demo, admin logs
        |
        v
MongoDB
  users           account and MFA fields
  intrusion logs  detected events and actions
```

The frontend selects a customer, admin, or decoy dashboard based on the authenticated user's role and returned `isHacker` flag.

## Requirements

- Node.js and npm
- A MongoDB instance or MongoDB Atlas connection string

## Run Locally

1. Install backend dependencies:

   ```powershell
   cd backend
   npm install
   ```

2. Create `backend/.env` with the database URI and a private JWT signing secret:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/banksentinel
   JWT_SECRET=replace-with-a-long-random-secret
   ```

   Use your own MongoDB URI as needed. Keep `.env` out of source control and do not reuse the example secret.

3. Start the backend in one terminal:

   ```powershell
   cd backend
   npm run dev
   ```

   The API listens on port `5000` by default. Its root endpoint (`GET /`) returns a service status message.

4. Install and start the frontend in another terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Open the local URL printed by Vite, normally `http://localhost:5173`.

The current frontend uses `http://localhost:5000` directly for API requests. If you change the backend port or host, update the frontend API URLs accordingly.

## API Summary

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register an account |
| `POST` | `/api/auth/login` | Authenticate; may require an MFA code |
| `POST` | `/api/auth/setup-mfa` | Create an MFA secret and QR code |
| `POST` | `/api/auth/verify-mfa` | Verify and enable MFA |
| `GET` | `/api/banking/dashboard` | Return demo account and transaction data (authenticated) |
| `POST` | `/api/banking/transfer` | Return a demo transfer response (authenticated) |
| `POST` | `/api/banking/change-password` | Return a demo password-change response (authenticated) |
| `GET` | `/api/banking/download-statement` | Return a demo statement response (authenticated) |
| `GET` | `/api/banking/admin/logs` | List intrusion logs (admin role required) |
| `POST` | `/api/banking/admin/block-hacker` | Mark a matching user as blocked (admin role required) |

Authenticated routes expect a bearer token in the `Authorization` header. Request and response payloads are implemented in the backend route and controller files.

## Security Design Notes

- The login rate limiter is configured for 20 requests per minute. Repeated invalid password and MFA attempts are separately tracked in application memory.
- The anomaly detector uses fixed heuristics (for example, request volume and user-agent matches); it is not a machine-learning model and should not be described as validated AI detection in a report.
- Some detections are intentionally answered with decoy credentials/dashboard behavior to demonstrate deception. This is a simulation, not a production-grade isolation boundary.
- User roles can currently be supplied during registration. This is unsafe for a real application; production authorization must assign privileged roles through a trusted administrative process.
- Banking endpoints return demonstration data and do not perform real transfers, password changes, or statement generation.
- The in-memory attempt counters are not shared across server instances and reset when the process restarts.
- The application has no documented automated test suite at this time.

## Report Outline

1. **Introduction:** Describe the security problem and the goal of the BankSentinel prototype.
2. **Requirements:** Identify the intended users and the authentication, monitoring, and admin needs.
3. **System design:** Explain the frontend, API, database, routes, and request flow.
4. **Security mechanisms:** Discuss password hashing, JWTs, MFA, throttling, heuristic detection, intrusion logs, and decoy behavior.
5. **Demonstration and evaluation:** Show expected workflows and test each implemented control with safe, local test accounts.
6. **Limitations:** Include the prototype caveats above, false-positive/false-negative risks, and absence of real transaction processing.
7. **Future work:** Consider server-side role assignment, stronger input validation, persistent distributed rate limiting, automated tests, audit protections, and production-grade monitoring.

## Repository Layout

```text
backend/
  controllers/   authentication and MFA handlers
  middleware/    authentication, throttling, detection, and activity tracking
  models/        user and intrusion-log schemas
  routes/        authentication and banking API routes
  server.js      Express app and MongoDB connection
frontend/
  src/components/ login, MFA, customer, admin, and decoy screens
  src/App.jsx    application flow and dashboard selection
```