# Nutrition Tracker API 

Personal nutrition tracking application - Backend (Phase 1)

## 📋 Project Description

A web application for tracking eating habits, measuring hunger sensations, and monitoring compliance with nutritionist recommendations.

### Core Features
- **Daily Meal Tracking**: 3 meals per day (breakfast, lunch, dinner)
- **Dual Plate System**: 
  - Healthy Plate (fixed): 50% vegetables, 30% protein, 20% carbs
  - Free Plate (variable): user defines the composition
- **Hunger Tracking**: 3 measurements per meal (before/during/after)
- **Snacks**: Log snacks throughout the day
- **Weekly Tracking**: New foods tried during the week
- **Photo Upload**: Meal photography

---

##  Technologies

- **Backend Framework**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+
- **Database**: SQLite (development) → PostgreSQL (future production)
- **Validation**: Pydantic 2.0+
- **Server**: Uvicorn (ASGI)

---

## 📂 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── database.py             # Database connection
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── meal.py
│   │   ├── plate.py
│   │   ├── hunger_log.py
│   │   ├── snack.py
│   │   └── weekly_notes.py
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── meal.py
│   │   ├── plate.py
│   │   ├── hunger_log.py
│   │   ├── snack.py
│   │   └── weekly.py
│   │
│   ├── routes/                 # API endpoints
│   │   ├── meals.py
│   │   ├── plates.py
│   │   ├── hunger.py
│   │   ├── snacks.py
│   │   ├── weekly.py
│   │   └── media.py
│   │
│   ├── services/               # Business logic
│   │   ├── meal_service.py
│   │   ├── plate_service.py
│   │   ├── hunger_service.py
│   │   ├── weekly_service.py
│   │   └── media_service.py
│   │
│   └── utils/                  # Helper functions
│       ├── validators.py
│       └── exceptions.py
│
├── uploads/                    # Uploaded images
├── venv/                       # Virtual environment
├── nutrition_tracker.db        # SQLite database
└── requirements.txt
```

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.9+
- pip

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd nutrition-tracker/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
```

3. **Activate the environment**
- Windows:
```bash
venv\Scripts\activate
```
- Mac/Linux:
```bash
source venv/bin/activate
```

4. **Install dependencies**
```bash
pip install -r requirements.txt
```

5. **Run the server**
```bash
uvicorn app.main:app --reload
```

Server will be available at: `http://127.0.0.1:8000`

---

## 📖 API Documentation

### Interactive Docs
After starting the server, visit:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

### Main Endpoints

#### 🍽️ Meals
- `GET /api/v1/meals/?date=YYYY-MM-DD` - Get meals by date
- `GET /api/v1/meals/{meal_id}` - Get specific meal
- `POST /api/v1/meals/complete` - Complete meal entry (plates + hunger)
- `PUT /api/v1/meals/{meal_id}` - Update meal
- `DELETE /api/v1/meals/{meal_id}` - Delete meal

#### 🍽️ Plates
- `POST /api/v1/plates/` - Create free plate
- `GET /api/v1/plates/{meal_id}` - Get plates for a meal

#### 😋 Hunger Logs
- `POST /api/v1/hunger-logs/` - Create hunger log
- `GET /api/v1/hunger-logs/{meal_id}` - Get hunger logs for a meal

#### 🍎 Snacks
- `POST /api/v1/snacks/` - Create snack
- `GET /api/v1/snacks/?date=YYYY-MM-DD` - Get snacks by date
- `DELETE /api/v1/snacks/{snack_id}` - Delete snack

#### 📝 Weekly Notes
- `POST /api/v1/weekly/` - Create weekly notes
- `GET /api/v1/weekly/?week_start_date=YYYY-MM-DD` - Get weekly notes
- `PUT /api/v1/weekly/{notes_id}` - Update notes
- `DELETE /api/v1/weekly/{notes_id}` - Delete notes

#### 📷 Media
- `POST /api/v1/media/upload` - Upload image

---

## 💡 Usage Examples

### Create Complete Meal
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/meals/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_id": 1,
    "free_plate_vegetables": 60,
    "free_plate_protein": 25,
    "free_plate_carbs": 15,
    "hunger_before": 8,
    "hunger_during": 5,
    "hunger_after": 3,
    "photo_url": "/uploads/meal123.jpg"
  }'
```

### Add Snack
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/snacks/" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-03",
    "description": "Nuts and apple"
  }'
```

### Create Weekly Notes
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/weekly/" \
  -H "Content-Type: application/json" \
  -d '{
    "week_start_date": "2025-10-01",
    "new_foods": [
      {
        "food_name": "Quinoa",
        "difficulty_level": 7,
        "notes": "Interesting taste"
      }
    ]
  }'
```

---

## ✅ Validation Rules

### Dates
- Required format: `YYYY-MM-DD`
- Example: `"2025-10-03"` ✅
- Invalid: `"03/10/2025"` ❌

### Hunger & Difficulty Levels
- Range: 1-10
- Integer only

### Plates
- Percentages must sum to 100%
- Each percentage: 0-100

---

## 📊 Project Status

### ✅ Phase 1 - Backend (Complete)
- [x] Database models
- [x] API endpoints
- [x] Validation
- [x] Photo upload
- [x] Complete meal creation

### 🔄 Phase 2 - Frontend (Planned)
- [ ] React setup
- [ ] Meal entry form
- [ ] Dashboard
- [ ] Data visualization

### 🔮 Phase 3 - Advanced Features (Future)
- [ ] Word file parsing (nutritionist recommendations)
- [ ] Compliance checking
- [ ] Reports and analytics
- [ ] Timer reminders

---

## 🤝 Contributing

Personal project for learning and skill development.

---

## 📄 License

Private project - for personal use only.

---

## 👤 Developer

**David** - Computer Science Student

---

## 📞 Contact

For questions or suggestions, reach out at [dycoren18@gmaul.com]

---

**Last Updated**: October 2025  
**Version**: 1.0.0 (Phase 1 Complete)