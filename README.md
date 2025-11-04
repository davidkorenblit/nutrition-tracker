# Nutrition Tracker

A comprehensive nutrition tracking application with meal logging, water tracking, weekly reviews, and nutritionist recommendations management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## Overview

Nutrition Tracker is a full-stack web application designed to help users track their nutrition, meals, water intake, and receive personalized recommendations from nutritionists. The app features user authentication, meal management with timer functionality, compliance tracking, and document parsing for nutritionist recommendations.

## Features

### Core Features
- **User Authentication**: Secure registration and login with JWT tokens and email verification
- **Meal Tracking**: Log 3 daily meals (breakfast, lunch, dinner) with:
  - Free plate composition (vegetables, protein, carbs)
  - Hunger levels (before, during, after)
  - Photo uploads
  - 20-minute eating timer
- **Snack Logging**: Track snacks between meals
- **Water Tracking**: Daily water intake monitoring with customizable goals
- **Weekly Reviews**: Summarize new foods tried each week with ratings (taste, texture, mental challenge)
- **Nutritionist Recommendations**: Upload and parse Word documents with recommendations
- **Compliance Tracking**: Monitor adherence to nutritionist guidelines

### Additional Features
- Dashboard with daily overview
- Real-time eating timers
- Photo upload for meals
- Search and filter functionality
- Responsive design for mobile and desktop

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT with passlib for password hashing
- **Email**: SendGrid for verification emails
- **File Processing**: python-docx for Word document parsing
- **Deployment**: Render

### Frontend
- **Framework**: React.js
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Deployment**: Netlify

## Project Structure

```
nutrition-tracker/
│
├── app/                          # Backend application
│   ├── models/                   # SQLAlchemy models
│   │   ├── user.py
│   │   ├── meal.py
│   │   ├── plate.py
│   │   ├── snack.py
│   │   ├── hunger_log.py
│   │   ├── water_log.py
│   │   ├── weekly_notes.py
│   │   ├── nutritionist_recommendations.py
│   │   ├── compliance.py
│   │   └── verification_code.py
│   │
│   ├── routes/                   # API endpoints
│   │   ├── auth.py
│   │   ├── meals.py
│   │   ├── snacks.py
│   │   ├── plates.py
│   │   ├── hunger.py
│   │   ├── water.py
│   │   ├── weekly.py
│   │   ├── recommendations.py
│   │   ├── compliance.py
│   │   └── media.py
│   │
│   ├── services/                 # Business logic
│   │   ├── auth_service.py
│   │   ├── meal_service.py
│   │   ├── plate_service.py
│   │   ├── hunger_service.py
│   │   ├── water_service.py
│   │   ├── weekly_service.py
│   │   ├── file_service.py
│   │   ├── email_service.py
│   │   └── compliance_service.py
│   │
│   ├── schemas/                  # Pydantic schemas
│   ├── utils/                    # Utilities and dependencies
│   │   ├── dependencies.py
│   │   └── exceptions.py
│   │
│   └── database.py               # Database configuration
│
├── src/                          # Frontend application
│   ├── pages/                    # React pages
│   │   ├── auth/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   └── VerifyEmailPage.js
│   │   ├── DashboardPage.js
│   │   ├── MealEntryPage.js
│   │   ├── AddSnackPage.js
│   │   ├── WaterTrackingPage.js
│   │   ├── WeeklyReviewPage.js
│   │   ├── RecommendationsPage.js
│   │   └── CompliancePage.js
│   │
│   ├── services/                 # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── mealService.js
│   │   ├── snackService.js
│   │   ├── waterService.js
│   │   ├── weeklyService.js
│   │   ├── recommendationService.js
│   │   ├── complianceService.js
│   │   ├── plateService.js
│   │   └── hungerService.js
│   │
│   └── App.js                    # Main app component
│
├── tests/                        # Backend tests
│   ├── test_auth.py
│   ├── test_meals.py
│   ├── test_recommendations.py
│   ├── test_compliance.py
│   ├── test_water.py
│   └── test_weekly_notes.py
│
├── main.py                       # FastAPI application entry
├── setup_auth.py                 # Auth setup script
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn
- SendGrid account (for email verification)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nutrition-tracker
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Run the setup script to generate SECRET_KEY
   python setup_auth.py
   
   # Or manually create .env file:
   cp .env.example .env
   # Edit .env and add your values
   ```

5. **Initialize database**
   ```bash
   # Database will be created automatically on first run
   python main.py
   ```

6. **Run the server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend  # or wherever your React app is
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
   ```

4. **Run the development server**
   ```bash
   npm start
   ```

   The app will be available at `http://localhost:3000`

## Deployment

### Backend Deployment (Render)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the branch to deploy

2. **Configure the service**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Set environment variables** in Render dashboard:
   ```
   SECRET_KEY=<your-secret-key>
   SENDGRID_API_KEY=<your-sendgrid-key>
   FROM_EMAIL=<verified-sender-email>
   FRONTEND_URL=<your-netlify-url>
   ```

4. **Deploy**
   - Render will automatically deploy on every push to your selected branch
   - Your API will be available at: `https://your-app.onrender.com`

### Frontend Deployment (Netlify)

1. **Build the React app**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository
   - Or drag and drop the `build` folder

3. **Configure environment variables** in Netlify:
   ```
   REACT_APP_BACKEND_URL=https://your-app.onrender.com
   ```

4. **Configure build settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`

5. **Enable CORS** in your backend (`main.py`):
   ```python
   allow_origins=[
       "http://localhost:3000",
       "https://your-netlify-app.netlify.app"
   ]
   ```

### Post-Deployment Checklist

- Update CORS origins in backend
- Verify environment variables are set correctly
- Test email verification flow
- Test file uploads
- Check all API endpoints

## API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # Login user
POST   /api/v1/auth/verify-email      # Verify email with code
GET    /api/v1/auth/me                # Get current user info
```

### Meal Endpoints

```
GET    /api/v1/meals                  # Get all meals (optional: ?date=YYYY-MM-DD)
GET    /api/v1/meals/{id}             # Get specific meal
POST   /api/v1/meals/complete         # Complete a meal with details
```

### Snack Endpoints

```
GET    /api/v1/snacks                 # Get all snacks
POST   /api/v1/snacks                 # Add a snack
DELETE /api/v1/snacks/{id}            # Delete a snack
```

### Water Tracking Endpoints

```
GET    /api/v1/water/today            # Get today's water intake
POST   /api/v1/water                  # Log water intake
GET    /api/v1/water/history          # Get water history
PUT    /api/v1/water/goal             # Update daily water goal
```

### Weekly Review Endpoints

```
GET    /api/v1/weekly                 # Get all weekly notes
POST   /api/v1/weekly                 # Create weekly notes
GET    /api/v1/weekly/{id}            # Get specific weekly notes
PUT    /api/v1/weekly/{id}            # Update weekly notes
DELETE /api/v1/weekly/{id}            # Delete weekly notes
```

### Recommendations Endpoints

```
GET    /api/v1/recommendations        # Get all recommendations
POST   /api/v1/recommendations/upload # Upload Word document
PUT    /api/v1/recommendations/{id}/tag # Tag a recommendation item
DELETE /api/v1/recommendations/{id}   # Delete recommendations
```

### Compliance Endpoints

```
GET    /api/v1/compliance             # Get all compliance checks
POST   /api/v1/compliance             # Create compliance check
GET    /api/v1/compliance/{id}        # Get specific check
PUT    /api/v1/compliance/{id}        # Update compliance check
```

### Media Endpoints

```
POST   /api/v1/media/upload           # Upload image file
```

**Interactive API Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



---

Built with FastAPI and React
