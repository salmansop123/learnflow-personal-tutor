import enum


class Plan(str, enum.Enum):
    FREE = "FREE"
    PRO = "PRO"
    PREMIUM_PLUS = "PREMIUM_PLUS"
    ENTERPRISE = "ENTERPRISE"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class ReminderType(str, enum.Enum):
    STUDY = "STUDY"
    QUIZ = "QUIZ"
    TASK = "TASK"
    CUSTOM = "CUSTOM"


class EducationLevel(str, enum.Enum):
    SCHOOL = "SCHOOL"
    COLLEGE = "COLLEGE"
    UNIVERSITY = "UNIVERSITY"
    JOB_TEST = "JOB_TEST"


class UniversityLevel(str, enum.Enum):
    BACHELORS = "BACHELORS"
    MASTERS = "MASTERS"
    PHD = "PHD"


class LearningStyle(str, enum.Enum):
    SHORT_NOTES = "SHORT_NOTES"
    DETAILED_EXPLANATIONS = "DETAILED_EXPLANATIONS"
    VISUAL_LEARNING = "VISUAL_LEARNING"
    QUIZ_BASED = "QUIZ_BASED"


class StudyTime(str, enum.Enum):
    MORNING = "MORNING"
    AFTERNOON = "AFTERNOON"
    EVENING = "EVENING"
    NIGHT = "NIGHT"
