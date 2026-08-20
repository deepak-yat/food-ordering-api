from fastapi import APIRouter, Depends

from app.dependencies import get_current_shop
from app.models.shop import Shop


router = APIRouter(
    prefix="/shops",
    tags=["Shops"]
)


@router.get("/my-shop")
def get_my_shop(
    current_shop: Shop = Depends(get_current_shop)
):
    return current_shop