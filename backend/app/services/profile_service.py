from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.enums import EducationLevel, LearningStyle, StudyTime, UniversityLevel
from app.models.models import User
from app.schemas.profile import OnboardingSubmit, ProfileResponse, ProfileUpdate
from app.services.user_service import get_user


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _enum_str(value: object | None) -> str | None:
    if value is None:
        return None
    return value.value if hasattr(value, "value") else str(value)


def _learning_styles_list(user: User) -> list[str]:
    if user.learningStyles:
        return list(user.learningStyles)
    if user.learningStyle:
        v = _enum_str(user.learningStyle)
        return [v] if v else []
    return []


def _study_times_list(user: User) -> list[str]:
    if user.preferredStudyTimes:
        return list(user.preferredStudyTimes)
    if user.preferredStudyTime:
        v = _enum_str(user.preferredStudyTime)
        return [v] if v else []
    return []


def _apply_learning_styles(user: User, styles: list[str]) -> None:
    user.learningStyles = styles
    user.learningStyle = LearningStyle(styles[0]) if styles else None


def _apply_study_times(user: User, times: list[str]) -> None:
    user.preferredStudyTimes = times
    user.preferredStudyTime = StudyTime(times[0]) if times else None


def _to_profile_response(user: User) -> ProfileResponse:
    styles = _learning_styles_list(user)
    times = _study_times_list(user)
    base = ProfileResponse.model_validate(user)
    return base.model_copy(
        update={
            "learning_styles": styles,
            "preferred_study_times": times,
            "learning_style": LearningStyle(styles[0])
            if styles
            else user.learningStyle,
            "preferred_study_time": StudyTime(times[0])
            if times
            else user.preferredStudyTime,
        }
    )


def _normalize_subjects(subjects: list[str] | None) -> list[str]:
    if not subjects:
        return []
    seen: set[str] = set()
    result: list[str] = []
    for s in subjects:
        trimmed = s.strip()
        if trimmed and trimmed.lower() not in seen:
            seen.add(trimmed.lower())
            result.append(trimmed)
    return result


def _validate_subject_overlap(
    weak: list[str], strong: list[str]
) -> tuple[list[str], list[str]]:
    weak_norm = _normalize_subjects(weak)
    strong_norm = _normalize_subjects(strong)
    weak_lower = {s.lower() for s in weak_norm}
    strong_norm = [s for s in strong_norm if s.lower() not in weak_lower]
    return weak_norm, strong_norm


def _resolve_styles_from_body(
    styles: list[str] | None,
    single: LearningStyle | None,
) -> list[str] | None:
    if styles is not None:
        return [_enum_str(s) or str(s) for s in styles]
    if single is not None:
        v = _enum_str(single)
        return [v] if v else []
    return None


def _resolve_times_from_body(
    times: list[str] | None,
    single: StudyTime | None,
) -> list[str] | None:
    if times is not None:
        return [_enum_str(t) or str(t) for t in times]
    if single is not None:
        v = _enum_str(single)
        return [v] if v else []
    return None


def get_profile(db: Session, user_id: str) -> ProfileResponse:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")
    return _to_profile_response(user)


def update_profile(
    db: Session, user_id: str, body: ProfileUpdate
) -> ProfileResponse:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")

    if body.name is not None:
        user.name = body.name
    if body.language is not None:
        user.language = body.language
    if body.full_name is not None:
        user.fullName = body.full_name
        user.name = body.full_name
    if body.age is not None:
        user.age = body.age
    if body.country is not None:
        user.country = body.country
    if body.education_level is not None:
        user.educationLevel = body.education_level
    if body.education_archetype is not None:
        user.educationArchetype = body.education_archetype
    if body.education_tier is not None:
        user.educationTier = body.education_tier
    if body.education_level_label is not None:
        user.educationLevelLabel = body.education_level_label
    if body.education_track is not None:
        user.educationTrack = body.education_track
    if body.education_archetype_override is not None:
        user.educationArchetypeOverride = body.education_archetype_override
    if body.grade_or_year is not None:
        user.gradeOrYear = body.grade_or_year
    if body.university_level is not None:
        user.universityLevel = body.university_level
    if body.total_subjects is not None:
        user.totalSubjects = body.total_subjects

    if body.subject_names is not None:
        user.subjectNames = _normalize_subjects(body.subject_names)
    if body.weak_subjects is not None or body.strong_subjects is not None:
        weak = body.weak_subjects if body.weak_subjects is not None else user.weakSubjects
        strong = (
            body.strong_subjects
            if body.strong_subjects is not None
            else user.strongSubjects
        )
        user.weakSubjects, user.strongSubjects = _validate_subject_overlap(weak, strong)

    if body.daily_study_hours_goal is not None:
        user.dailyStudyHoursGoal = body.daily_study_hours_goal
    if body.learning_goals is not None:
        user.learningGoals = body.learning_goals

    style_values = _resolve_styles_from_body(body.learning_styles, body.learning_style)
    if style_values is not None:
        _apply_learning_styles(user, style_values)

    time_values = _resolve_times_from_body(
        body.preferred_study_times, body.preferred_study_time
    )
    if time_values is not None:
        _apply_study_times(user, time_values)

    if body.exam_type is not None:
        user.examType = body.exam_type
    if body.exam_prep_details is not None:
        user.examPrepDetails = body.exam_prep_details
    if body.onboarding_complete is not None:
        user.onboardingComplete = body.onboarding_complete

    if body.subject_names is not None:
        user.totalSubjects = len(user.subjectNames)

    db.commit()
    db.refresh(user)
    return _to_profile_response(user)


def complete_onboarding(
    db: Session, user_id: str, body: OnboardingSubmit
) -> ProfileResponse:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")

    tier = body.education_tier or ""
    needs_exam = tier in ("UNDERGRADUATE", "POSTGRADUATE", "DOCTORAL") or (
        body.education_level in (EducationLevel.UNIVERSITY, EducationLevel.JOB_TEST)
    )

    university_level = body.university_level
    if university_level is None and tier in (
        "UNDERGRADUATE",
        "POSTGRADUATE",
        "DOCTORAL",
    ):
        if tier == "UNDERGRADUATE":
            university_level = UniversityLevel.BACHELORS
        elif tier == "POSTGRADUATE":
            university_level = UniversityLevel.MASTERS
        elif tier == "DOCTORAL":
            university_level = UniversityLevel.PHD

    if needs_exam and not body.exam_type:
        raise ValueError("Exam or test type is required")

    if not body.learning_styles:
        raise ValueError("Select at least one learning style")

    subject_names = _normalize_subjects(body.subject_names)
    weak, strong = _validate_subject_overlap(
        body.weak_subjects, body.strong_subjects
    )

    style_values = [_enum_str(s) or str(s) for s in body.learning_styles]
    time_values = [_enum_str(t) or str(t) for t in body.preferred_study_times]

    user.name = body.full_name
    user.fullName = body.full_name
    user.language = body.language
    user.age = body.age
    user.country = body.country
    user.educationLevel = body.education_level
    user.educationArchetype = body.education_archetype
    user.educationTier = body.education_tier
    user.educationLevelLabel = body.education_level_label
    user.educationTrack = body.education_track
    user.educationArchetypeOverride = body.education_archetype_override
    user.gradeOrYear = body.grade_or_year
    user.universityLevel = university_level
    user.subjectNames = subject_names
    user.weakSubjects = weak
    user.strongSubjects = strong
    user.totalSubjects = len(subject_names)
    user.dailyStudyHoursGoal = body.daily_study_hours_goal
    user.learningGoals = body.learning_goals
    _apply_learning_styles(user, style_values)
    _apply_study_times(user, time_values)
    user.examType = body.exam_type
    user.examPrepDetails = body.exam_prep_details
    user.onboardingComplete = True
    user.profileCompletedAt = _utcnow()

    db.commit()
    db.refresh(user)
    return _to_profile_response(user)


def reset_profile(db: Session, user_id: str) -> ProfileResponse:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")

    user.onboardingComplete = False
    user.fullName = None
    user.age = None
    user.country = None
    user.educationLevel = None
    user.educationArchetype = None
    user.educationTier = None
    user.educationLevelLabel = None
    user.educationTrack = None
    user.educationArchetypeOverride = False
    user.gradeOrYear = None
    user.universityLevel = None
    user.totalSubjects = None
    user.subjectNames = []
    user.weakSubjects = []
    user.strongSubjects = []
    user.dailyStudyHoursGoal = None
    user.preferredStudyTime = None
    user.preferredStudyTimes = []
    user.learningGoals = None
    user.learningStyle = None
    user.learningStyles = []
    user.examType = None
    user.examPrepDetails = None
    user.profileCompletedAt = None

    db.commit()
    db.refresh(user)
    return _to_profile_response(user)
