from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.user_service import UserService

router = APIRouter()

class UserCredentials(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(credentials: UserCredentials):
    success = await UserService.create_user(
        username=credentials.username,
        password=credentials.password
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Kullanıcı adı zaten kullanımda"
        )
    
    return {"message": "Kayıt başarılı"}

@router.post("/login")
async def login(credentials: UserCredentials):
    is_valid = await UserService.verify_user(
        username=credentials.username,
        password=credentials.password
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail="Geçersiz kullanıcı adı veya şifre"
        )
    
    return {
        "message": "Giriş başarılı",
        "username": credentials.username
    } 