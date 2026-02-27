from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.group import router as group_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(group_router)


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
