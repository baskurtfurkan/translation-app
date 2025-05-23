from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class User(BaseModel):
    username: str = Field(..., unique=True)
    password: str
    online_status: bool = False
    friends: List[str] = []  # List of usernames
    friend_requests: List[str] = []  # List of usernames who sent requests
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    preferred_language: str = "tr"  # Default language preference

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None
        }
        
    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        # datetime nesnelerini ISO format string'e dönüştür
        if d.get('created_at'):
            d['created_at'] = d['created_at'].isoformat()
        if d.get('last_seen'):
            d['last_seen'] = d['last_seen'].isoformat()
        return d 