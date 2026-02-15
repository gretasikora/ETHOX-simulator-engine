# ETHOX Backend Architecture

## Production Deployment Stack

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Load Balancer │
                    │   (Platform)   │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐       ┌────▼────┐
   │ Gunicorn│         │ Gunicorn│       │ Gunicorn│
   │ Worker 1│         │ Worker 2│       │ Worker 3│
   └────┬────┘         └────┬────┘       └────┬────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   Django Application      │
              │   (societyviz.wsgi)       │
              └─────────────┬─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐       ┌────▼────┐
   │WhiteNoise│        │PostgreSQL│      │ OpenAI  │
   │ (Static) │        │ Database │      │   API   │
   └──────────┘        └──────────┘      └─────────┘
```

## Request Flow

```
1. Client Request
   ↓
2. HTTPS/SSL Termination (Platform)
   ↓
3. Load Balancer (if multiple workers)
   ↓
4. Gunicorn Worker (WSGI Server)
   ↓
5. Django Middleware Stack:
   - CORS (corsheaders)
   - Security (SecurityMiddleware)
   - WhiteNoise (static files)
   - Sessions
   - CSRF Protection
   - Authentication
   ↓
6. URL Router (societyviz/urls.py)
   ↓
7. View Handler (graphapi/views.py)
   ↓
8. Service Layer (if needed)
   ├─→ Database Query (PostgreSQL)
   ├─→ OpenAI API Call (simulations)
   └─→ File I/O (network.json)
   ↓
9. Serialization (DRF)
   ↓
10. Response
```

## Component Details

### 1. Gunicorn (WSGI Server)
- **Purpose**: Production-grade HTTP server for Python
- **Configuration**: 4 workers, 120s timeout
- **Handles**: Multiple concurrent requests
- **Replaces**: Django's dev server (`runserver`)

### 2. WhiteNoise (Static Files)
- **Purpose**: Serves CSS, JS, images efficiently
- **Features**: Compression, caching, CDN-ready
- **No nginx needed**: Built into Django middleware

### 3. Django Application
- **Framework**: Django 5.0
- **API**: Django REST Framework
- **Apps**: graphapi (main API), societyviz (settings)

### 4. PostgreSQL Database
- **Dev**: SQLite (file-based)
- **Prod**: PostgreSQL (recommended)
- **Features**: Connection pooling, health checks

### 5. OpenAI Integration
- **Used for**: Agent simulations, opinion updates
- **Config**: Via OPENAI_API_KEY environment variable

## API Endpoints

```
Base URL: https://your-domain.com/api/

GET  /api/graph/                    # Get network graph
GET  /api/nodes/<agent_id>/         # Get node details
POST /api/graph/upload/             # Upload network data
POST /api/simulations/run/          # Run simulation
GET  /api/simulations/report/       # Get simulation report
```

## Environment-Based Configuration

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│ Development │      │   Staging    │      │  Production  │
├─────────────┤      ├──────────────┤      ├──────────────┤
│ DEBUG=True  │      │ DEBUG=False  │      │ DEBUG=False  │
│ SQLite DB   │      │ PostgreSQL   │      │ PostgreSQL   │
│ CORS=All    │      │ CORS=Limited │      │ CORS=Limited │
│ HTTP OK     │      │ HTTPS Only   │      │ HTTPS Only   │
│ No security │      │ Some headers │      │ Full headers │
└─────────────┘      └──────────────┘      └──────────────┘
```

## Deployment Platforms

### Option 1: Heroku
```
┌──────────────────────┐
│  Heroku Platform     │
│  ┌────────────────┐  │
│  │   Web Dyno     │  │
│  │   (Gunicorn)   │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │  PostgreSQL    │  │
│  │  Add-on        │  │
│  └────────────────┘  │
└──────────────────────┘
```

### Option 2: Railway
```
┌──────────────────────┐
│  Railway Service     │
│  ┌────────────────┐  │
│  │   Web Service  │  │
│  │   (Gunicorn)   │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │  PostgreSQL    │  │
│  │  Plugin        │  │
│  └────────────────┘  │
└──────────────────────┘
```

### Option 3: Docker
```
┌──────────────────────────┐
│  Container Orchestration │
│  (Docker/K8s)            │
│  ┌────────────────────┐  │
│  │  Backend Container │  │
│  │  (Dockerfile)      │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  PostgreSQL        │  │
│  │  Container         │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

### Option 4: VPS/Cloud
```
┌──────────────────────────┐
│  Your Server             │
│  ┌────────────────────┐  │
│  │  Nginx (Reverse    │  │
│  │  Proxy)            │  │
│  └──────┬─────────────┘  │
│         │                │
│  ┌──────▼─────────────┐  │
│  │  Gunicorn          │  │
│  │  (Systemd)         │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  PostgreSQL        │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────┐
│ 1. Platform Level                   │
│    - SSL/TLS Certificates           │
│    - DDoS Protection                │
│    - WAF (Web Application Firewall) │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│ 2. Django Security Middleware       │
│    - HTTPS Redirect                 │
│    - HSTS Headers                   │
│    - XSS Protection                 │
│    - Content Type Sniffing          │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│ 3. Application Level                │
│    - CORS Restrictions              │
│    - CSRF Protection                │
│    - Authentication                 │
│    - Rate Limiting (optional)       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│ 4. Database Level                   │
│    - Connection Encryption          │
│    - Access Controls                │
│    - SQL Injection Prevention       │
└─────────────────────────────────────┘
```

## Static Files Pipeline

```
Development:
  ┌──────────────┐
  │  Dev Server  │  Static files served by Django
  │  (runserver) │  No optimization
  └──────────────┘

Production:
  ┌──────────────┐
  │ collectstatic│  Collects files to STATIC_ROOT
  └──────┬───────┘
         │
  ┌──────▼───────┐
  │  WhiteNoise  │  Compresses & serves efficiently
  │  Middleware  │  Sets cache headers
  └──────────────┘
```

## Database Migration Flow

```
Code Changes
     ↓
makemigrations (local)
     ↓
Commit migrations/
     ↓
Deploy to platform
     ↓
Release phase: python manage.py migrate
     ↓
Database updated
     ↓
Web workers restart
```

## Monitoring Points

```
┌─────────────────────────────────────┐
│ Platform Metrics                    │
│ - CPU Usage                         │
│ - Memory Usage                      │
│ - Response Time                     │
│ - Error Rate                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Application Logs                    │
│ - Django Logs                       │
│ - Gunicorn Logs                     │
│ - Database Query Logs               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Database Metrics                    │
│ - Connection Pool Usage             │
│ - Query Performance                 │
│ - Storage Usage                     │
└─────────────────────────────────────┘
```

## Scaling Considerations

### Vertical Scaling (Scale Up)
- Increase CPU/RAM per worker
- Better for CPU-intensive operations
- Simpler to implement

### Horizontal Scaling (Scale Out)
```
┌────────┐  ┌────────┐  ┌────────┐
│Worker 1│  │Worker 2│  │Worker N│
└───┬────┘  └───┬────┘  └───┬────┘
    └───────────┼───────────┘
                │
        ┌───────▼────────┐
        │ Shared Database│
        └────────────────┘
```
- More workers handling requests
- Better for I/O-bound operations
- Requires session management
- Database connection pooling important

## File Structure

```
backend/
├── manage.py              # Django management
├── requirements.txt       # Dependencies ✨ UPDATED
├── Procfile              # Platform commands ✨ NEW
├── Dockerfile            # Container def ✨ NEW
├── runtime.txt           # Python version ✨ NEW
├── deploy.sh             # Setup script ✨ NEW
├── .env.example          # Env vars template ✨ NEW
├── DEPLOYMENT.md         # Full guide ✨ NEW
├── QUICK_DEPLOY.md       # Quick ref ✨ NEW
├── ARCHITECTURE.md       # This file ✨ NEW
│
├── societyviz/           # Django project
│   ├── settings.py       # Config ✨ UPDATED
│   ├── urls.py           # URL routing
│   ├── wsgi.py           # WSGI entry point
│   └── asgi.py           # ASGI entry point
│
├── graphapi/             # Main API app
│   ├── views.py          # API endpoints
│   ├── urls.py           # API routes
│   ├── models.py         # Data models
│   ├── serializers.py    # DRF serializers
│   └── services.py       # Business logic
│
└── data/                 # Data storage
    ├── network.json      # Network graph
    └── simulations/      # Simulation results
```

✨ = Created or updated for production deployment
