from fastapi import FastAPI, Request , Depends
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.shop import router as shop_router
from app.routers.customer_view_shop import router as customer_shop_router
from app.routers.menu_category import router as menu_category_router
from app.routers.menu_item import router as menu_item_router
from app.routers.customer_cart import router as customer_cart_router
from app.routers.customer_order import router as customer_order_router
from app.routers.shop_orders import router as shop_orders_router
from app.routers.customer import router as customer_router
from app.dependencies import require_page_role,UserRole
from app.models.user import User
from app.routers.shop_overview import router as shop_overview_router
from app.routers.customer_search import router as customer_search_router
app = FastAPI(
    title="Food Ordering API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)

templates = Jinja2Templates(
    directory="app/templates"
)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="home.html",
        context={
            "request": request
        }
    )
app.include_router(shop_overview_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(shop_router)
app.include_router(customer_shop_router)
app.include_router(menu_category_router)
app.include_router(menu_item_router)
app.include_router(customer_cart_router)
app.include_router(customer_order_router)
app.include_router(shop_orders_router)
app.include_router(customer_router)
app.include_router(customer_search_router)
@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={
            "request": request
        }
    )
@app.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={
            "request": request
        }
    )

@app.get("/register/shop", response_class=HTMLResponse)
def shop_register_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="shop_register.html",
        context={
            "request": request
        }
    )

@app.get(
    "/customer/dashboard",
    response_class=HTMLResponse
)
def customer_dashboard(
    request: Request,
    current_user: User = Depends(
        require_page_role(UserRole.CUSTOMER)
    )
):
    return templates.TemplateResponse(
        request=request,
        name="customer_dashboard.html",
        context={
            "request": request,
            "user": current_user
        }
    )


@app.get(
    "/shop/dashboard",
    response_class=HTMLResponse
)
def shop_dashboard(
    request: Request,
    current_user: User = Depends(
        require_page_role(UserRole.SHOP_OWNER)
    )
):
    return templates.TemplateResponse(
        request=request,
        name="shop_dashboard.html",
        context={
            "request": request,
            "user": current_user
        }
    )