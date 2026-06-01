from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    EducationLevel,
    LearningStyle,
    StudyTime,
    UniversityLevel,
)


class ProfileResponse(BaseModel):
    id: str
    email: str
    name: str | None = None
    image: str | None = None
    plan: str
    language: str = "en"
    onboarding_complete: bool = Field(False, alias="onboardingComplete")
    full_name: str | None = Field(None, alias="fullName")
    age: int | None = None
    country: str | None = None
    education_level: EducationLevel | None = Field(None, alias="educationLevel")
    education_archetype: str | None = Field(None, alias="educationArchetype")
    education_tier: str | None = Field(None, alias="educationTier")
    education_level_label: str | None = Field(None, alias="educationLevelLabel")
    education_track: str | None = Field(None, alias="educationTrack")
    education_archetype_override: bool = Field(
        False, alias="educationArchetypeOverride"
    )
    grade_or_year: str | None = Field(None, alias="gradeOrYear")
    university_level: UniversityLevel | None = Field(None, alias="universityLevel")
    total_subjects: int | None = Field(None, alias="totalSubjects")
    subject_names: list[str] = Field(default_factory=list, alias="subjectNames")
    weak_subjects: list[str] = Field(default_factory=list, alias="weakSubjects")
    strong_subjects: list[str] = Field(default_factory=list, alias="strongSubjects")
    daily_study_hours_goal: float | None = Field(None, alias="dailyStudyHoursGoal")
    preferred_study_time: StudyTime | None = Field(None, alias="preferredStudyTime")
    preferred_study_times: list[str] = Field(
        default_factory=list, alias="preferredStudyTimes"
    )
    learning_goals: str | None = Field(None, alias="learningGoals")
    learning_style: LearningStyle | None = Field(None, alias="learningStyle")
    learning_styles: list[str] = Field(default_factory=list, alias="learningStyles")
    exam_type: str | None = Field(None, alias="examType")
    exam_prep_details: str | None = Field(None, alias="examPrepDetails")
    profile_completed_at: datetime | None = Field(None, alias="profileCompletedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        ser_json_by_alias=True,
    )


class ProfileUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    language: str | None = Field(None, min_length=2, max_length=10)
    full_name: str | None = Field(None, alias="fullName", max_length=120)
    age: int | None = Field(None, ge=5, le=80)
    country: str | None = Field(None, max_length=80)
    education_level: EducationLevel | None = Field(None, alias="educationLevel")
    education_archetype: str | None = Field(None, alias="educationArchetype", max_length=40)
    education_tier: str | None = Field(None, alias="educationTier", max_length=40)
    education_level_label: str | None = Field(
        None, alias="educationLevelLabel", max_length=120
    )
    education_track: str | None = Field(None, alias="educationTrack", max_length=20)
    education_archetype_override: bool | None = Field(
        None, alias="educationArchetypeOverride"
    )
    grade_or_year: str | None = Field(None, alias="gradeOrYear", max_length=80)
    university_level: UniversityLevel | None = Field(None, alias="universityLevel")
    total_subjects: int | None = Field(None, alias="totalSubjects", ge=1, le=20)
    subject_names: list[str] | None = Field(None, alias="subjectNames")
    weak_subjects: list[str] | None = Field(None, alias="weakSubjects")
    strong_subjects: list[str] | None = Field(None, alias="strongSubjects")
    daily_study_hours_goal: float | None = Field(
        None, alias="dailyStudyHoursGoal", ge=0.5, le=16
    )
    preferred_study_time: StudyTime | None = Field(None, alias="preferredStudyTime")
    preferred_study_times: list[str] | None = Field(None, alias="preferredStudyTimes")
    learning_goals: str | None = Field(None, alias="learningGoals", max_length=2000)
    learning_style: LearningStyle | None = Field(None, alias="learningStyle")
    learning_styles: list[str] | None = Field(None, alias="learningStyles")
    exam_type: str | None = Field(None, alias="examType", max_length=120)
    exam_prep_details: str | None = Field(
        None, alias="examPrepDetails", max_length=2000
    )
    onboarding_complete: bool | None = Field(None, alias="onboardingComplete")

    model_config = ConfigDict(populate_by_name=True)


class OnboardingSubmit(BaseModel):
    full_name: str = Field(alias="fullName", min_length=1, max_length=120)
    language: str = Field(min_length=2, max_length=10)
    age: int | None = Field(None, ge=5, le=80)
    country: str | None = Field(None, max_length=80)
    education_level: EducationLevel = Field(alias="educationLevel")
    education_archetype: str = Field(alias="educationArchetype", min_length=1, max_length=40)
    education_tier: str = Field(alias="educationTier", min_length=1, max_length=40)
    education_level_label: str = Field(
        alias="educationLevelLabel", min_length=1, max_length=120
    )
    education_track: str | None = Field(None, alias="educationTrack", max_length=20)
    education_archetype_override: bool = Field(
        False, alias="educationArchetypeOverride"
    )
    grade_or_year: str = Field(alias="gradeOrYear", min_length=1, max_length=80)
    university_level: UniversityLevel | None = Field(None, alias="universityLevel")
    subject_names: list[str] = Field(alias="subjectNames", min_length=1)
    weak_subjects: list[str] = Field(default_factory=list, alias="weakSubjects")
    strong_subjects: list[str] = Field(default_factory=list, alias="strongSubjects")
    daily_study_hours_goal: float | None = Field(None, alias="dailyStudyHoursGoal")
    preferred_study_time: StudyTime | None = Field(None, alias="preferredStudyTime")
    preferred_study_times: list[StudyTime] = Field(
        default_factory=list, alias="preferredStudyTimes"
    )
    learning_goals: str | None = Field(None, alias="learningGoals", max_length=2000)
    learning_style: LearningStyle | None = Field(None, alias="learningStyle")
    learning_styles: list[LearningStyle] = Field(
        alias="learningStyles", min_length=1
    )
    exam_type: str | None = Field(None, alias="examType", max_length=120)
    exam_prep_details: str | None = Field(
        None, alias="examPrepDetails", max_length=2000
    )

    model_config = ConfigDict(populate_by_name=True)
