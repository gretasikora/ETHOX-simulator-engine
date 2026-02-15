# ETHOX Backend Deployment Guide

This guide covers deploying the ETHOX simulator backend to production.

## 📋 Prerequisites

- Python 3.11+
- PostgreSQL database (for production)
- OpenAI API key
- A deployment platform (Heroku, Railway, Render, AWS, or Docker)

## 🔧 Configuration

### 1. Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Django Configuration
DJANGO_SECRET_KEY=your-super-secret-key-minimum-50-chars
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com

# Database URL (PostgreSQL recommended for production)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# OpenAI API (required for simulations)
OPENAI_API_KEY=sk-your-openai-api-key

# CORS Origins (comma-separated)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### 2. Generate a Secret Key

Generate a secure Django secret key:

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

## 🚀 Deployment Options

### Option 1: Heroku

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**:
   ```bash
   cd backend
   heroku create your-app-name
   ```

3. **Add PostgreSQL addon**:
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

4. **Set environment variables**:
   ```bash
   heroku config:set DJANGO_SECRET_KEY="your-secret-key"
   heroku config:set DEBUG=False
   heroku config:set OPENAI_API_KEY="your-openai-key"
   heroku config:set ALLOWED_HOSTS="your-app-name.herokuapp.com"
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

6. **Run migrations**:
   ```bash
   heroku run python manage.py migrate
   ```

### Option 2: Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and initialize**:
   ```bash
   cd backend
   railway login
   railway init
   ```

3. **Add PostgreSQL**:
   ```bash
   railway add postgresql
   ```

4. **Set environment variables** in Railway dashboard or CLI:
   ```bash
   railway variables set DJANGO_SECRET_KEY="your-secret-key"
   railway variables set DEBUG=False
   railway variables set OPENAI_API_KEY="your-openai-key"
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

### Option 3: Docker

1. **Build the Docker image**:
   ```bash
   cd backend
   docker build -t ethox-backend .
   ```

2. **Run with environment variables**:
   ```bash
   docker run -d \
     -p 8000:8000 \
     -e DJANGO_SECRET_KEY="your-secret-key" \
     -e DEBUG=False \
     -e DATABASE_URL="postgresql://..." \
     -e OPENAI_API_KEY="your-openai-key" \
     -e ALLOWED_HOSTS="yourdomain.com" \
     ethox-backend
   ```

3. **Run migrations** (in container):
   ```bash
   docker exec -it <container-id> python manage.py migrate
   ```

### Option 4: Manual VPS/Cloud Deployment

1. **SSH into your server** and clone the repo:
   ```bash
   git clone <your-repo-url>
   cd ETHOX-simulator-engine-1/backend
   ```

2. **Set up Python environment**:
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Create `.env` file** with production values

4. **Run setup script**:
   ```bash
   ./deploy.sh
   ```

5. **Set up systemd service** (example):
   ```ini
   [Unit]
   Description=ETHOX Backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/path/to/ETHOX-simulator-engine-1/backend
   Environment="PATH=/path/to/venv/bin"
   ExecStart=/path/to/venv/bin/gunicorn societyviz.wsgi:application --bind 0.0.0.0:8000 --workers 4

   [Install]
   WantedBy=multi-user.target
   ```

6. **Set up nginx reverse proxy** (recommended)

## 🗄️ Database Setup

### PostgreSQL (Recommended for Production)

1. Create a database:
   ```sql
   CREATE DATABASE ethox_production;
   CREATE USER ethox_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ethox_production TO ethox_user;
   ```

2. Set DATABASE_URL:
   ```bash
   DATABASE_URL=postgresql://ethox_user:secure_password@localhost:5432/ethox_production
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

### SQLite (Development Only)

SQLite is included by default for development. Not recommended for production with multiple workers.

## 📊 Post-Deployment Checklist

- [ ] Verify environment variables are set
- [ ] Database migrations completed: `python manage.py migrate`
- [ ] Static files collected: `python manage.py collectstatic`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Test API endpoints: `curl https://your-domain.com/api/graph/`
- [ ] Check logs for errors
- [ ] Verify HTTPS is working
- [ ] Test CORS with frontend
- [ ] Monitor performance and errors

## 🔒 Security Checklist

- [ ] `DEBUG=False` in production
- [ ] Strong `DJANGO_SECRET_KEY` (50+ characters)
- [ ] `ALLOWED_HOSTS` set to specific domains
- [ ] Database credentials secured
- [ ] API keys stored in environment variables (not in code)
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS restricted to frontend domains
- [ ] Regular security updates

## 📈 Monitoring & Maintenance

### View Logs

- **Heroku**: `heroku logs --tail`
- **Railway**: `railway logs`
- **Docker**: `docker logs -f <container-id>`

### Database Backups

Set up regular database backups:
- Heroku: Automatic with paid plans
- PostgreSQL: Use `pg_dump`
- Railway: Available in dashboard

### Scaling

Adjust worker count based on traffic:
```bash
# Heroku
heroku ps:scale web=2

# Docker
docker-compose scale web=4
```

## 🐛 Troubleshooting

### Common Issues

1. **Static files not loading**:
   ```bash
   python manage.py collectstatic --noinput
   ```

2. **Database connection errors**:
   - Verify DATABASE_URL is correct
   - Check database credentials
   - Ensure database is accessible from server

3. **CORS errors**:
   - Add frontend URL to `CORS_ALLOWED_ORIGINS`
   - Verify `DEBUG=False` in production

4. **500 errors**:
   - Check logs: `heroku logs --tail`
   - Verify all environment variables are set
   - Check for migration issues

## 🔄 Updating the Deployment

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Install new dependencies** (if any):
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Collect static files**:
   ```bash
   python manage.py collectstatic --noinput
   ```

5. **Restart the server**:
   - Heroku/Railway: Automatic on git push
   - Docker: `docker restart <container-id>`
   - Systemd: `sudo systemctl restart ethox-backend`

## 📚 Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [WhiteNoise Documentation](http://whitenoise.evans.io/)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/admin.html)

## 🆘 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure database migrations are up to date
4. Review the security checklist
