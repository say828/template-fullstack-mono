from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import mimetypes
from pathlib import Path
from typing import Iterable

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from config import get_settings
from contexts.bidding.domain.enums import BidStatus
from contexts.bidding.infrastructure.models import BidORM
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from contexts.trades.domain.enums import DeliveryStatus, DepreciationStatus, InspectionStatus, RemittanceStatus, SettlementStatus, TradeStage
from contexts.trades.infrastructure.models import TradeDepreciationItemORM, TradeEventORM, TradeWorkflowORM
from contexts.vehicles.domain.enums import FuelType, TransactionType, TransmissionType, VehicleStatus
from contexts.vehicles.application.services import normalize_vehicle_options
from contexts.vehicles.infrastructure.models import VehicleORM, VehicleOptionORM, VehiclePhotoORM
from contexts.vehicles.infrastructure.photo_storage import build_vehicle_photo_key, get_vehicle_photo_storage


settings = get_settings()


@dataclass(frozen=True)
class DemoBidSeed:
    dealer_email: str
    amount: float
    status: BidStatus = BidStatus.ACTIVE


@dataclass(frozen=True)
class DemoWorkflowSeed:
    current_stage: TradeStage
    inspection_status: InspectionStatus
    depreciation_status: DepreciationStatus
    delivery_status: DeliveryStatus
    remittance_status: RemittanceStatus
    settlement_status: SettlementStatus
    base_price: float
    agreed_price: float | None = None
    depreciation_total: float | None = None
    inspection_scheduled_at: datetime | None = None
    inspection_location: str | None = None
    inspection_assignee: str | None = None
    inspection_contact: str | None = None
    inspection_confirmed_at: datetime | None = None
    inspection_completed_at: datetime | None = None
    inspection_report_url: str | None = None
    inspection_summary: str | None = None
    depreciation_submitted_at: datetime | None = None
    depreciation_comment: str | None = None
    depreciation_agreed_at: datetime | None = None
    delivery_scheduled_at: datetime | None = None
    delivery_method: str | None = None
    delivery_location: str | None = None
    delivery_confirmed_by_seller_at: datetime | None = None
    delivery_confirmed_by_dealer_at: datetime | None = None
    delivery_completed_at: datetime | None = None
    remittance_amount: float | None = None
    remittance_bank_account: str | None = None
    remittance_reference: str | None = None
    remittance_submitted_at: datetime | None = None
    remittance_confirmed_at: datetime | None = None
    settlement_amount: float | None = None
    settlement_completed_at: datetime | None = None
    forced_cancel_reason: str | None = None
    forced_cancelled_at: datetime | None = None
    depreciation_items: tuple[tuple[str, str, float, str | None], ...] = ()
    events: tuple[tuple[str, str, dict | None], ...] = ()


@dataclass(frozen=True)
class DemoVehicleSeed:
    license_plate: str
    title: str
    make: str
    model: str
    year: int
    mileage_km: int
    fuel_type: FuelType
    transmission: TransmissionType
    transaction_type: TransactionType
    reserve_price: float
    min_bid_increment: float
    currency: str
    status: VehicleStatus
    bidding_started_at: datetime
    bidding_ends_at: datetime
    created_at: datetime
    options: tuple[str, ...] = ()
    photo_names: tuple[str, ...] = ()
    bids: tuple[DemoBidSeed, ...] = ()
    workflow: DemoWorkflowSeed | None = None


def _repo_root_and_seed_dir() -> tuple[Path, Path]:
    markers = (
        Path("server/data/seed_vehicle_photos/front.png"),
        Path("data/seed_vehicle_photos/front.png"),
    )
    for candidate in Path(__file__).resolve().parents:
        for marker in markers:
            if (candidate / marker).is_file():
                return candidate, marker.parent
    raise FileNotFoundError(markers[0])


REPO_ROOT, SEED_PHOTO_DIR = _repo_root_and_seed_dir()
PHOTO_SOURCE_PATHS = (
    REPO_ROOT / SEED_PHOTO_DIR / "front.png",
    REPO_ROOT / SEED_PHOTO_DIR / "rear.png",
    REPO_ROOT / SEED_PHOTO_DIR / "side.png",
    REPO_ROOT / SEED_PHOTO_DIR / "interior.png",
    REPO_ROOT / SEED_PHOTO_DIR / "detail.png",
)


def _seed_photo_source(index: int) -> Path:
    source = PHOTO_SOURCE_PATHS[index % len(PHOTO_SOURCE_PATHS)]
    if not source.is_file():
        raise FileNotFoundError(source)
    return source


def _sync_vehicle_photos(vehicle: VehicleORM, photo_names: Iterable[str]) -> bool:
    desired_labels = [name.strip() for name in photo_names if name.strip()]
    desired_keys = [
        build_vehicle_photo_key(vehicle_id=vehicle.id, filename=_seed_photo_source(index).name, sort_order=index)
        for index, _label in enumerate(desired_labels)
    ]
    current_specs = [(photo.original_name, photo.storage_key) for photo in vehicle.photos]
    desired_specs = [(label, key) for label, key in zip(desired_labels, desired_keys, strict=False)]
    if current_specs == desired_specs:
        return False

    storage = get_vehicle_photo_storage()
    next_photos: list[VehiclePhotoORM] = []
    for index, label in enumerate(desired_labels):
        source_path = _seed_photo_source(index)
        content = source_path.read_bytes()
        content_type = mimetypes.guess_type(source_path.name)[0]
        stored = storage.put_object(
            vehicle_id=vehicle.id,
            original_name=label,
            filename=source_path.name,
            content=content,
            sort_order=index,
            content_type=content_type,
        )
        next_photos.append(
            VehiclePhotoORM(
                original_name=stored.original_name,
                storage_key=stored.storage_key,
                content_type=stored.content_type,
                size_bytes=stored.size_bytes,
                sort_order=index,
            )
        )

    vehicle.photos = next_photos
    return True


def _demo_seeds(now: datetime) -> tuple[DemoVehicleSeed, ...]:
    def ts(*, days: int = 0, hours: int = 0) -> datetime:
        return now - timedelta(days=days, hours=hours)

    return (
        DemoVehicleSeed(
            license_plate="11가 1301",
            title="그랜저 IG 2.5 캘리그래피",
            make="현대",
            model="그랜저 IG",
            year=2021,
            mileage_km=41200,
            fuel_type=FuelType.GASOLINE,
            transmission=TransmissionType.AUTO,
            transaction_type=TransactionType.DOMESTIC,
            reserve_price=28500000,
            min_bid_increment=100000,
            currency="KRW",
            status=VehicleStatus.ACTIVE,
            bidding_started_at=ts(days=1, hours=2),
            bidding_ends_at=ts(hours=-42),
            created_at=ts(days=1, hours=3),
                options=("선루프", "내비게이션", "후방카메라", "가죽시트"),
                photo_names=("전면", "후면", "좌측", "실내"),
            bids=(
                DemoBidSeed("dl1@template.com", 29100000),
                DemoBidSeed("dl2@template.com", 28700000),
            ),
        ),
        DemoVehicleSeed(
            license_plate="11가 1302",
            title="K5 2.0 노블레스",
            make="기아",
            model="K5",
            year=2020,
            mileage_km=53800,
            fuel_type=FuelType.GASOLINE,
            transmission=TransmissionType.AUTO,
            transaction_type=TransactionType.EXPORT,
            reserve_price=24800000,
            min_bid_increment=100000,
            currency="KRW",
            status=VehicleStatus.ACTIVE,
            bidding_started_at=ts(days=2, hours=3),
            bidding_ends_at=ts(days=1, hours=4),
            created_at=ts(days=4, hours=3),
                options=("어댑티브 크루즈", "HUD(헤드업 디스플레이)", "파노라마 선루프"),
                photo_names=("전면", "후면", "좌측", "우측"),
            bids=(
                DemoBidSeed("dl1@template.com", 21800000, BidStatus.ACTIVE),
                DemoBidSeed("dl2@template.com", 22200000, BidStatus.ACTIVE),
            ),
        ),
        DemoVehicleSeed(
            license_plate="11가 1303",
            title="쏘나타 DN8 2.0 프리미엄",
            make="현대",
            model="쏘나타 DN8",
            year=2021,
            mileage_km=37100,
            fuel_type=FuelType.GASOLINE,
            transmission=TransmissionType.AUTO,
            transaction_type=TransactionType.DOMESTIC,
            reserve_price=25900000,
            min_bid_increment=100000,
            currency="KRW",
            status=VehicleStatus.SOLD,
            bidding_started_at=ts(days=3, hours=4),
            bidding_ends_at=ts(days=2, hours=4),
            created_at=ts(days=3, hours=3),
                options=("블루투스", "스마트크루즈", "후방카메라", "열선시트(앞좌석)"),
                photo_names=("전면", "후면", "실내", "계기판", "타이어", "측면"),
            bids=(
                DemoBidSeed("dl1@template.com", 27000000, BidStatus.WON),
                DemoBidSeed("dl2@template.com", 26600000, BidStatus.LOST),
            ),
            workflow=DemoWorkflowSeed(
                current_stage=TradeStage.INSPECTION,
                inspection_status=InspectionStatus.CONFIRMED,
                depreciation_status=DepreciationStatus.PROPOSAL_REQUIRED,
                delivery_status=DeliveryStatus.WAITING_SCHEDULE,
                remittance_status=RemittanceStatus.WAITING,
                settlement_status=SettlementStatus.WAITING,
                base_price=27000000,
                inspection_scheduled_at=ts(hours=-18),
                inspection_location="Template 성수 검차센터",
                inspection_assignee="DEV 평가사",
                inspection_contact="02-0000-0000",
                inspection_confirmed_at=ts(hours=-16),
                events=(
                    ("LOCAL_DATA_READY", "검차 일정 확인용 운영 데이터가 생성되었습니다.", {"screen": "FRT_020"}),
                ),
            ),
        ),
        DemoVehicleSeed(
            license_plate="11가 1304",
            title="BMW 520d M Sport",
            make="BMW",
            model="520d",
            year=2019,
            mileage_km=82300,
            fuel_type=FuelType.DIESEL,
            transmission=TransmissionType.AUTO,
            transaction_type=TransactionType.EXPORT,
            reserve_price=31000000,
            min_bid_increment=100000,
            currency="KRW",
            status=VehicleStatus.SOLD,
            bidding_started_at=ts(days=4, hours=4),
            bidding_ends_at=ts(days=3, hours=5),
            created_at=ts(days=2, hours=3),
                options=("전동트렁크", "통풍시트(앞좌석)", "블랙박스"),
                photo_names=("전면", "후면", "실내", "엔진룸"),
            bids=(
                DemoBidSeed("dl1@template.com", 32400000, BidStatus.WON),
                DemoBidSeed("dl2@template.com", 31900000, BidStatus.LOST),
            ),
            workflow=DemoWorkflowSeed(
                current_stage=TradeStage.DEPRECIATION,
                inspection_status=InspectionStatus.COMPLETED,
                depreciation_status=DepreciationStatus.SELLER_REVIEW,
                delivery_status=DeliveryStatus.WAITING_SCHEDULE,
                remittance_status=RemittanceStatus.WAITING,
                settlement_status=SettlementStatus.WAITING,
                base_price=32400000,
                depreciation_total=410000,
                inspection_completed_at=ts(days=3, hours=8),
                inspection_report_url="https://example.invalid/reports/11ga-1304.pdf",
                inspection_summary="외판 경미한 스크래치와 타이어 마모 확인",
                depreciation_submitted_at=ts(days=3, hours=6),
                depreciation_comment="기본 감가 제안",
                depreciation_items=(
                    ("DEPR_TIRE", "타이어 마모", 120000, "잔여 트레드 낮음"),
                    ("DEPR_EXTERIOR", "외판 손상", 180000, "도어/범퍼 스크래치"),
                    ("DEPR_INTERIOR", "실내 오염", 110000, "시트 클리닝 필요"),
                ),
                events=(
                    ("LOCAL_DATA_READY", "감가 협의 확인용 운영 데이터가 생성되었습니다.", {"screen": "FRT_025"}),
                ),
            ),
        ),
        DemoVehicleSeed(
            license_plate="11가 1305",
            title="카니발 KA4 9인승 노블레스",
            make="기아",
            model="카니발 KA4",
            year=2022,
            mileage_km=26400,
            fuel_type=FuelType.DIESEL,
            transmission=TransmissionType.AUTO,
            transaction_type=TransactionType.DOMESTIC,
            reserve_price=36800000,
            min_bid_increment=100000,
            currency="KRW",
            status=VehicleStatus.SOLD,
            bidding_started_at=ts(days=4, hours=2),
            bidding_ends_at=ts(days=3, hours=2),
            created_at=ts(days=4, hours=4),
                options=("내비게이션", "어라운드 뷰", "후방카메라", "스마트 파워 슬라이딩 도어"),
                photo_names=("전면", "후면", "좌측", "우측", "실내"),
            bids=(
                DemoBidSeed("dl1@template.com", 37700000, BidStatus.WON),
                DemoBidSeed("dl2@template.com", 37300000, BidStatus.LOST),
            ),
            workflow=DemoWorkflowSeed(
                current_stage=TradeStage.INSPECTION,
                inspection_status=InspectionStatus.PROPOSED,
                depreciation_status=DepreciationStatus.PROPOSAL_REQUIRED,
                delivery_status=DeliveryStatus.WAITING_SCHEDULE,
                remittance_status=RemittanceStatus.WAITING,
                settlement_status=SettlementStatus.WAITING,
                base_price=37700000,
                inspection_scheduled_at=ts(hours=-22),
                inspection_location="Template 강서 검차센터",
                inspection_assignee="LOCAL 평가사",
                inspection_contact="02-1111-2222",
                events=(
                    ("LOCAL_DATA_READY", "검차 일정 제안 확인용 운영 데이터가 생성되었습니다.", {"screen": "FRT_019"}),
                ),
            ),
        ),
        DemoVehicleSeed(
            license_plate="11가 1307",
            title="아반떼 CN7 1.6 인스퍼레이션",
            make="현대",
            model="아반떼 CN7",
            year=2021,
            mileage_km=28900,
            fuel_type=FuelType.GASOLINE,
            transmission=TransmissionType.AUTO,
            transaction_type=TransactionType.DOMESTIC,
            reserve_price=21700000,
            min_bid_increment=100000,
            currency="KRW",
            status=VehicleStatus.SOLD,
            bidding_started_at=ts(days=7, hours=4),
            bidding_ends_at=ts(days=6, hours=5),
            created_at=ts(days=5, hours=3),
                options=("내비게이션", "후방카메라", "하이패스"),
                photo_names=("전면", "후면", "좌측", "실내"),
            bids=(
                DemoBidSeed("dl1@template.com", 22450000, BidStatus.WON),
                DemoBidSeed("dl2@template.com", 22100000, BidStatus.LOST),
            ),
            workflow=DemoWorkflowSeed(
                current_stage=TradeStage.SETTLEMENT,
                inspection_status=InspectionStatus.COMPLETED,
                depreciation_status=DepreciationStatus.AGREED,
                delivery_status=DeliveryStatus.COMPLETED,
                remittance_status=RemittanceStatus.CONFIRMED,
                settlement_status=SettlementStatus.WAITING,
                base_price=22450000,
                agreed_price=22150000,
                depreciation_total=300000,
                inspection_completed_at=ts(days=6, hours=8),
                inspection_report_url="https://example.invalid/reports/11ga-1307.pdf",
                inspection_summary="검차 및 감가 협의 완료, 인도 이후 정산 대기 중",
                depreciation_submitted_at=ts(days=6, hours=6),
                depreciation_comment="감가 협의 완료",
                depreciation_agreed_at=ts(days=5, hours=20),
                delivery_scheduled_at=ts(days=5, hours=16),
                delivery_method="탁송",
                delivery_location="서울 강서 출고장",
                delivery_confirmed_by_seller_at=ts(days=5, hours=14),
                delivery_confirmed_by_dealer_at=ts(days=5, hours=12),
                delivery_completed_at=ts(days=5, hours=10),
                remittance_amount=22150000,
                remittance_bank_account="우리은행 111-22-333444",
                remittance_reference="Template-REM-1307",
                remittance_submitted_at=ts(days=5, hours=8),
                remittance_confirmed_at=ts(days=5, hours=6),
                events=(
                    ("LOCAL_DATA_READY", "정산 확인용 운영 데이터가 생성되었습니다.", {"screen": "FRT_030"}),
                ),
            ),
        ),
        DemoVehicleSeed(
            license_plate="11가 1308",
            title="제네시스 G80 2.5T AWD",
            make="제네시스",
            model="G80",
            year=2022,
            mileage_km=19700,
            fuel_type=FuelType.GASOLINE,
            transmission=TransmissionType.AUTO,
            transaction_type=TransactionType.DOMESTIC,
            reserve_price=52000000,
            min_bid_increment=100000,
            currency="KRW",
            status=VehicleStatus.SOLD,
            bidding_started_at=ts(days=8, hours=4),
            bidding_ends_at=ts(days=7, hours=5),
            created_at=ts(days=6, hours=3),
                options=("어라운드 뷰", "메모리시트", "차선이탈경보"),
                photo_names=("전면", "후면", "좌측", "우측", "실내", "계기판"),
            bids=(
                DemoBidSeed("dl1@template.com", 54600000, BidStatus.WON),
                DemoBidSeed("dl2@template.com", 54100000, BidStatus.LOST),
            ),
            workflow=DemoWorkflowSeed(
                current_stage=TradeStage.COMPLETED,
                inspection_status=InspectionStatus.COMPLETED,
                depreciation_status=DepreciationStatus.AGREED,
                delivery_status=DeliveryStatus.COMPLETED,
                remittance_status=RemittanceStatus.CONFIRMED,
                settlement_status=SettlementStatus.COMPLETED,
                base_price=54600000,
                agreed_price=54200000,
                depreciation_total=400000,
                inspection_completed_at=ts(days=7, hours=8),
                inspection_report_url="https://example.invalid/reports/11ga-1308.pdf",
                inspection_summary="거래 완료, 전체 프로세스 종료",
                depreciation_submitted_at=ts(days=7, hours=6),
                depreciation_comment="감가 협의 완료",
                depreciation_agreed_at=ts(days=7, hours=2),
                delivery_scheduled_at=ts(days=6, hours=22),
                delivery_method="탁송",
                delivery_location="서울 송파 출고장",
                delivery_confirmed_by_seller_at=ts(days=6, hours=20),
                delivery_confirmed_by_dealer_at=ts(days=6, hours=18),
                delivery_completed_at=ts(days=6, hours=16),
                remittance_amount=54200000,
                remittance_bank_account="우리은행 555-66-777888",
                remittance_reference="Template-REM-1308",
                remittance_submitted_at=ts(days=6, hours=15),
                remittance_confirmed_at=ts(days=6, hours=14),
                settlement_amount=54200000,
                settlement_completed_at=ts(days=6, hours=2),
                events=(
                    ("LOCAL_DATA_READY", "거래 완료용 운영 데이터가 생성되었습니다.", {"screen": "FRT_031"}),
                ),
            ),
        ),
    )


def _normalize_plate(value: str) -> str:
    return value.strip().upper()


def _get_user_by_email(repo: SqlAlchemyUserRepository, email: str):
    return repo.get_user_by_email(email)


def _delete_vehicle_graph(db: Session, vehicle_id) -> None:
    workflow_ids = list(
        db.scalars(select(TradeWorkflowORM.id).where(TradeWorkflowORM.vehicle_id == vehicle_id))
    )
    if workflow_ids:
        db.execute(delete(TradeDepreciationItemORM).where(TradeDepreciationItemORM.workflow_id.in_(workflow_ids)))
        db.execute(delete(TradeEventORM).where(TradeEventORM.workflow_id.in_(workflow_ids)))
        db.execute(delete(TradeWorkflowORM).where(TradeWorkflowORM.id.in_(workflow_ids)))
    db.execute(delete(BidORM).where(BidORM.vehicle_id == vehicle_id))
    db.execute(delete(VehicleORM).where(VehicleORM.id == vehicle_id))
    db.flush()


def _replace_vehicle_bids(
    db: Session,
    vehicle_id,
    bids: Iterable[DemoBidSeed],
    dealer_by_email: dict[str, object],
    *,
    created_at: datetime,
) -> None:
    db.execute(delete(BidORM).where(BidORM.vehicle_id == vehicle_id))
    db.flush()
    for index, bid_seed in enumerate(bids):
        dealer = dealer_by_email.get(bid_seed.dealer_email)
        if dealer is None:
            raise RuntimeError(f"dealer bootstrap account missing: {bid_seed.dealer_email}")
        bid = BidORM(
            vehicle_id=vehicle_id,
            dealer_id=dealer.id,
            amount=bid_seed.amount,
            status=bid_seed.status,
            created_at=created_at + timedelta(minutes=index),
            updated_at=created_at + timedelta(minutes=index),
        )
        db.add(bid)
    db.flush()


def _replace_workflow(
    db: Session,
    vehicle_id,
    seller_id,
    dealer_id,
    seed: DemoWorkflowSeed,
    *,
    created_at: datetime,
) -> TradeWorkflowORM:
    existing = db.scalar(select(TradeWorkflowORM).where(TradeWorkflowORM.vehicle_id == vehicle_id))
    if existing is not None:
        db.execute(delete(TradeDepreciationItemORM).where(TradeDepreciationItemORM.workflow_id == existing.id))
        db.execute(delete(TradeEventORM).where(TradeEventORM.workflow_id == existing.id))
        db.execute(delete(TradeWorkflowORM).where(TradeWorkflowORM.id == existing.id))
        db.flush()

    workflow = TradeWorkflowORM(
        vehicle_id=vehicle_id,
        seller_id=seller_id,
        dealer_id=dealer_id,
        current_stage=seed.current_stage,
        inspection_status=seed.inspection_status,
        depreciation_status=seed.depreciation_status,
        delivery_status=seed.delivery_status,
        remittance_status=seed.remittance_status,
        settlement_status=seed.settlement_status,
        base_price=seed.base_price,
        agreed_price=seed.agreed_price,
        depreciation_total=seed.depreciation_total,
        inspection_scheduled_at=seed.inspection_scheduled_at,
        inspection_location=seed.inspection_location,
        inspection_assignee=seed.inspection_assignee,
        inspection_contact=seed.inspection_contact,
        inspection_confirmed_at=seed.inspection_confirmed_at,
        inspection_completed_at=seed.inspection_completed_at,
        inspection_report_url=seed.inspection_report_url,
        inspection_summary=seed.inspection_summary,
        depreciation_submitted_at=seed.depreciation_submitted_at,
        depreciation_comment=seed.depreciation_comment,
        depreciation_agreed_at=seed.depreciation_agreed_at,
        delivery_scheduled_at=seed.delivery_scheduled_at,
        delivery_method=seed.delivery_method,
        delivery_location=seed.delivery_location,
        delivery_confirmed_by_seller_at=seed.delivery_confirmed_by_seller_at,
        delivery_confirmed_by_dealer_at=seed.delivery_confirmed_by_dealer_at,
        delivery_completed_at=seed.delivery_completed_at,
        remittance_amount=seed.remittance_amount,
        remittance_bank_account=seed.remittance_bank_account,
        remittance_reference=seed.remittance_reference,
        remittance_submitted_at=seed.remittance_submitted_at,
        remittance_confirmed_at=seed.remittance_confirmed_at,
        settlement_amount=seed.settlement_amount,
        settlement_completed_at=seed.settlement_completed_at,
        forced_cancel_reason=seed.forced_cancel_reason,
        forced_cancelled_at=seed.forced_cancelled_at,
        created_at=created_at,
        updated_at=created_at,
    )
    db.add(workflow)
    db.flush()

    for index, item in enumerate(seed.depreciation_items):
        code, label, amount, note = item
        db.add(
            TradeDepreciationItemORM(
                workflow_id=workflow.id,
                code=code,
                label=label,
                amount=amount,
                note=note,
                created_at=created_at + timedelta(minutes=index),
                updated_at=created_at + timedelta(minutes=index),
            )
        )

    for index, event in enumerate(seed.events):
        event_type, message, payload = event
        db.add(
            TradeEventORM(
                workflow_id=workflow.id,
                actor_id=None,
                actor_role=None,
                event_type=event_type,
                message=message,
                payload_json=payload,
                created_at=created_at + timedelta(minutes=index),
            )
        )

    db.flush()
    return workflow


def ensure_local_demo_vehicle_data(db: Session) -> bool:
    if settings.environment == "production" or not settings.bootstrap_local_test_accounts:
        return False

    user_repo = SqlAlchemyUserRepository(db)
    seller = _get_user_by_email(user_repo, settings.bootstrap_local_seller_email)
    dealer1 = _get_user_by_email(user_repo, settings.bootstrap_local_dealer1_email)
    dealer2 = _get_user_by_email(user_repo, settings.bootstrap_local_dealer2_email)
    if seller is None or dealer1 is None or dealer2 is None:
        raise RuntimeError("local bootstrap accounts must exist before creating operational vehicle data")

    dealer_by_email = {
        settings.bootstrap_local_dealer1_email: dealer1,
        settings.bootstrap_local_dealer2_email: dealer2,
    }

    changed = False
    now = datetime.now(timezone.utc)
    desired_plates = {_normalize_plate(seed.license_plate) for seed in _demo_seeds(now)}
    for seed in _demo_seeds(now):
        vehicle = db.scalar(select(VehicleORM).where(VehicleORM.license_plate == seed.license_plate))
        created_at = seed.created_at

        if vehicle is None:
            vehicle = VehicleORM(
                seller_id=seller.id,
                title=seed.title,
                make=seed.make,
                model=seed.model,
                year=seed.year,
                mileage_km=seed.mileage_km,
                license_plate=seed.license_plate,
                fuel_type=seed.fuel_type,
                transmission=seed.transmission.value,
                transaction_type=seed.transaction_type,
                reserve_price=seed.reserve_price,
                min_bid_increment=seed.min_bid_increment,
                currency=seed.currency,
                status=seed.status,
                bidding_started_at=seed.bidding_started_at,
                bidding_ends_at=seed.bidding_ends_at,
                photos=[],
                winning_bid_id=None,
                winning_dealer_id=None,
                winning_price=None,
                sold_at=None,
                created_at=created_at,
                updated_at=created_at,
            )
            db.add(vehicle)
            db.flush()
            changed = True
        else:
            fields = {
                "seller_id": seller.id,
                "title": seed.title,
                "make": seed.make,
                "model": seed.model,
                "year": seed.year,
                "mileage_km": seed.mileage_km,
                "license_plate": seed.license_plate,
                "fuel_type": seed.fuel_type,
                "transmission": seed.transmission.value,
                "transaction_type": seed.transaction_type,
                "reserve_price": seed.reserve_price,
                "min_bid_increment": seed.min_bid_increment,
                "currency": seed.currency,
                "status": seed.status,
                "bidding_started_at": seed.bidding_started_at,
                "bidding_ends_at": seed.bidding_ends_at,
                "winning_bid_id": None,
                "winning_dealer_id": None,
                "winning_price": None,
                "sold_at": None,
                "created_at": created_at,
                "updated_at": created_at,
            }
            for attr, value in fields.items():
                if getattr(vehicle, attr) != value:
                    setattr(vehicle, attr, value)
                    changed = True
            db.flush()

        if _sync_vehicle_photos(vehicle, seed.photo_names):
            changed = True
            db.flush()

        desired_options = normalize_vehicle_options(list(seed.options))
        current_options = [option.label for option in vehicle.options]
        if current_options != desired_options:
            vehicle.options = [
                VehicleOptionORM(label=label, sort_order=index)
                for index, label in enumerate(desired_options)
            ]
            changed = True
            db.flush()

        if seed.status == VehicleStatus.ACTIVE:
            db.execute(delete(TradeDepreciationItemORM).where(TradeDepreciationItemORM.workflow_id.in_(
                select(TradeWorkflowORM.id).where(TradeWorkflowORM.vehicle_id == vehicle.id)
            )))
            db.execute(delete(TradeEventORM).where(TradeEventORM.workflow_id.in_(
                select(TradeWorkflowORM.id).where(TradeWorkflowORM.vehicle_id == vehicle.id)
            )))
            db.execute(delete(TradeWorkflowORM).where(TradeWorkflowORM.vehicle_id == vehicle.id))
            db.flush()
            _replace_vehicle_bids(db, vehicle.id, seed.bids, dealer_by_email, created_at=created_at)
            continue

        if seed.status == VehicleStatus.CANCELLED:
            db.execute(delete(TradeDepreciationItemORM).where(TradeDepreciationItemORM.workflow_id.in_(
                select(TradeWorkflowORM.id).where(TradeWorkflowORM.vehicle_id == vehicle.id)
            )))
            db.execute(delete(TradeEventORM).where(TradeEventORM.workflow_id.in_(
                select(TradeWorkflowORM.id).where(TradeWorkflowORM.vehicle_id == vehicle.id)
            )))
            db.execute(delete(TradeWorkflowORM).where(TradeWorkflowORM.vehicle_id == vehicle.id))
            db.flush()
            _replace_vehicle_bids(db, vehicle.id, seed.bids, dealer_by_email, created_at=created_at)
            vehicle.sold_at = seed.bidding_ends_at
            db.flush()
            continue

        _replace_vehicle_bids(db, vehicle.id, seed.bids, dealer_by_email, created_at=created_at)
        winning_bid = db.scalar(
            select(BidORM)
            .where(BidORM.vehicle_id == vehicle.id)
            .order_by(BidORM.amount.desc(), BidORM.created_at.asc())
        )
        if winning_bid is None:
            raise RuntimeError(f"demo sold vehicle has no bids: {seed.license_plate}")

        winning_bid.status = BidStatus.WON
        db.flush()
        for bid in db.scalars(select(BidORM).where(BidORM.vehicle_id == vehicle.id, BidORM.id != winning_bid.id)):
            bid.status = BidStatus.LOST
        db.flush()

        vehicle.winning_bid_id = winning_bid.id
        vehicle.winning_dealer_id = winning_bid.dealer_id
        vehicle.winning_price = winning_bid.amount
        if seed.workflow is None:
            vehicle.sold_at = seed.bidding_ends_at
            existing = db.scalar(select(TradeWorkflowORM.id).where(TradeWorkflowORM.vehicle_id == vehicle.id))
            if existing is not None:
                db.execute(delete(TradeDepreciationItemORM).where(TradeDepreciationItemORM.workflow_id == existing))
                db.execute(delete(TradeEventORM).where(TradeEventORM.workflow_id == existing))
                db.execute(delete(TradeWorkflowORM).where(TradeWorkflowORM.id == existing))
                db.flush()
                changed = True
            db.flush()
            continue
        vehicle.sold_at = (
            seed.workflow.settlement_completed_at
            or seed.workflow.delivery_completed_at
            or seed.workflow.remittance_confirmed_at
            or seed.workflow.inspection_completed_at
            or seed.bidding_ends_at
        )

        _replace_workflow(
            db,
            vehicle.id,
            seller.id,
            winning_bid.dealer_id,
            seed.workflow,
            created_at=created_at + timedelta(hours=1),
        )
        db.flush()

    for vehicle in db.scalars(select(VehicleORM).where(VehicleORM.seller_id == seller.id)):
        if _normalize_plate(vehicle.license_plate or "") in desired_plates:
            continue
        _delete_vehicle_graph(db, vehicle.id)
        changed = True

    db.commit()
    return changed
