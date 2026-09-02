import uuid
from decimal import Decimal
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models import Category, Merchant, Product

router = APIRouter()


@router.get(
    "/categories",
    summary="Get Active Product Categories",
    description="Returns all active product categories with their product count."
)
async def get_categories(
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Query categories with product counts
    query = (
        select(Category, func.count(Product.id).label("product_count"))
        .outerjoin(Product, (Product.category_id == Category.id) & (Product.is_active == True))
        .where(Category.is_active == True)
        .group_by(Category.id)
        .order_by(Category.name.asc())
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "description": cat.description,
            "icon_name": cat.icon_name,
            "product_count": count,
        }
        for cat, count in rows
    ]


@router.get(
    "/products",
    summary="Get Active Products with Filters",
    description="Returns paginated/filtered list of active products for customer storefront."
)
async def get_products(
    category: Optional[str] = Query(None, description="Filter by Category string name"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by Category UUID"),
    category_slug: Optional[str] = Query(None, description="Filter by Category URL slug"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price filter"),
    search: Optional[str] = Query(None, description="Full-text product search term"),
    in_stock_only: bool = Query(True, description="Filter only in-stock products"),
    sort_by: str = Query("featured", description="Sorting: price_asc, price_desc, newest, featured"),
    limit: Optional[int] = Query(100, ge=1, le=200, description="Maximum products to return"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    query = select(Product).options(selectinload(Product.category_rel)).where(Product.is_active == True)

    if category and category.upper() != "ALL":
        query = query.where(func.lower(Product.category) == category.strip().lower())

    if category_id:
        query = query.where(Product.category_id == category_id)

    if category_slug:
        query = query.join(Product.category_rel).where(Category.slug == category_slug)

    if min_price is not None:
        query = query.where(Product.price >= min_price)

    if max_price is not None:
        query = query.where(Product.price <= max_price)

    if in_stock_only:
        query = query.where(Product.stock_quantity > 0)

    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.where(
            func.lower(Product.name).like(search_pattern) | func.lower(Product.description).like(search_pattern)
        )

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.price.desc())

    if limit:
        query = query.limit(limit)

    result = await db.execute(query)
    products = result.scalars().all()

    return [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "description": p.description,
            "category": p.category or (p.category_rel.name if p.category_rel else "General"),
            "category_slug": (p.category_rel.slug if p.category_rel else p.category.lower().replace(" ", "-").replace("&", "and")) if p.category else "general",
            "price": p.price,
            "cost_price": p.cost_price,
            "stock_quantity": p.stock_quantity,
            "image_url": p.image_url,
            "tags": p.tags,
            "metadata_json": p.metadata_json,
        }
        for p in products
    ]


@router.get(
    "/products/{product_id}",
    summary="Get Product Detail and Related Recommendations",
    description="Returns single product detail and complementary items in the same category."
)
async def get_product_detail(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.is_active == True)
        .options(selectinload(Product.category_rel))
    )
    product = res.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    # Fetch complementary / related items
    related_res = await db.execute(
        select(Product)
        .where(Product.id != product.id, Product.is_active == True, Product.stock_quantity > 0)
        .order_by(Product.price.asc())
        .limit(4)
    )
    related_products = related_res.scalars().all()

    return {
        "id": product.id,
        "sku": product.sku,
        "name": product.name,
        "description": product.description,
        "category": product.category or (product.category_rel.name if product.category_rel else "General"),
        "category_slug": (product.category_rel.slug if product.category_rel else product.category.lower().replace(" ", "-").replace("&", "and")) if product.category else "general",
        "price": product.price,
        "cost_price": product.cost_price,
        "stock_quantity": product.stock_quantity,
        "image_url": product.image_url,
        "tags": product.tags,
        "metadata_json": product.metadata_json,
        "related_products": [
            {
                "id": r.id,
                "sku": r.sku,
                "name": r.name,
                "price": r.price,
                "image_url": r.image_url,
            }
            for r in related_products
        ],
    }
