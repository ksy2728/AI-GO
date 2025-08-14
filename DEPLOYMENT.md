# AI-GO Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Environment Setup

1. **Copy environment file**:
```bash
cp .env.local .env.production
```

2. **Update production variables**:
- `NEXT_PUBLIC_APP_URL`: Your production URL
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

### Deployment Options

## Option 1: Docker Deployment (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Option 2: Manual Deployment

```bash
# Install dependencies
npm ci --production

# Build application
npm run build

# Run database migrations
npm run db:migrate:prod

# Start production server
npm run start
```

## Option 3: Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

## Option 4: PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### Nginx Configuration

Place the provided `nginx/nginx.conf` in `/etc/nginx/sites-available/` and create a symlink:

```bash
sudo ln -s /etc/nginx/sites-available/ai-go.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate Setup

Using Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring

### Health Check
```bash
curl https://your-domain.com/api/health
```

### Logs
- Application: `pm2 logs`
- Nginx: `/var/log/nginx/`
- Docker: `docker-compose logs`

## 🔧 Maintenance

### Database Backup
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Update Application
```bash
git pull origin main
npm ci
npm run build
pm2 reload all
```

### Clear Cache
```bash
redis-cli FLUSHDB
rm -rf .next/cache
```

## 🚨 Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database Connection Issues
- Check PostgreSQL is running: `systemctl status postgresql`
- Verify connection string in `.env.production`
- Check firewall rules

### Memory Issues
Increase Node.js heap size:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## 📈 Performance Optimization

1. **Enable CDN**: Use Cloudflare or similar
2. **Database Indexing**: Run `npm run db:optimize`
3. **Redis Caching**: Ensure Redis is properly configured
4. **Image Optimization**: Use Next.js Image component

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Set secure `NEXTAUTH_SECRET`
- [ ] Enable HTTPS only
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Backup strategy in place

## 📞 Support

For issues or questions:
- GitHub Issues: [your-repo/issues]
- Documentation: [your-docs-url]
- Email: support@your-domain.com