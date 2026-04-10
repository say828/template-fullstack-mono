from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.dependencies import AuthContext, get_current_user
from contexts.identity.infrastructure.repository import SqlAlchemyUserRepository
from contexts.trades.infrastructure.repository import SqlAlchemyTradeWorkflowRepository
from contexts.vehicles.application.services import VehicleService
from contexts.vehicles.infrastructure.repository import SqlAlchemyVehicleRepository
from contexts.vehicles.infrastructure.photo_storage import build_vehicle_photo_urls
from contexts.vehicles.presentation.schemas import CreateVehicleRequest, UpdateVehicleRequest, VehicleResponse
from shared.domain.vehicle_lifecycle import lifecycle_from_snapshot
from shared.infrastructure.database import get_db_session
from shared.infrastructure.errors import AppError

router = APIRouter(tags=["vehicles"])


def to_vehicle_response(vehicle, *, workflow_stage=None) -> VehicleResponse:
    return VehicleResponse(
        id=str(vehicle.id),
        seller_id=str(vehicle.seller_id),
        title=vehicle.title,
        make=vehicle.make,
        model=vehicle.model,
        year=vehicle.year,
        mileage_km=vehicle.mileage_km,
        license_plate=vehicle.license_plate,
        fuel_type=vehicle.fuel_type,
        transmission=vehicle.transmission,
        transaction_type=vehicle.transaction_type,
        reserve_price=float(vehicle.reserve_price),
        min_bid_increment=float(vehicle.min_bid_increment),
        options=[option.label for option in vehicle.options],
        photo_names=[photo.original_name for photo in vehicle.photos],
        photo_urls=build_vehicle_photo_urls([photo.storage_key for photo in vehicle.photos]),
        currency=vehicle.currency,
        status=vehicle.status,
        lifecycle_state=lifecycle_from_snapshot(
            vehicle_status=vehicle.status,
            bidding_ends_at=vehicle.bidding_ends_at,
            workflow_stage=workflow_stage,
            has_winning_dealer=vehicle.winning_dealer_id is not None,
        ),
        bidding_ends_at=vehicle.bidding_ends_at,
        winning_dealer_id=str(vehicle.winning_dealer_id) if vehicle.winning_dealer_id else None,
        winning_price=float(vehicle.winning_price) if vehicle.winning_price is not None else None,
        created_at=vehicle.created_at,
    )


@router.post("/vehicles", response_model=VehicleResponse)
def create_vehicle(
    payload: CreateVehicleRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> VehicleResponse:
    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = VehicleService(SqlAlchemyVehicleRepository(db))
    vehicle = service.create_vehicle(
        actor=actor,
        title=payload.title,
        make=payload.make,
        model=payload.model,
        year=payload.year,
        mileage_km=payload.mileage_km,
        license_plate=payload.license_plate,
        fuel_type=payload.fuel_type,
        transmission=payload.transmission,
        transaction_type=payload.transaction_type,
        reserve_price=payload.reserve_price,
        min_bid_increment=payload.min_bid_increment,
        options=payload.options,
        photo_names=payload.photo_names,
        currency=payload.currency,
        bidding_hours=payload.bidding_hours,
        bidding_start_at=payload.bidding_start_at,
        bidding_end_at=payload.bidding_end_at,
    )
    return to_vehicle_response(vehicle)


@router.get("/vehicles/my", response_model=list[VehicleResponse])
def list_my_vehicles(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[VehicleResponse]:
    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = VehicleService(SqlAlchemyVehicleRepository(db))
    trade_repo = SqlAlchemyTradeWorkflowRepository(db)
    rows = service.list_my_vehicles(actor)
    responses: list[VehicleResponse] = []
    for vehicle in rows:
        workflow = trade_repo.get_workflow_by_vehicle(vehicle.id)
        responses.append(to_vehicle_response(vehicle, workflow_stage=workflow.current_stage if workflow else None))
    return responses


@router.patch("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: str,
    payload: UpdateVehicleRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> VehicleResponse:
    user_repo = SqlAlchemyUserRepository(db)
    actor = user_repo.get_user_by_id(auth.user_id)
    if not actor:
        raise AppError("사용자를 찾을 수 없습니다.", 404, "USER_NOT_FOUND")

    service = VehicleService(SqlAlchemyVehicleRepository(db))
    vehicle = service.update_vehicle(
        actor=actor,
        vehicle_id=UUID(vehicle_id),
        title=payload.title,
        make=payload.make,
        model=payload.model,
        year=payload.year,
        mileage_km=payload.mileage_km,
        license_plate=payload.license_plate,
        fuel_type=payload.fuel_type,
        transmission=payload.transmission,
        transaction_type=payload.transaction_type,
        reserve_price=payload.reserve_price,
        min_bid_increment=payload.min_bid_increment,
        currency=payload.currency,
        options=payload.options,
    )
    return to_vehicle_response(vehicle)
