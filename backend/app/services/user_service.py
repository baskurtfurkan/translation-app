from datetime import datetime
from typing import List, Optional
from ..database.mongodb import get_user_collection
from ..models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    @staticmethod
    def serialize_datetime(dt: any) -> str:
        if isinstance(dt, datetime):
            return dt.isoformat()
        elif isinstance(dt, str):
            return dt
        return datetime.utcnow().isoformat()

    @staticmethod
    async def create_user(username: str, password: str) -> bool:
        collection = await get_user_collection()
        
        # Kullanıcı adı kontrolü
        if await collection.find_one({"username": username}):
            return False
        
        # Şifreyi hashle
        hashed_password = pwd_context.hash(password)
        
        # Yeni kullanıcı oluştur
        current_time = datetime.utcnow().isoformat()
        user = User(
            username=username,
            password=hashed_password,
            online_status=False,
            friends=[],
            friend_requests=[],
            created_at=current_time,
            last_seen=current_time,
            preferred_language="tr"
        )
        
        await collection.insert_one(user.dict())
        return True

    @staticmethod
    async def verify_user(username: str, password: str) -> bool:
        collection = await get_user_collection()
        user = await collection.find_one({"username": username})
        
        if not user:
            return False
            
        return pwd_context.verify(password, user["password"])

    @staticmethod
    async def send_friend_request(from_username: str, to_username: str) -> bool:
        collection = await get_user_collection()
        
        # Hedef kullanıcıyı bul
        to_user = await collection.find_one({"username": to_username})
        if not to_user or from_username in to_user.get("friend_requests", []):
            return False
            
        # İstek gönder
        await collection.update_one(
            {"username": to_username},
            {"$push": {"friend_requests": from_username}}
        )
        return True

    @staticmethod
    async def accept_friend_request(username: str, friend_username: str) -> bool:
        collection = await get_user_collection()
        
        try:
            # İsteği kaldır ve arkadaş listesine ekle
            result = await collection.update_one(
                {"username": username, "friend_requests": friend_username},
                {
                    "$pull": {"friend_requests": friend_username},
                    "$push": {"friends": friend_username}
                }
            )
            
            if result.modified_count > 0:
                # Karşı tarafa da ekle
                await collection.update_one(
                    {"username": friend_username},
                    {"$push": {"friends": username}}
                )
                return True
            return False
        except Exception as e:
            print(f"Error accepting friend request: {str(e)}")
            return False

    @staticmethod
    async def reject_friend_request(username: str, friend_username: str) -> bool:
        collection = await get_user_collection()
        
        result = await collection.update_one(
            {"username": username},
            {"$pull": {"friend_requests": friend_username}}
        )
        return result.modified_count > 0

    @staticmethod
    async def get_friend_requests(username: str) -> List[str]:
        collection = await get_user_collection()
        user = await collection.find_one({"username": username})
        if not user:
            return []
        return user.get("friend_requests", [])

    @staticmethod
    async def get_friends(username: str) -> List[dict]:
        collection = await get_user_collection()
        try:
            user = await collection.find_one({"username": username})
            if not user:
                return []
                
            # Arkadaşların detaylarını getir
            friends = []
            for friend_username in user.get("friends", []):
                friend = await collection.find_one({"username": friend_username})
                if friend:
                    friends.append({
                        "username": friend["username"],
                        "online_status": friend.get("online_status", False),
                        "last_seen": UserService.serialize_datetime(friend.get("last_seen"))
                    })
            return friends
        except Exception as e:
            print(f"Error getting friends: {str(e)}")
            return []

    @staticmethod
    async def update_online_status(username: str, status: bool):
        collection = await get_user_collection()
        try:
            await collection.update_one(
                {"username": username},
                {
                    "$set": {
                        "online_status": status,
                        "last_seen": datetime.utcnow().isoformat()
                    }
                }
            )
        except Exception as e:
            print(f"Error updating online status: {str(e)}") 