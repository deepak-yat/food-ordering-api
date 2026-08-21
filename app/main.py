from fastapi import FastAPI

from app.routers.auth import router as auth_router

from app.routers.shop import router as shop_router

from app.routers.admin import router as admin_router

from app.routers.menu_category import router as menu_category_router

app = FastAPI(
    title="Food Ordering API",
    version="1.0.0"
)

app.include_router(menu_category_router)
app.include_router(admin_router)
app.include_router(shop_router)
app.include_router(auth_router)