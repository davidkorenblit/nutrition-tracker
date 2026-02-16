import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Import all models to register them
from app.models import user, meal, plate, hunger_log, snack, weekly_notes, nutritionist_recommendations, compliance, water_log, verification_code

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def main():
    # Open a DB session
    db = SessionLocal()
    try:
        # Check if email "admin@nutrition.com" exists
        existing_admin = db.query(User).filter(User.email == "admin@nutrition.com").first()
        
        if existing_admin:
            print("Admin already exists")
            return
        
        # Create a User instance directly
        admin_user = User(
            email="admin@nutrition.com",
            hashed_password=get_password_hash("AdminPass123!"),
            name="Head Nutritionist",
            role="admin",
            is_active=True,
            is_verified=True  # Bypass email verification
        )
        
        # Add and commit to DB
        db.add(admin_user)
        db.commit()
        
        print("Admin user created successfully: admin@nutrition.com")
    
    finally:
        db.close()

if __name__ == "__main__":
    main()