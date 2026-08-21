from pydantic import BaseModel

class MenuCategoryCreate(BaseModel):
    category_name : str

class MenuCategoryUpdate(BaseModel):
    category_name : str

class MenuCategoryResponse(BaseModel):
    category_id : int
    shop_id : int
    category_name : str