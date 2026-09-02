import os
import sys
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
PUBLIC_DIR = ROOT_DIR / "frontend" / "public" / "images"

def ensure_dirs():
    for sub in [
        "hero",
        "categories",
        "products/footwear",
        "products/apparel",
        "products/accessories",
        "products/electronics",
        "products/recovery",
        "blog",
        "magazine",
        "fallbacks"
    ]:
        (PUBLIC_DIR / sub).mkdir(parents=True, exist_ok=True)

def create_optimized_svg(filename: Path, title: str, category: str, icon_type: str, price: str = "", sku: str = ""):
    """
    Creates lightweight, highly-optimized, fast-decoding SVGs without heavy Gaussian filters,
    CPU-bound animation loops, or embedded raster data.
    """
    icons = {
        "shoe": '''
            <g transform="translate(180, 160) scale(1.1)">
                <!-- Modern Running Shoe Silhouette -->
                <path d="M 40 180 Q 70 120 120 110 Q 180 100 240 130 Q 300 120 340 150 Q 370 180 360 210 Q 340 230 290 230 Q 200 235 120 235 Q 50 235 40 180 Z" fill="url(#shoe-grad)"/>
                <!-- Midsole Foam Wave -->
                <path d="M 40 200 Q 100 215 200 215 Q 300 210 360 195 L 365 220 Q 300 240 180 240 Q 80 240 38 215 Z" fill="#7EE2A8" opacity="0.95"/>
                <!-- Upper Aerodynamic Swoop -->
                <path d="M 120 115 Q 170 140 260 145" stroke="#DDF8E8" stroke-width="4" stroke-linecap="round" fill="none"/>
                <path d="M 140 130 Q 190 155 280 158" stroke="#16A36A" stroke-width="3" stroke-linecap="round" fill="none"/>
                <!-- Breathable Mesh Texture Dots -->
                <circle cx="280" cy="140" r="2.5" fill="#7EE2A8" opacity="0.7"/>
                <circle cx="295" cy="145" r="2.5" fill="#7EE2A8" opacity="0.7"/>
                <circle cx="310" cy="150" r="2.5" fill="#7EE2A8" opacity="0.7"/>
                <circle cx="270" cy="150" r="2.5" fill="#7EE2A8" opacity="0.7"/>
                <circle cx="285" cy="155" r="2.5" fill="#7EE2A8" opacity="0.7"/>
                <!-- Nitrogen Cushion Pods -->
                <rect x="100" y="218" width="28" height="8" rx="4" fill="#0B3D2E"/>
                <rect x="140" y="218" width="28" height="8" rx="4" fill="#0B3D2E"/>
                <rect x="180" y="218" width="28" height="8" rx="4" fill="#0B3D2E"/>
            </g>
        ''',
        "shirt": '''
            <g transform="translate(190, 150) scale(1.05)">
                <!-- Performance Athletic T-Shirt / Singlet -->
                <path d="M 120 70 L 170 100 L 150 140 L 125 130 L 125 250 L 275 250 L 275 130 L 250 140 L 230 100 L 280 70 L 230 60 Q 200 85 170 60 Z" fill="url(#apparel-grad)"/>
                <!-- Seams & Ventilation -->
                <path d="M 170 60 Q 200 85 230 60" stroke="#7EE2A8" stroke-width="3" fill="none"/>
                <path d="M 140 140 L 140 240" stroke="#16A36A" stroke-width="2" stroke-dasharray="4,4" fill="none"/>
                <path d="M 260 140 L 260 240" stroke="#16A36A" stroke-width="2" stroke-dasharray="4,4" fill="none"/>
                <!-- Revora Emblem -->
                <circle cx="200" cy="130" r="12" fill="#0B3D2E" stroke="#7EE2A8" stroke-width="2"/>
                <path d="M 195 130 L 205 130 M 200 125 L 200 135" stroke="#7EE2A8" stroke-width="2"/>
            </g>
        ''',
        "socks": '''
            <g transform="translate(210, 160) scale(1.1)">
                <!-- Technical Cushion Socks (Pair) -->
                <path d="M 80 60 L 130 60 L 130 160 Q 130 195 160 205 L 200 205 Q 220 205 220 185 Q 220 165 190 165 L 150 165 L 140 60 Z" fill="url(#acc-grad)"/>
                <!-- Arch Band Compression -->
                <rect x="145" y="165" width="25" height="40" rx="3" fill="#16A36A" opacity="0.85"/>
                <path d="M 80 75 L 140 75" stroke="#7EE2A8" stroke-width="3"/>
                <!-- Anti-Blister Heel / Toe Padding -->
                <circle cx="135" cy="180" r="10" fill="#7EE2A8" opacity="0.75"/>
                <circle cx="210" cy="185" r="10" fill="#7EE2A8" opacity="0.75"/>
            </g>
        ''',
        "gear": '''
            <g transform="translate(190, 160) scale(1.05)">
                <!-- Trail Hydration Vest / Gear Pack -->
                <path d="M 130 70 L 170 90 L 170 240 L 120 230 L 100 150 Z" fill="url(#acc-grad)"/>
                <path d="M 270 70 L 230 90 L 230 240 L 280 230 L 300 150 Z" fill="url(#acc-grad)"/>
                <!-- Chest Straps -->
                <rect x="160" y="130" width="80" height="10" rx="3" fill="#16A36A"/>
                <rect x="160" y="170" width="80" height="10" rx="3" fill="#16A36A"/>
                <!-- Soft Flasks -->
                <rect x="135" y="130" width="22" height="60" rx="8" fill="#7EE2A8" opacity="0.9"/>
                <rect x="243" y="130" width="22" height="60" rx="8" fill="#7EE2A8" opacity="0.9"/>
            </g>
        ''',
        "watch": '''
            <g transform="translate(200, 150) scale(1.1)">
                <!-- GPS Sport Watch & Wearable (Static, Fast Decode) -->
                <rect x="180" y="40" width="40" height="240" rx="10" fill="#0B3D2E" stroke="#16A36A" stroke-width="2"/>
                <!-- Watch Bezel -->
                <circle cx="200" cy="160" r="65" fill="#07110D" stroke="#7EE2A8" stroke-width="5"/>
                <!-- Outer Tachymeter Dial -->
                <circle cx="200" cy="160" r="54" fill="#0B3D2E" stroke="#16A36A" stroke-width="2"/>
                <!-- Digital Stats Display -->
                <text x="200" y="145" text-anchor="middle" fill="#7EE2A8" font-family="monospace" font-size="14" font-weight="bold">164 BPM</text>
                <text x="200" y="170" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="extrabold">04:18</text>
                <text x="200" y="190" text-anchor="middle" fill="#DDF8E8" font-family="monospace" font-size="11">PACE /KM</text>
                <!-- Pulse Glow Indicator -->
                <circle cx="200" cy="118" r="4" fill="#16A36A"/>
            </g>
        ''',
        "recovery": '''
            <g transform="translate(190, 160) scale(1.05)">
                <!-- Muscle Massage Gun & Recovery Tool -->
                <path d="M 120 100 L 260 100 Q 280 100 280 125 L 280 145 Q 280 170 260 170 L 190 170 L 170 260 Q 165 280 140 280 L 120 280 Q 100 280 105 260 L 130 170 L 120 170 Z" fill="url(#rec-grad)"/>
                <!-- Percussion Massage Head -->
                <circle cx="295" cy="135" r="24" fill="#7EE2A8" stroke="#0B3D2E" stroke-width="4"/>
                <!-- Speed Display Ring -->
                <circle cx="150" cy="135" r="14" fill="#07110D" stroke="#16A36A" stroke-width="3"/>
                <text x="150" y="140" text-anchor="middle" fill="#7EE2A8" font-family="monospace" font-size="10" font-weight="bold">L4</text>
                <!-- Ventilation Vents -->
                <line x1="210" y1="115" x2="210" y2="155" stroke="#7EE2A8" stroke-width="3" stroke-linecap="round"/>
                <line x1="225" y1="115" x2="225" y2="155" stroke="#7EE2A8" stroke-width="3" stroke-linecap="round"/>
                <line x1="240" y1="115" x2="240" y2="155" stroke="#7EE2A8" stroke-width="3" stroke-linecap="round"/>
            </g>
        ''',
        "editorial": '''
            <g transform="translate(180, 140) scale(1.1)">
                <!-- Editorial Research & Intelligence Composition -->
                <rect x="80" y="60" width="240" height="180" rx="16" fill="url(#apparel-grad)" stroke="#16A36A" stroke-width="3"/>
                <path d="M 110 100 L 290 100 M 110 130 L 260 130 M 110 160 L 240 160 M 110 190 L 180 190" stroke="#7EE2A8" stroke-width="4" stroke-linecap="round"/>
                <circle cx="260" cy="180" r="22" fill="#0B3D2E" stroke="#DDF8E8" stroke-width="3"/>
                <path d="M 253 180 L 267 180 M 260 173 L 260 187" stroke="#7EE2A8" stroke-width="3" stroke-linecap="round"/>
            </g>
        '''
    }

    icon_svg = icons.get(icon_type, icons["shoe"])

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B3D2E" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#062A20" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="#07110D" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="shoe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="70%" stop-color="#0B3D2E"/>
      <stop offset="100%" stop-color="#062A20"/>
    </linearGradient>
    <linearGradient id="apparel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
    <linearGradient id="acc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7EE2A8"/>
      <stop offset="60%" stop-color="#16A36A"/>
      <stop offset="100%" stop-color="#0B3D2E"/>
    </linearGradient>
    <linearGradient id="rec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="50%" stop-color="#0B3D2E"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="#16A36A" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#16A36A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="600" height="600" fill="url(#bg-grad)"/>
  <circle cx="300" cy="270" r="220" fill="url(#glow)"/>

  <!-- Geometric Grid Accent -->
  <g stroke="#16A36A" stroke-width="1" opacity="0.15">
    <line x1="100" y1="0" x2="100" y2="600"/>
    <line x1="200" y1="0" x2="200" y2="600"/>
    <line x1="300" y1="0" x2="300" y2="600"/>
    <line x1="400" y1="0" x2="400" y2="600"/>
    <line x1="500" y1="0" x2="500" y2="600"/>
    <line x1="0" y1="100" x2="600" y2="100"/>
    <line x1="0" y1="200" x2="600" y2="200"/>
    <line x1="0" y1="300" x2="600" y2="300"/>
    <line x1="0" y1="400" x2="600" y2="400"/>
    <line x1="0" y1="500" x2="600" y2="500"/>
  </g>

  <!-- Category & Brand Header Ribbon -->
  <g transform="translate(40, 45)">
    <rect x="0" y="0" width="140" height="24" rx="12" fill="#0B3D2E" stroke="#16A36A" stroke-width="1.5"/>
    <text x="70" y="16" text-anchor="middle" fill="#7EE2A8" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">REVORA ATHLETICS</text>
  </g>

  {f"""<g transform="translate(430, 45)">
    <rect x="0" y="0" width="130" height="24" rx="6" fill="#07110D" stroke="#0B3D2E" stroke-width="1.5"/>
    <text x="65" y="16" text-anchor="middle" fill="#7EE2A8" font-family="monospace" font-size="11" font-weight="bold">{sku}</text>
  </g>""" if sku else ""}

  <!-- Central Visual Vector Object -->
  {icon_svg}

  <!-- Footer Product Card Container -->
  <g transform="translate(40, 480)">
    <rect x="0" y="0" width="520" height="80" rx="18" fill="#0B3D2E" stroke="#16A36A" stroke-width="1.5" fill-opacity="0.95"/>
    <text x="24" y="32" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" letter-spacing="-0.3">{title[:38]}</text>
    <text x="24" y="56" fill="#DDF8E8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500">{category}</text>
    {f"""<g transform="translate(400, 18)">
      <rect x="0" y="0" width="96" height="44" rx="10" fill="#07110D" stroke="#7EE2A8" stroke-width="1.5"/>
      <text x="48" y="28" text-anchor="middle" fill="#7EE2A8" font-family="monospace" font-size="15" font-weight="bold">{price}</text>
    </g>""" if price else ""}
  </g>
</svg>'''

    filename.parent.mkdir(parents=True, exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        f.write(svg_content.strip())
    print(f"Generated: {filename.name}")

def generate_all_assets():
    ensure_dirs()
    print("Generating 100% stable local SVG asset suite for REVORA AI...")

    # 1. Hero
    create_optimized_svg(
        PUBLIC_DIR / "hero" / "velocity-nitro-hero-shoe.svg",
        "Velocity Nitro Performance Runner",
        "Footwear & Running",
        "shoe",
        "₹2,499",
        "REV-HERO-01"
    )

    # 2. Categories (5)
    categories = [
        ("footwear-running.svg", "Footwear & Running", "Road, Trail & Race Trainers", "shoe"),
        ("apparel-activewear.svg", "Apparel & Activewear", "Performance Tops, Shorts & Tights", "shirt"),
        ("accessories-gear.svg", "Accessories & Gear", "Socks, Vests, Bottles & Belts", "socks"),
        ("electronics-wearables.svg", "Electronics & Wearables", "GPS Watches & Heart Rate Sensors", "watch"),
        ("nutrition-recovery.svg", "Nutrition & Recovery", "Massage Guns, Rollers & Electrolytes", "recovery"),
    ]
    for filename, title, sub, icon_type in categories:
        create_optimized_svg(PUBLIC_DIR / "categories" / filename, title, sub, icon_type)
        create_optimized_svg(PUBLIC_DIR / "fallbacks" / filename, title, "Category Fallback", icon_type)

    # 3. Products (All 100 Products from demo_data)
    from app.seed.demo_data import DEMO_PRODUCTS
    for p in DEMO_PRODUCTS:
        sku = p["sku"]
        name = p["name"]
        price = f"₹{int(p['price']):,}"
        img_rel = p["image_url"].lstrip("/")
        # Path: e.g. frontend/public/images/products/footwear/...
        target_file = ROOT_DIR / "frontend" / "public" / img_rel
        
        if "SHOE" in sku:
            icon_type = "shoe"
        elif "APP" in sku:
            icon_type = "shirt"
        elif "SOCK" in sku:
            icon_type = "socks"
        elif "TECH" in sku or "WATCH" in sku:
            icon_type = "watch"
        elif "NUT" in sku or "REC" in sku:
            icon_type = "recovery"
        else:
            icon_type = "gear"

        create_optimized_svg(target_file, name, p["category"], icon_type, price, sku)

    # 4. Blog (6)
    blog_items = [
        ("ai-shopping-assistants-new-interface.svg", "AI Shopping Assistants: New Commerce Interface", "Commerce AI", "editorial"),
        ("why-payment-recovery-matters.svg", "Why Payment Recovery Matters for Modern D2C", "Fintech", "editorial"),
        ("autonomous-growth-engine-vs-rule-based-upsells.svg", "Autonomous Growth Engine vs Rule Upsells", "Growth", "editorial"),
        ("safety-engines-why-merchants-need-guardrails.svg", "Safety Engines in Commerce: Guardrails", "Safety", "editorial"),
        ("zero-double-counting-revenue-attribution.svg", "Zero Double-Counting: Revenue Attribution", "Fintech", "editorial"),
        ("building-agentic-checkout-flows-razorpay.svg", "Building Agentic Checkouts with Razorpay", "Engineering", "editorial"),
    ]
    for filename, title, cat, icon_type in blog_items:
        create_optimized_svg(PUBLIC_DIR / "blog" / filename, title, cat, icon_type)

    # 5. Magazine (4)
    magazine_items = [
        ("agentic-commerce-issue.svg", "The Agentic Commerce Issue: Autonomous AI", "Issue 01", "editorial"),
        ("the-anatomy-of-a-marathon-bundle.svg", "Anatomy of a Marathon Bundle", "Issue 01", "shoe"),
        ("engineering-trust-in-fintech-checkouts.svg", "Engineering Trust: Real-Time Gateways", "Issue 01", "watch"),
        ("the-future-of-merchant-command-centers.svg", "Future of Merchant Command Centers", "Issue 01", "editorial"),
    ]
    for filename, title, issue, icon_type in magazine_items:
        create_optimized_svg(PUBLIC_DIR / "magazine" / filename, title, issue, icon_type)

    print(f"All 100 product SVG assets + full suite generated successfully under {PUBLIC_DIR}!")

if __name__ == "__main__":
    generate_all_assets()
