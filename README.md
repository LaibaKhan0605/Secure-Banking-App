# 🛡️ Secure Banking API Dashboard

A production-grade, full-stack cybersecurity intelligence dashboard designed to monitor and defend a high-security banking ledger system. 

Built with **React**, **Express.js**, **Tailwind CSS v4**, and **MongoDB** (with in-memory fallbacks), the system acts as a sandbox to demonstrate advanced security concepts: **Web Application Firewall (WAF) filtering**, **strict rate-limiting**, **Double-Submit CSRF cookie shields**, **stateless JWT validation**, and **automated account lockdown procedures on credential attacks**.

---

## 🏗️ Architecture & Component Design

The project is structured with strict separation of concerns, ensuring high modularity and resistance to resource saturation:

```text
├── server.ts              # Entry point. Configures Helmet, CORS, loggers, rate limits & Vite middlewares.
├── server/
│   ├── db.ts              # DB client facade. Connects Mongoose vs robust JSON/In-Memory fallback.
│   ├── logger.ts          # Logging core. Winston engine integrated with security-based metadata.
│   ├── middleware.ts      # Active defenses. Houses WAF scans, rate limits, CSRF & stateless JWT checks.
│   └── routes.ts          # API endpoints. Logic for secure auth, stats, finance ledgers & threat simulator.
├── src/
│   ├── App.tsx            # Main parent component. Orchestrates tabs, SSE streams & animated toast overlays.
│   ├── types.ts           # Unified, strict TypeScript types for security models.
│   ├── index.css          # Injected Google Font pairings and Tailwind CSS v4 configurations.
│   ├── lib/
│   │   └── api.ts         # Secure API fetch client. Employs automatic CSRF synchronization.
│   └── components/
│       ├── Login.tsx       # Glowing login screen with credentials security trackers.
│       ├── Register.tsx    # Wallet creation portal enforcing regulatory password norms.
│       ├── Sidebar.tsx     # Clean, cyber-themed panel controlling tab interfaces.
│       ├── Navbar.tsx      # Top bar monitoring DB connection status, UTC time & heartbeats.
│       ├── Telemetry.tsx   # Visual charts, alarms monitor, and live stream log readers.
│       ├── FinanceLedger.tsx # Transaction history and risk-mitigated transfers.
│       ├── AttackSimulator.tsx # Penetration Lab triggering real blocks and showing WAF replies.
│       └── OWASPChecklist.tsx # Compliance checkers and incident audit report templates.
```

---

## 🛡️ Implemented Defenses

### 1. Intrusion Detection & Monitoring
- **Acct Locking**: Users are locked out of their banking profiles instantly for triggering **5 consecutive incorrect passcode attempts**.
- **Active Alarms**: High-volume incidents (lockdowns, blocked payloads, rate overrides) trigger crimson alarms showing complete attacking metadata.
- **Winston + Morgan Logging**: Morgan relays HTTP traffic to Winston loggers. Audited threats are cataloged directly into our databases and streamed real-time.

### 2. Web Application Firewall (WAF)
The middleware intercepts all payloads (query strings, requests body, router values), matching them against malicious string patterns:
- **SQL Injection (SQLi)**: Identifies blockages matching `' OR 1=1 --` or SQL keywords.
- **Cross-Site Scripting (XSS)**: Neutralizes malicious `<script>` tags, event handlers, or session stealing structures.
- **System File / Traversal Protection**: Shields routes against path traversals like `../etc/passwd`.

### 3. Rate Limiting Protection
Using `express-rate-limit` to allow a maximum of **100 API queries per 15-minute window** from any IP node. Overriding values suspends traffic immediately.

### 4. Zero-Trust Access Isolation
- **Role-Based Guards**: Standard users are physically isolated; they cannot inspect logs, review system alarms, or pull other users' transaction ledgers.
- **Admin Clearance**: Only credentials declaring `'admin'` roles can clear logs or execute alert resolution tasks.

### 5. Double-Submit CSRF Cookie Verification
Mutating requests (POST/PUT/DELETE) are audited. Incoming calls are intercepted, requiring cookies and headers (`X-XSRF-TOKEN`) to hold matching secret strings, protecting users against cross-site form thefts.

---

## 🚀 Speed-Run Manual

### 1. Local Deployment
Boot original full-stack configurations natively on Port 3000:

```bash
# Clone the repository and navigate inside
cd secure-banking-api-dashboard

# Install all workspace and backend dependencies
npm install

# Run the development platform (Automatically initiates Vite and Express on Port 3000!)
npm run dev
```

### 2. Default Access Passwords
When launching, seed values are automatically prepared:
- **Privileged Admin Account**:
  - Username: `admin`
  - Password: `AdminPass123!`
- **Standard Banking Account**:
  - Username: `user`
  - Password: `UserPass123!`

---

## 🔍 Vulnerability Auditing Handbooks

Use the integrated **WAF Penetration Sandbox Lab** directly in the UI dashboard to run automated threats and inspect replies, or query manually using industry-standard tools:

### A. SQLMap Parameters Verification

Audit parameterized variables blockages by executing standard SQLMap scans on search nodes:
```bash
sqlmap -u "http://localhost:3000/api/transactions?search=1" \
  --headers="Authorization: Bearer [INSERT_JWT_TOKEN]" \
  --dbms=mongodb --batch --dump
```
*Results*: Parameterized models render queries sterile, returning safe blank tables. The WAF registers, intercepts, and creates alert records instantly.

### B. Burp Suite Interceptions

Monitor traffic configurations by channeling requests through standard proxies:
1. Direct port proxy settings to `127.0.0.1:8080`.
2. Launch banking and attempt executing transactions.
3. Observe CSRF headers: mutating forms without carrying valid `X-XSRF-TOKEN` headers matching `XSRF-TOKEN` cookies return `403 Forbidden` errors.

### C. Dependency Auditing
Check installed node modules for structural CVE blocks:
```bash
npm audit
```
This prints safety summaries indicating if packages require upgrade patches.

---

## 🐳 Docker Deployment

The project contains fully prepared Docker configurations aligning with top container security practices:
- **Rootless Execution**: Containers run under unprivileged, non-sudo 'node' users.
- **Shielded Networking**: Databases run inside private network links without mounting ingress ports, shielding records against public scanners.

### Run with Docker Compose:
```bash
# Compile and boot secure containers
docker-compose up --build -d

# Check live logs
docker-compose logs -f
```

Accessible on `http://localhost:3000`. Stop with `docker-compose down`.
