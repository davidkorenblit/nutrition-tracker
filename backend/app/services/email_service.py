import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# הגדרות Gmail SMTP
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL")  # המייל ממנו תשלח
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # App Password של Gmail
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://dailybite-frontend.runmydocker-app.com") # כתובת הפרונטאנד


def send_verification_email(to_email: str, verification_code: str) -> bool:
    """
    שליחת מייל אימות למשתמש חדש.
    
    Args:
        to_email: כתובת המייל של המשתמש
        verification_code: קוד האימות (UUID)
    
    Returns:
        True אם נשלח בהצלחה, False אחרת
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise ValueError("SMTP_EMAIL and SMTP_PASSWORD must be set in .env file")
    
    try:
        # יצירת תוכן המייל
        subject = "Verify Your Email - Nutrition Tracker"
        verification_link = f"{FRONTEND_URL}/verify?code={verification_code}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">Welcome to Nutrition Tracker! 🎉</h2>
                <p>Thank you for registering. Please verify your email address to activate your account.</p>
                <p>Click the button below to verify your email:</p>
                <a href="{verification_link}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #2563eb; 
                          color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Verify Email
                </a>
                <p>Or copy this link to your browser:</p>
                <p style="color: #6b7280; word-break: break-all;">{verification_link}</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    This link will expire in 24 hours.<br>
                    If you didn't register, please ignore this email.
                </p>
            </body>
        </html>
        """
        
        # יצירת הודעת MIME
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SMTP_EMAIL
        message["To"] = to_email
        
        # הוספת תוכן HTML
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # שליחת המייל
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # הצפנה
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(message)
        
        return True
    
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False