from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    pass


engine_kwargs: dict[str, object] = {"pool_pre_ping": True}
if settings.database_url.startswith("mysql"):
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from contexts.admin.infrastructure import models as _admin_models
    from contexts.bidding.infrastructure import models as _bidding_models
    from contexts.dealers.infrastructure import models as _dealer_models
    from contexts.identity.infrastructure import models as _identity_models
    from contexts.settings.infrastructure import models as _settings_models
    from contexts.settlement.infrastructure import models as _settlement_models
    from contexts.support.infrastructure import models as _support_models
    from contexts.trades.infrastructure import models as _trade_models
    from contexts.vehicles.infrastructure import models as _vehicle_models

    _ = (
        _admin_models,
        _identity_models,
        _dealer_models,
        _vehicle_models,
        _bidding_models,
        _support_models,
        _settings_models,
        _settlement_models,
        _trade_models,
    )
    Base.metadata.create_all(bind=engine)
    _ensure_vehicle_transmission_column()
    _ensure_vehicle_photo_columns()


def _ensure_vehicle_transmission_column() -> None:
    inspector = inspect(engine)
    if "vehicles" not in inspector.get_table_names():
        return
    column_names = {column["name"] for column in inspector.get_columns("vehicles")}
    if "transmission" in column_names:
        return
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE vehicles ADD COLUMN transmission VARCHAR(12) NULL"))


def _ensure_vehicle_photo_columns() -> None:
    inspector = inspect(engine)
    if "vehicle_photos" not in inspector.get_table_names():
        return

    column_names = {column["name"] for column in inspector.get_columns("vehicle_photos")}
    with engine.begin() as connection:
        if "storage_key" not in column_names:
            connection.execute(text("ALTER TABLE vehicle_photos ADD COLUMN storage_key VARCHAR(512) NULL"))
        if "content_type" not in column_names:
            connection.execute(text("ALTER TABLE vehicle_photos ADD COLUMN content_type VARCHAR(120) NULL"))
        if "size_bytes" not in column_names:
            connection.execute(text("ALTER TABLE vehicle_photos ADD COLUMN size_bytes INTEGER NULL"))
