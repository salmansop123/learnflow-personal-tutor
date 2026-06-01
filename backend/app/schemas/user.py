from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EducationLevel


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    language: str | None = Field(None, min_length=2, max_length=10)
    education_level: EducationLevel | None = Field(None, alias="educationLevel")

    model_config = ConfigDict(populate_by_name=True)


class UserPlanUpdate(BaseModel):
    plan: str = Field(description="FREE, PRO, PREMIUM_PLUS, or ENTERPRISE")
