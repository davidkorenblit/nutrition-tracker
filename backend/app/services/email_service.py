import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from dotenv import load_dotenv

load_dotenv()

# הגדרות SendGrid
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL")  # המייל שאישרת ב-SendGrid
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_verification_email(to_email: str, verification_code: str) -> bool:
    """
    שליחת מייל אימות למשתמש חדש באמצעות SendGrid.
    
    Args:
        to_email: כתובת המייל של המשתמש
        verification_code: קוד האימות (UUID)
    
    Returns:
        True אם נשלח בהצלחה, False אחרת
    """
    if not SENDGRID_API_KEY:
        raise ValueError("SENDGRID_API_KEY must be set in environment variables")
    
    if not FROM_EMAIL:
        raise ValueError("FROM_EMAIL must be set in environment variables")
    
    try:
        # יצירת לינק אימות
        verification_link = f"{FRONTEND_URL}/verify?code={verification_code}"
        
        # תוכן המייל ב-HTML
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; 
                            padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #2563eb; margin-bottom: 20px;">
                        Welcome to Nutrition Tracker! 🎉
                    </h2>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Thank you for registering. Please verify your email address to activate your account.
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        Click the button below to verify your email:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" 
                           style="display: inline-block; padding: 14px 28px; background-color: #2563eb; 
                                  color: white; text-decoration: none; border-radius: 8px; 
                                  font-weight: 600; font-size: 16px;">
                            Verify Email
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Or copy this link to your browser:
                    </p>
                    <p style="color: #9ca3af; font-size: 13px; word-break: break-all; 
                              background-color: #f3f4f6; padding: 10px; border-radius: 6px;">
                        {verification_link}
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
                        This link will expire in 24 hours.<br>
                        If you didn't register for Nutrition Tracker, please ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        # יצירת הודעה
        message = Mail(
            from_email=Email(FROM_EMAIL),
            to_emails=To(to_email),
            subject="Verify Your Email - Nutrition Tracker",
            html_content=Content("text/html", html_content)
        )
        
        # שליחה דרך SendGrid
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        # בדיקת תגובה
        if response.status_code in [200, 201, 202]:
            print(f"✓ Verification email sent successfully to {to_email}")
            return True
        else:
            print(f"✗ SendGrid returned status {response.status_code}")
            return False
    
    except Exception as e:
        print(f"✗ Failed to send email: {type(e).__name__}: {e}")
        return False


def send_password_reset_email(to_email: str, reset_code: str) -> bool:
    """
    שליחת מייל לאיפוס סיסמה (אופציונלי - לעתיד).
    
    Args:
        to_email: כתובת המייל של המשתמש
        reset_code: קוד איפוס הסיסמה
    
    Returns:
        True אם נשלח בהצלחה, False אחרת
    """
    if not SENDGRID_API_KEY or not FROM_EMAIL:
        raise ValueError("SENDGRID_API_KEY and FROM_EMAIL must be set")
    
    try:
        reset_link = f"{FRONTEND_URL}/reset-password?code={reset_code}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; 
                            padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc2626; margin-bottom: 20px;">
                        Password Reset Request
                    </h2>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        You requested to reset your password. Click the button below to proceed:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="display: inline-block; padding: 14px 28px; background-color: #dc2626; 
                                  color: white; text-decoration: none; border-radius: 8px; 
                                  font-weight: 600; font-size: 16px;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Or copy this link to your browser:
                    </p>
                    <p style="color: #9ca3af; font-size: 13px; word-break: break-all; 
                              background-color: #f3f4f6; padding: 10px; border-radius: 6px;">
                        {reset_link}
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
                        This link will expire in 1 hour.<br>
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = Mail(
            from_email=Email(FROM_EMAIL),
            to_emails=To(to_email),
            subject="Password Reset - Nutrition Tracker",
            html_content=Content("text/html", html_content)
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code in [200, 201, 202]:
            print(f"✓ Password reset email sent to {to_email}")
            return True
        else:
            print(f"✗ SendGrid returned status {response.status_code}")
            return False
    
    except Exception as e:
        print(f"✗ Failed to send password reset email: {e}")
        return False