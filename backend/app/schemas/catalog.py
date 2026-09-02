import uuid
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon_name: Optional[str] = None
    is_active: bool = True


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    sku: str
    name: str
    description: str
    category: str
    price: Decimal
    cost_price: Decimal
    stock_quantity: int
    image_url: str
    tags: List[str] = []
    is_active: bool = True
    metadata_json: dict = {}


class ProductCreate(ProductBase):
    merchant_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None


class ProductResponse(ProductBase):
    id: uuid.UUID
    merchant_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    model_config = ConfigDict(from_attributes=True)
