"""
סקריפט למחיקת משתמשים לא מאומתים מה-Database
================================================

סקריפט זה מוחק משתמשים שלא אימתו את המייל שלהם תוך 24 שעות.
ניתן להריץ אותו באופן ידני או לקבוע אותו כ-Cron Job.

שימוש:
------
1. הרצה ידנית:
   python cleanup_unverified_users.py

2. הרצה עם דגל dry-run (רק בדיקה, ללא מחיקה):
   python cleanup_unverified_users.py --dry-run

3. הרצה עם זמן תפוגה מותאם אישית (למשל 48 שעות):
   python cleanup_unverified_users.py --hours 48
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.models.verification_code import VerificationCode
import argparse
from app.models import user, verification_code, meal, plate, snack, water_log, hunger_log, weekly_notes, compliance, recommendations

def delete_unverified_users(db: Session, hours: int = 24, dry_run: bool = False) -> dict:
    """
    מחיקת משתמשים שלא אימתו את המייל שלהם תוך X שעות.
    
    Args:
        db: Database session
        hours: מספר שעות לחכות לפני מחיקה (ברירת מחדל: 24)
        dry_run: אם True, רק מציג מה יימחק ללא מחיקה בפועל
    
    Returns:
        dict: סטטיסטיקות על המחיקה
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    # מצא משתמשים לא מאומתים שנוצרו לפני זמן התפוגה
    unverified_users = db.query(User).filter(
        User.is_verified == False,
        User.created_at < cutoff_time
    ).all()
    
    stats = {
        "total_found": len(unverified_users),
        "deleted": 0,
        "failed": 0,
        "dry_run": dry_run,
        "cutoff_time": cutoff_time.isoformat(),
        "users": []
    }
    
    for user in unverified_users:
        user_info = {
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at.isoformat(),
            "age_hours": (datetime.utcnow() - user.created_at).total_seconds() / 3600
        }
        
        if dry_run:
            print(f"[DRY RUN] Would delete: {user.email} (created {user_info['age_hours']:.1f}h ago)")
            stats["users"].append(user_info)
        else:
            try:
                # מחק קודי אימות קשורים תחילה (foreign key constraint)
                db.query(VerificationCode).filter(
                    VerificationCode.user_id == user.id
                ).delete()
                
                # מחק את המשתמש
                db.delete(user)
                db.commit()
                
                print(f"✓ Deleted: {user.email} (created {user_info['age_hours']:.1f}h ago)")
                stats["deleted"] += 1
                stats["users"].append(user_info)
                
            except Exception as e:
                print(f"✗ Failed to delete {user.email}: {e}")
                db.rollback()
                stats["failed"] += 1
    
    return stats


def main():
    """
    פונקציה ראשית להרצת הסקריפט מ-CLI.
    """
    parser = argparse.ArgumentParser(
        description="Delete unverified users from the database"
    )
    parser.add_argument(
        "--hours",
        type=int,
        default=24,
        help="Hours to wait before deleting unverified users (default: 24)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be deleted without actually deleting"
    )
    
    args = parser.parse_args()
    
    # קבל database session
    db = next(get_db())
    
    try:
        print(f"\n{'='*60}")
        print(f"Cleanup Unverified Users Script")
        print(f"{'='*60}")
        print(f"Mode: {'DRY RUN (no changes)' if args.dry_run else 'LIVE (will delete)'}")
        print(f"Cutoff: {args.hours} hours")
        print(f"{'='*60}\n")
        
        # הרץ מחיקה
        stats = delete_unverified_users(db, hours=args.hours, dry_run=args.dry_run)
        
        # הדפס סיכום
        print(f"\n{'='*60}")
        print(f"Summary:")
        print(f"{'='*60}")
        print(f"Found unverified users: {stats['total_found']}")
        if not args.dry_run:
            print(f"Successfully deleted: {stats['deleted']}")
            print(f"Failed to delete: {stats['failed']}")
        print(f"{'='*60}\n")
        
        if args.dry_run and stats['total_found'] > 0:
            print("Run without --dry-run to actually delete these users.\n")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()