from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    username_or_email: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

    def get_login_identifier(self) -> str:
        return self.username_or_email or self.username or self.email or ""

class RefreshRequest(BaseModel):
    refresh_token: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class DepartmentSummary(BaseModel):
    id: str
    code: str
    name: str

class UserSummary(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    roles: List[str] = []
    department: Optional[DepartmentSummary] = None
    is_active: bool = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int # in seconds
    user: UserSummary

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    roles: List[str] = []
    permissions: List[str] = []
    department: Optional[DepartmentSummary] = None
    is_active: bool
    is_locked: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    role_codes: List[str] = ["VIEWER"]
    department_id: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role_codes: Optional[List[str]] = None
    department_id: Optional[str] = None
    is_active: Optional[bool] = None

class PermissionResponse(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None
    resource: str
    action: str

class RoleResponse(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_codes: Optional[List[str]] = None
