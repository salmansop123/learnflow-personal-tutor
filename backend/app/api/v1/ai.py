from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/ai", tags=["ai"])

_AI_ON_NEXTJS = (
    "AI runs on the Next.js app, not this FastAPI route. "
    "Use /api/ai/chat, /api/ai/quiz, or /api/ai/summarize and set "
    "OPENROUTER_API_KEY in .env.local."
)


@router.post("/chat")
def chat() -> None:
    raise HTTPException(status_code=501, detail=_AI_ON_NEXTJS)


@router.post("/quiz")
def generate_quiz() -> None:
    raise HTTPException(status_code=501, detail=_AI_ON_NEXTJS)


@router.post("/summarize")
def summarize() -> None:
    raise HTTPException(status_code=501, detail=_AI_ON_NEXTJS)
