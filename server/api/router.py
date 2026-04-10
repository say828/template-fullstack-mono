from fastapi import APIRouter

from contexts.admin.presentation.router import router as admin_router
from contexts.bidding.presentation.router import router as bidding_router
from contexts.dealers.presentation.router import router as dealer_router
from contexts.identity.presentation.router import router as auth_router
from contexts.settings.presentation.router import router as settings_router
from contexts.settlement.presentation.router import router as settlement_router
from contexts.support.presentation.router import router as support_router
from contexts.trades.presentation.router import router as trade_router
from contexts.vehicles.presentation.router import router as vehicle_router

api_router = APIRouter()
api_router.include_router(admin_router)
api_router.include_router(auth_router)
api_router.include_router(dealer_router)
api_router.include_router(vehicle_router)
api_router.include_router(bidding_router)
api_router.include_router(settings_router)
api_router.include_router(support_router)
api_router.include_router(settlement_router)
api_router.include_router(trade_router)
