# Blood Suite - Smart Blood Bank Management System

## Overview
Blood Suite is a comprehensive blood bank and donor management system designed for Lesotho. This Final Year Project aims to modernize blood bank operations through technology, addressing challenges faced by hospitals and clinics due to fragmented, paper-based systems.

**Authors:** Thipe David Relebohile (202101682) & Mohaka Ts'osane (202201986)  
**Supervisor:** Mr Sekese  
**Institution:** National University of Lesotho

## Project Structure
```
/
├── server.js                 # Main Express.js server (port 5000)
├── src/
│   ├── config/
│   │   └── database.js       # PostgreSQL connection
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   └── routes/
│       ├── auth.js           # User registration/login
│       ├── donors.js         # Donor management
│       ├── inventory.js      # Blood inventory
│       ├── requests.js       # Blood requests
│       ├── hospitals.js      # Hospital management
│       ├── notifications.js  # Alert system
│       └── analytics.js      # Dashboard stats
├── public/
│   ├── index.html            # Main frontend
│   ├── styles.css            # Styling
│   └── app.js                # Frontend JavaScript
├── database/
│   └── schema.sql            # PostgreSQL schema
├── frontend-web/             # Future React frontend
├── backend/                  # Backend documentation
├── mobile-app/               # Future Flutter mobile app
├── ai-ml/                    # Future AI/ML module
└── docs/                     # Project documentation
```

## Tech Stack
- **Runtime:** Node.js 20
- **Framework:** Express.js 5
- **Database:** PostgreSQL (Neon-backed)
- **Authentication:** JWT with bcrypt
- **Frontend:** HTML/CSS/JavaScript SPA

## Features Implemented
1. **User Authentication** - Registration and login with JWT
2. **Donor Management** - Profile creation, blood type tracking
3. **Blood Inventory** - Stock tracking with expiry management
4. **Hospital Portal** - Request and reserve blood units
5. **Request System** - Normal/Urgent/Critical priority levels
6. **Notifications** - Alert system for urgent requests
7. **Analytics Dashboard** - Real-time statistics

## Database Tables
- `users` - Authentication and base user information
- `donors` - Donor profiles with blood type and location
- `hospitals` - Hospital information and verification
- `blood_inventory` - Blood unit tracking and expiry
- `blood_requests` - Request management
- `donations` - Donation history
- `notifications` - Alert system
- `donation_appointments` - Scheduled donations

## API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/donors` - List donors (authenticated)
- `GET /api/inventory/summary` - Blood stock summary
- `GET /api/requests` - List blood requests
- `GET /api/analytics/dashboard` - Dashboard stats

## Running Locally
```bash
npm start
```

## Lesotho Districts Supported
Maseru, Berea, Leribe, Butha-Buthe, Mokhotlong, Thaba-Tseka, Qacha's Nek, Quthing, Mohale's Hoek, Mafeteng

## Future Development
- React frontend with enhanced UI
- Flutter mobile app for donors
- AI/ML demand forecasting
- SMS/WhatsApp notifications
- Blockchain donation traceability
