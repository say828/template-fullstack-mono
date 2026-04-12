from fastapi import APIRouter


api_router = APIRouter()


@api_router.get("/system/info")
def system_info() -> dict[str, str]:
    return {
        "service": "template-fullstack-mono",
        "status": "ready",
    }
