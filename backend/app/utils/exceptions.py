class ValidationError(Exception):
    """שגיאת validation"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class NotFoundError(Exception):
    """רשומה לא נמצאה"""
    def __init__(self, resource: str, id: int):
        self.message = f"{resource} with id {id} not found"
        super().__init__(self.message)


class FileUploadError(Exception):
    """שגיאת העלאת קובץ"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class DuplicateError(Exception):
    """רשומה כפולה"""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)