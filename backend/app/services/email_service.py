import os
import resend
from dotenv import load_dotenv

load_dotenv()

# הגדרות Resend
resend.api_key = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = "onboarding@resend.dev"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://dailybite-frontend.onrender.com")


def send_verification_email(to_email: str, verification_code: str) -> bool:
    """
    שליחת מייל אימות למשתמש חדש.
    
    Args:
        to_email: כתובת המייל של המשתמש
        verification_code: קוד האימות (UUID)
    
    Returns:
        True אם נשלח בהצלחה, False אחרת
    """
    if not resend.api_key:
        raise ValueError("RESEND_API_KEY must be set in environment variables")
    
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
        
        # שליחת המייל דרך Resend API
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        
        resend.Emails.send(params)
        
        return True
    
    except Exception as e:
        print(f"Failed to send email via Resend: {e}")
        return False