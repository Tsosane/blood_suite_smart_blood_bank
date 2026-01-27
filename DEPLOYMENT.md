# Blood Suite - Deployment Guide

## Overview
Blood Suite is a smart blood bank and donor management system for Lesotho. This guide will help you deploy the application in various environments.

## Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Git

## Quick Start (Development)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd bloodsuitesmartbloodbank-4/bloodsuitesmartbloodbank-4
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```
Edit `.env` with your database credentials:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/blood_suite_db
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=5000
```

### 3. Database Setup
Create a PostgreSQL database:
```sql
CREATE DATABASE blood_suite_db;
```

### 4. Run the Application
```bash
npm start
```
The app will be available at `http://localhost:5000`

## Docker Deployment (Recommended)

### Using Docker Compose
```bash
docker-compose up -d
```
This will start:
- The application on port 5000
- PostgreSQL database on port 5432

### Manual Docker Build
```bash
docker build -t blood-suite .
docker run -p 5000:5000 --env-file .env blood-suite
```

## Production Deployment

### Environment Variables
For production, set these variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=strong-random-secret-key
PORT=5000
```

### Security Considerations
1. Change the default JWT secret
2. Use HTTPS in production
3. Set up proper database credentials
4. Configure firewall rules
5. Regularly update dependencies

### Database Setup
The application will automatically create tables on startup. Ensure your PostgreSQL user has CREATE TABLE permissions.

### Health Check
Monitor the application health:
```bash
curl http://localhost:5000/api/health
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Main Features
- `GET /api/donors` - Donor management
- `GET /api/inventory` - Blood inventory
- `GET /api/requests` - Blood requests
- `GET /api/hospitals` - Hospital management
- `GET /api/analytics` - Analytics dashboard

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL format
2. **Port Conflicts**: Ensure port 5000 is available
3. **Permission Errors**: Check file permissions for uploads directory

### Logs
Check application logs for errors:
```bash
docker-compose logs app
```

## Support
For issues and support, refer to the project documentation or create an issue in the repository.
