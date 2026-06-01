from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import EducationLevel


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=24)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=24)


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkVerifyRequest(BaseModel):
    email: EmailStr
    token: str


class GoogleOAuthRequest(BaseModel):
    email: EmailStr
    name: str | None = None
    image: str | None = None
    provider: str = "google"
    provider_account_id: str = Field(alias="providerAccountId")

    model_config = ConfigDict(populate_by_name=True)


class SessionValidateRequest(BaseModel):
    session_token: str = Field(alias="sessionToken")

    model_config = ConfigDict(populate_by_name=True)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None = None
    image: str | None = None
    plan: str
    language: str = "en"
    education_level: EducationLevel | None = Field(None, alias="educationLevel")
    onboarding_complete: bool = Field(False, alias="onboardingComplete")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class AuthSessionResponse(BaseModel):
    user: UserResponse
    session_token: str = Field(alias="sessionToken", serialization_alias="sessionToken")

    model_config = ConfigDict(
        populate_by_name=True,
        serialize_by_alias=True,
    )


class MessageResponse(BaseModel):
    message: str
