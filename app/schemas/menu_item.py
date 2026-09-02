from pydantic import BaseModel

class MenuItemCreate(BaseModel):
    category_id: int
    name:str
    description : str | None = None
    price : float
    is_available : bool = True

class MenuItemUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = None
    description: str | None = None
    price: float | None = None
    is_available: bool | None = None

class MenuItemResponse(BaseModel):
    item_id : int
    shop_id : int
    category_id : int
    name : str
    description : str
    price : float
    is_available : bool 
