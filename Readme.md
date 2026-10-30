# Nexus Engine • Demo REST API Server

A modern, high-performance Node.js & Express demo server with an interactive web dashboard, real-time telemetry, mock REST CRUD endpoints, and live traffic logging.

---

## 🚀 Quick Start

### 1. Start the Server
```bash
npm start
```
Or for live-reload development mode:
```bash
npm run dev
```

### 2. Access the Dashboard
Open your web browser and navigate to:
```
http://localhost:3000
```

---

## 📡 Available REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server heartbeat, memory usage, and node system info |
| `GET` | `/api/metrics` | Real-time traffic metrics, avg latency, and uptime |
| `GET` | `/api/logs` | Latest intercepted HTTP requests telemetry stream |
| `POST` | `/api/logs/clear`| Clears request history logs |
| `GET` | `/api/users` | List users (supports `?search=`, `?role=`, `?status=`) |
| `GET` | `/api/users/:id` | Get individual user by ID |
| `POST` | `/api/users` | Create new user (`{ name, email, role, status }`) |
| `PUT` | `/api/users/:id` | Update user by ID |
| `DELETE` | `/api/users/:id` | Delete user record by ID |
| `GET` | `/api/products` | Catalog items (supports `?category=`, `?search=`) |
| `POST` | `/api/products` | Add new catalog product |
| `DELETE` | `/api/products/:id` | Delete product by ID |
| `POST` | `/api/echo` | Echo payload and client headers |

---

## ✨ Features

- **Interactive API Playground**: Test any endpoint directly from the browser with customizable methods, headers, and JSON payloads.
- **cURL Generator**: Instantly generates ready-to-run cURL snippets for any request configured in the UI.
- **Live In-Memory CRUD**: Create, browse, search, and delete users and catalog products in real-time.
- **Live Traffic Stream**: Watch every incoming request get intercepted and logged with status code and duration.
- **System Telemetry**: Real-time heap memory usage, total requests count, and average response latency.
