from pydantic import BaseModel

class ShopSearchResult(BaseModel):
    shop_id:int
    shop_name:str

class MenuItemSearchResult(BaseModel):
    item_id:int
    item_name:str
    shop_id:int
    shop_name:str

class SearchResponse(BaseModel):
    shops:list[ShopSearchResult]
    items:list[MenuItemSearchResult]

