import uuid
from decimal import Decimal
from typing import Any, Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.enums import CartStatus, ItemOrigin
from app.models import Cart, CartItem, Merchant, Product

router = APIRouter()


class AddCartItemRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(1, ge=1, le=20)
    added_via_ai: bool = False
    is_ai_recommended: bool = False
    growth_opportunity_id: Optional[uuid.UUID] = None
    session_id: Optional[str] = None
    cart_id: Optional[uuid.UUID] = None

    @property
    def is_ai_item(self) -> bool:
        return self.added_via_ai or self.is_ai_recommended


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., ge=0, le=20)


def sanitize_session_token(token: Optional[str]) -> Optional[str]:
    """Sanitizes session token, handling duplicate header joins like 'sess_1, sess_1'."""
    if not token:
        return None
    val = str(token).strip().strip('"').strip("'")
    if not val:
        return None
    if "," in val:
        val = val.split(",")[0].strip()
    return val if val else None


def extract_session_id(
    request: Request,
    cookie_session_id: Optional[str] = None,
    body_session_id: Optional[str] = None,
) -> str:
    """Extracts canonical session ID with priority: body > header > query > cookie > new UUID."""
    clean_body = sanitize_session_token(body_session_id)
    if clean_body:
        return clean_body

    header_sid = sanitize_session_token(
        request.headers.get("X-Session-ID") or request.headers.get("x-session-id")
    )
    if header_sid:
        return header_sid

    query_sid = sanitize_session_token(request.query_params.get("session_id"))
    if query_sid:
        return query_sid

    clean_cookie = sanitize_session_token(cookie_session_id)
    if clean_cookie:
        return clean_cookie

    clean_req_cookie = sanitize_session_token(request.cookies.get("revora_session_id"))
    if clean_req_cookie:
        return clean_req_cookie

    return f"sess_{uuid.uuid4().hex[:12]}_{int(uuid.uuid1().time)}"


def extract_cart_id(request: Request, explicit_id: Optional[uuid.UUID] = None) -> Optional[uuid.UUID]:
    """Extracts explicit cart UUID from argument, header, or query param."""
    if explicit_id:
        return explicit_id
    hdr = request.headers.get("X-Cart-ID") or request.headers.get("x-cart-id")
    if hdr:
        try:
            return uuid.UUID(sanitize_session_token(hdr))
        except (ValueError, TypeError):
            pass
    qry = request.query_params.get("cart_id")
    if qry:
        try:
            return uuid.UUID(sanitize_session_token(qry))
        except (ValueError, TypeError):
            pass
    return None


async def get_or_create_cart(
    session_id: str,
    response: Response,
    db: AsyncSession,
    explicit_cart_id: Optional[uuid.UUID] = None,
) -> Cart:
    """
    Resolves or creates the single authoritative active shopping cart for the customer session.
    Automatically deduplicates and consolidates active carts for the same session.
    """
    clean_sid = sanitize_session_token(session_id) or str(uuid.uuid4())

    response.set_cookie(
        key="revora_session_id",
        value=clean_sid,
        max_age=60 * 60 * 24 * 30,  # 30 days
        httponly=False,
        samesite="lax",
        path="/",
    )

    # 1. If explicit cart_id provided, check if it exists
    if explicit_cart_id:
        res_explicit = await db.execute(
            select(Cart)
            .where(Cart.id == explicit_cart_id, Cart.status == CartStatus.ACTIVE)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .execution_options(populate_existing=True)
        )
        existing_explicit = res_explicit.scalars().first()
        if existing_explicit:
            if existing_explicit.session_id != clean_sid:
                existing_explicit.session_id = clean_sid
                await db.commit()
            return existing_explicit

    # 2. Fetch default active merchant
    res_m = await db.execute(select(Merchant).where(Merchant.is_active == True))
    merchant = res_m.scalars().first()
    if not merchant:
        raise HTTPException(status_code=500, detail="No active merchant store configured.")

    # 3. Query all active carts for this session to guarantee deduplication
    res_c = await db.execute(
        select(Cart)
        .where(Cart.session_id == clean_sid, Cart.status == CartStatus.ACTIVE)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .execution_options(populate_existing=True)
        .order_by(Cart.updated_at.desc(), Cart.created_at.desc())
    )
    active_carts = res_c.scalars().all()

    if active_carts:
        # Choose primary cart: prefer one that already has items, else the most recent
        primary_cart = next((c for c in active_carts if len(c.items) > 0), active_carts[0])

        # Consolidate items from any secondary duplicate carts into the primary cart
        secondary_carts = [c for c in active_carts if c.id != primary_cart.id]
        if secondary_carts:
            for sec in secondary_carts:
                for it in sec.items:
                    # Move or merge into primary cart
                    existing = next((p_it for p_it in primary_cart.items if p_it.product_id == it.product_id), None)
                    if existing:
                        existing.quantity += it.quantity
                        await db.delete(it)
                    else:
                        it.cart_id = primary_cart.id
                sec.status = CartStatus.ABANDONED
            await db.commit()

            # Refresh primary cart
            res_refresh = await db.execute(
                select(Cart)
                .where(Cart.id == primary_cart.id)
                .options(selectinload(Cart.items).selectinload(CartItem.product))
                .execution_options(populate_existing=True)
            )
            primary_cart = res_refresh.scalars().first()

        return primary_cart

    # 4. No active cart exists, create a new one
    new_cart = Cart(
        session_id=clean_sid,
        status=CartStatus.ACTIVE,
        metadata_json={"merchant_id": str(merchant.id), "currency": merchant.currency},
    )
    db.add(new_cart)
    await db.commit()

    res_final = await db.execute(
        select(Cart)
        .where(Cart.id == new_cart.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .execution_options(populate_existing=True)
    )
    return res_final.scalars().first()


def format_cart_response(cart: Cart) -> dict:
    """Calculates authoritative Decimal totals and returns serialized cart structure."""
    subtotal = Decimal("0.00")
    discount_total = Decimal("0.00")
    baseline_revenue = Decimal("0.00")
    ai_incremental_revenue = Decimal("0.00")
    items_data = []

    for it in cart.items:
        if it.product:
            item_price = it.product.price
            item_paid = (item_price * it.quantity) - it.discount_amount
            if item_paid < Decimal("0.00"):
                item_paid = Decimal("0.00")

            subtotal += (item_price * it.quantity)
            discount_total += it.discount_amount

            is_ai = (it.origin in [ItemOrigin.AI_CROSS_SELL, ItemOrigin.AI_UPSELL, ItemOrigin.AI_RECOMMENDATION, ItemOrigin.AI_BUNDLE]) or it.metadata_json.get("added_via_ai", False)

            if is_ai:
                ai_incremental_revenue += item_paid
            else:
                baseline_revenue += item_paid

            items_data.append({
                "id": str(it.id),
                "product_id": str(it.product.id),
                "name": it.product.name,
                "sku": it.product.sku,
                "price": item_price,
                "quantity": it.quantity,
                "discount_applied": it.discount_amount,
                "paid_price": item_paid,
                "added_via_ai": is_ai,
                "image_url": it.product.image_url,
                "stock_quantity": it.product.stock_quantity,
                "origin": it.origin.value if hasattr(it.origin, "value") else str(it.origin),
            })

    total_amount = subtotal - discount_total
    if total_amount < Decimal("0.00"):
        total_amount = Decimal("0.00")

    currency = cart.metadata_json.get("currency", "INR") if cart.metadata_json else "INR"

    return {
        "id": str(cart.id),
        "cart_id": str(cart.id),
        "session_id": cart.session_id,
        "currency": currency,
        "items": items_data,
        "item_count": sum(it["quantity"] for it in items_data),
        "subtotal": subtotal,
        "discount_total": discount_total,
        "total_amount": total_amount,
        "baseline_revenue": baseline_revenue,
        "baseline_subtotal": baseline_revenue,
        "ai_incremental_revenue": ai_incremental_revenue,
        "ai_incremental_subtotal": ai_incremental_revenue,
        "is_ai_assisted": (ai_incremental_revenue > Decimal("0.00")),
    }


@router.get(
    "",
    summary="Get Active Customer Cart",
    description="Retrieves current active cart with authoritative backend pricing and attribution calculation."
)
async def get_cart(
    request: Request,
    response: Response,
    cart_id: Optional[uuid.UUID] = Query(None),
    revora_session_id: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    sid = extract_session_id(request, revora_session_id)
    cid = extract_cart_id(request, cart_id)
    cart = await get_or_create_cart(sid, response, db, explicit_cart_id=cid)
    return format_cart_response(cart)


@router.post(
    "/items",
    summary="Add Product to Cart",
    description="Adds an item to the active cart with stock verification and AI attribution tracking."
)
async def add_item_to_cart(
    req: AddCartItemRequest,
    request: Request,
    response: Response,
    revora_session_id: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    sid = extract_session_id(request, revora_session_id, req.session_id)
    cid = extract_cart_id(request, req.cart_id)
    cart = await get_or_create_cart(sid, response, db, explicit_cart_id=cid)
    cart_id = cart.id

    # Validate product and stock
    prod_res = await db.execute(select(Product).where(Product.id == req.product_id, Product.is_active == True))
    product = prod_res.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found or inactive.")

    if product.stock_quantity < req.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}.",
        )

    is_ai = req.is_ai_item
    origin = ItemOrigin.AI_CROSS_SELL if is_ai else ItemOrigin.DIRECT

    # Check if item already exists in cart
    existing_item = next((it for it in cart.items if it.product_id == req.product_id), None)
    if existing_item:
        new_qty = existing_item.quantity + req.quantity
        if new_qty > product.stock_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot add {req.quantity} more. Stock limit of {product.stock_quantity} reached.",
            )
        existing_item.quantity = new_qty
        if is_ai:
            existing_item.origin = origin
            existing_item.metadata_json = {**(existing_item.metadata_json or {}), "added_via_ai": True}
    else:
        new_item = CartItem(
            cart_id=cart_id,
            product_id=product.id,
            quantity=req.quantity,
            unit_price=product.price,
            discount_amount=Decimal("0.00"),
            origin=origin,
            metadata_json={
                "added_via_ai": is_ai,
                "growth_opportunity_id": str(req.growth_opportunity_id) if req.growth_opportunity_id else None,
            },
        )
        db.add(new_item)

    await db.commit()

    # Re-fetch for updated totals with populate_existing=True
    res_c = await db.execute(
        select(Cart)
        .where(Cart.id == cart_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .execution_options(populate_existing=True)
    )
    cart = res_c.scalars().first()
    return format_cart_response(cart)


@router.patch(
    "/items/{item_id}",
    summary="Update Cart Item Quantity",
    description="Updates quantity for an existing cart item. If set to 0, removes the item."
)
async def update_cart_item(
    item_id: uuid.UUID,
    req: UpdateCartItemRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(
        select(CartItem).where(CartItem.id == item_id).options(selectinload(CartItem.product))
    )
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")

    cart_id = item.cart_id
    if req.quantity <= 0:
        await db.delete(item)
    else:
        if item.product and item.product.stock_quantity < req.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {item.product.stock_quantity} available in stock.",
            )
        item.quantity = req.quantity

    await db.commit()

    # Re-fetch cart
    res_c = await db.execute(
        select(Cart)
        .where(Cart.id == cart_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .execution_options(populate_existing=True)
    )
    cart = res_c.scalars().first()
    return format_cart_response(cart)


@router.delete(
    "/items/{item_id}",
    summary="Remove Item from Cart",
    description="Removes a specific product line item from the active cart."
)
async def remove_cart_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(select(CartItem).where(CartItem.id == item_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")

    cart_id = item.cart_id
    await db.delete(item)
    await db.commit()

    res_c = await db.execute(
        select(Cart)
        .where(Cart.id == cart_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .execution_options(populate_existing=True)
    )
    cart = res_c.scalars().first()
    return format_cart_response(cart)


@router.delete(
    "",
    summary="Clear Cart",
    description="Removes all items from the active cart."
)
async def clear_cart(
    request: Request,
    response: Response,
    cart_id: Optional[uuid.UUID] = Query(None),
    revora_session_id: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    sid = extract_session_id(request, revora_session_id)
    cid = extract_cart_id(request, cart_id)
    cart = await get_or_create_cart(sid, response, db, explicit_cart_id=cid)

    for it in cart.items:
        await db.delete(it)

    await db.commit()

    res_c = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .execution_options(populate_existing=True)
    )
    cart = res_c.scalars().first()
    return format_cart_response(cart)
