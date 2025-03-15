# Musika ZW Deployment Guide

## Prerequisites
- Python 3.9+
- PostgreSQL database
- Redis server (for rate limiting)
- Node.js and npm (for frontend optimization)
- SSL certificate for HTTPS

## Security Improvements Needed

### Backend (.env configuration)
1. Update environment variables in production:
```ini
FLASK_DEBUG=False
DATABASE_URL=postgresql://user:password@localhost:5432/musika_db
JWT_SECRET_KEY=<generate-strong-secret-key>
ALLOWED_ORIGINS=https://musika.com
REDIS_URL=redis://localhost:6379/0
```

2. Generate a strong JWT secret key:
```bash
python -c 'import secrets; print(secrets.token_hex(32))'
```

### Frontend Updates Needed

1. Update API endpoints in js/api.js to use production URLs:
```javascript
const API_BASE_URL = 'https://api.musika.com';
```

2. Minify and optimize static assets:
```bash
npm install -g uglify-js
uglifyjs js/*.js -o js/bundle.min.js
```

3. Update HTML files to use minified assets and add security headers:
- Add CSP headers
- Enable HSTS
- Add X-Frame-Options
- Add X-Content-Type-Options

4. Update Google Maps API key restrictions:
- Restrict to your domain
- Enable billing
- Set usage quotas

## Database Migration

1. Create PostgreSQL database:
```sql
CREATE DATABASE musika_db;
CREATE USER musika_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE musika_db TO musika_user;
```

2. Update SQLAlchemy connection:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
```

## Server Setup

1. Install system dependencies:
```bash
sudo apt-get update
sudo apt-get install python3-pip python3-dev postgresql postgresql-contrib nginx redis-server
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Configure Nginx:
```nginx
server {
    listen 80;
    server_name musika.com www.musika.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name musika.com www.musika.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        root /path/to/musika/lib/assets/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. Configure Gunicorn:
Create /etc/systemd/system/musika.service:
```ini
[Unit]
Description=Musika ZW Gunicorn Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/musika/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn --workers 4 --bind 0.0.0.0:5000 app:app

[Install]
WantedBy=multi-user.target
```

5. Start services:
```bash
sudo systemctl start redis
sudo systemctl start postgresql
sudo systemctl start musika
sudo systemctl start nginx
```

## Post-Deployment Checklist

1. Security:
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] API keys restricted
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] CSP headers set
- [ ] Error logging configured

2. Performance:
- [ ] Static assets minified
- [ ] Caching configured
- [ ] Database indexes created
- [ ] Load balancing configured (if needed)

3. Monitoring:
- [ ] Error tracking setup
- [ ] Performance monitoring setup
- [ ] Database monitoring setup
- [ ] API monitoring setup

4. Backup:
- [ ] Database backup configured
- [ ] File backup configured
- [ ] Disaster recovery plan documented

## Maintenance

1. Regular updates:
```bash
# Update dependencies
pip install -r requirements.txt --upgrade

# Database migrations
flask db upgrade

# Clear Redis cache
redis-cli FLUSHALL
```

2. Monitoring commands:
```bash
# Check logs
sudo journalctl -u musika.service

# Check service status
sudo systemctl status musika nginx redis postgresql
```

3. Backup commands:
```bash
# Database backup
pg_dump musika_db > backup.sql

# Restore database
psql musika_db < backup.sql
```
