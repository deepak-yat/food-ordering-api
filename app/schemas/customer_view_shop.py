from pydantic import BaseModel

class CustomerShopResponse(BaseModel):
    shop_id : int 
    shop_name : str
    description : str | None
    is_active : bool
    