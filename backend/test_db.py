import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# טעינת המשתנים מהקובץ שסידרנו בבאקאנד
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url = os.getenv("DATABASE_URL")

if not url:
    print("\n❌ Error: DATABASE_URL not found in .env file!")
else:
    # תיקון פרוטוקול עבור SQLAlchemy
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    engine = create_engine(url)

    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 'Connection Successful!'"))
            print(f"\n✅ {result.all()[0][0]}")
            print("The backend can successfully talk to Supabase PostgreSQL (Port 6543).\n")
    except Exception as e:
        print(f"\n❌ Connection Failed!")
        print(f"Error details: {e}\n")