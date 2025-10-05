"""
סקריפט אוטומטי להקמת Authentication System
מריץ פעם אחת ועושה הכל!
"""
import secrets
import os
import subprocess
import sys

print("=" * 70)
print("🔐 Auth Setup - Setting up Authentication System")
print("=" * 70)

# Step 1: Generate random SECRET_KEY
print("\n[1/6] Generating random SECRET_KEY...")
secret_key = secrets.token_hex(32)
print(f"✅ SECRET_KEY generated: {secret_key[:20]}...{secret_key[-10:]}")

# Step 2: Create .env file
print("\n[2/6] Creating .env file...")
env_path = os.path.join("..", ".env")  # Go back one directory

if os.path.exists(env_path):
    response = input("⚠️  .env already exists. Overwrite? (y/n): ")
    if response.lower() != 'y':
        print("❌ Cancelled")
        sys.exit(1)

with open(env_path, "w") as f:
    f.write(f"SECRET_KEY={secret_key}\n")
print(f"✅ .env created at: {env_path}")

# Step 3: Create .env.example
print("\n[3/6] Creating .env.example...")
env_example_path = os.path.join("..", ".env.example")
with open(env_example_path, "w") as f:
    f.write("# Environment Variables Template\n")
    f.write("# Copy to .env and replace with real values\n\n")
    f.write("SECRET_KEY=your-secret-key-here-run-setup_auth.py-to-generate\n")
print(f"✅ .env.example created")

# Step 4: Check/update .gitignore
print("\n[4/6] Updating .gitignore...")
gitignore_path = os.path.join("..", ".gitignore")

gitignore_content = """# Environment variables (CRITICAL - NEVER COMMIT!)
.env
.env.local
.env.*.local

# Database
*.db
nutrition_tracker.db

# Python
__pycache__/
*.pyc
*.pyo
venv/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"""

with open(gitignore_path, "w") as f:
    f.write(gitignore_content)
print("✅ .gitignore updated")

# Step 5: Install python-dotenv
print("\n[5/6] Installing python-dotenv...")
try:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-dotenv", "-q"])
    print("✅ python-dotenv installed")
except:
    print("⚠️  Error installing python-dotenv - install manually: pip install python-dotenv")

# Step 6: Update requirements.txt
print("\n[6/6] Updating requirements.txt...")
try:
    subprocess.check_call([sys.executable, "-m", "pip", "freeze"], 
                         stdout=open(os.path.join("..", "requirements.txt"), "w"))
    print("✅ requirements.txt updated")
except:
    print("⚠️  Error updating requirements.txt - update manually: pip freeze > requirements.txt")

# Summary
print("\n" + "=" * 70)
print("🎉 Setup completed successfully!")
print("=" * 70)
print("\n📋 What was created:")
print(f"  ✅ .env (with SECRET_KEY)")
print(f"  ✅ .env.example (template)")
print(f"  ✅ .gitignore (updated)")
print(f"  ✅ python-dotenv (installed)")
print(f"  ✅ requirements.txt (updated)")

print("\n⚠️  Important:")
print("  - .env will NOT be pushed to GitHub (in .gitignore)")
print("  - Before push always check: git status")
print("  - If you see .env → git rm --cached .env")

print("\n🔐 Your SECRET_KEY:")
print(f"  {secret_key}")
print("\n💾 Save this key in a secure place!")
print("=" * 70)