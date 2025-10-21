from sqlalchemy.orm import Session
from app.models.water_log import WaterLog
from datetime import datetime, date

def create_water_log(user_id: int, amount_ml: float, db: Session) -> WaterLog:
    water_log = WaterLog(
        user_id=user_id,
        amount_ml=amount_ml
    )
    db.add(water_log)
    db.commit()
    db.refresh(water_log)
    return water_log

def get_water_logs_by_date(user_id: int, target_date: date, db: Session):
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    logs = db.query(WaterLog).filter(
        WaterLog.user_id == user_id,
        WaterLog.logged_at >= start_of_day,
        WaterLog.logged_at <= end_of_day
    ).all()
    
    return logs

def get_total_water_by_date(user_id: int, target_date: date, db: Session) -> float:
    logs = get_water_logs_by_date(user_id, target_date, db)
    return sum(log.amount_ml for log in logs)

def delete_water_log(log_id: int, user_id: int, db: Session) -> bool:
    water_log = db.query(WaterLog).filter(
        WaterLog.id == log_id,
        WaterLog.user_id == user_id
    ).first()
    
    if not water_log:
        return False
    
    db.delete(water_log)
    db.commit()
    return True

def update_water_log(log_id: int, user_id: int, amount_ml: float, db: Session) -> WaterLog:
    water_log = db.query(WaterLog).filter(
        WaterLog.id == log_id,
        WaterLog.user_id == user_id
    ).first()
    
    if not water_log:
        return None
    
    water_log.amount_ml = amount_ml
    db.commit()
    db.refresh(water_log)
    return water_log