from pydantic import BaseModel

class MenuCategoryCreate(BaseModel):
    category_name : str

class UpdateMenuCategory(BaseModel):
    category_name: str

class MenuCategoryResponse(BaseModel):
    category_id : int
    shop_id : int
    category_name : str