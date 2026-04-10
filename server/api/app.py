from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from contexts.identity.bootstrap import ensure_identity_bootstrap_data
from contexts.support.bootstrap import ensure_support_seed_data
from contexts.vehicles.bootstrap import ensure_local_demo_vehicle_data
from shared.infrastructure.database import SessionLocal, init_db
from shared.infrastructure.errors import AppError
from api.router import api_router


settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        init_db()
        db = SessionLocal()
        try:
            ensure_identity_bootstrap_data(db)
            ensure_support_seed_data(db)
            ensure_local_demo_vehicle_data(db)
        finally:
            db.close()

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "message": exc.message})

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(status_code=422, content={"code": "VALIDATION_ERROR", "message": str(exc)})

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    app.include_router(api_router, prefix=settings.api_prefix)
    return app

app = create_app()
