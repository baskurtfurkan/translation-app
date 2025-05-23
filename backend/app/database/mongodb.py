from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

# MongoDB bağlantı bilgileri
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "anlikcevirisistemi"
COLLECTION_NAME = "users"

# Asenkron MongoDB client
async def get_mongodb():
    client = AsyncIOMotorClient(MONGODB_URL)
    return client[DATABASE_NAME]

# Senkron MongoDB client (gerekirse)
def get_sync_mongodb():
    client = MongoClient(MONGODB_URL)
    return client[DATABASE_NAME]

# Veritabanı koleksiyonları
async def get_user_collection():
    db = await get_mongodb()
    return db[COLLECTION_NAME] 