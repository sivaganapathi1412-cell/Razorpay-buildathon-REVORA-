from pathlib import Path

HERO_DIR = Path(r"c:\Users\SIVAGANAPATHI.V\OneDrive\Documents\hackathon project\frontend\public\images\hero")
HERO_DIR.mkdir(parents=True, exist_ok=True)

# 9 Coordinated 3D-Style Visual Elements (3 per slide)

# 1. Slide 1 - Element 1: Premium Running Shoe
slide_1_shoe = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s1-shoe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="60%" stop-color="#0B3D2E"/>
      <stop offset="100%" stop-color="#062A20"/>
    </linearGradient>
    <linearGradient id="s1-sole-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#DDF8E8"/>
      <stop offset="50%" stop-color="#7EE2A8"/>
      <stop offset="100%" stop-color="#16A36A"/>
    </linearGradient>
    <radialGradient id="s1-shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Ground Soft Shadow -->
  <ellipse cx="200" cy="330" rx="160" ry="24" fill="url(#s1-shadow)"/>
  <g transform="translate(30, 60) rotate(-6, 200, 200)">
    <!-- Main Shoe Silhouette -->
    <path d="M 50 240 Q 80 160 140 140 Q 210 120 280 160 Q 330 150 360 190 Q 370 230 350 260 Q 300 280 200 280 Q 100 285 50 240 Z" fill="url(#s1-shoe-grad)"/>
    <!-- Responsive Nitrogen Midsole -->
    <path d="M 45 255 Q 120 275 220 270 Q 310 260 365 240 L 368 265 Q 310 295 200 295 Q 90 295 42 270 Z" fill="url(#s1-sole-grad)"/>
    <!-- Carbon Plate Spine -->
    <path d="M 120 255 Q 220 258 310 245" stroke="#07110D" stroke-width="4" fill="none"/>
    <!-- Dynamic Aerodynamic Speed Lines -->
    <path d="M 140 155 Q 200 185 290 190" stroke="#7EE2A8" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M 160 170 Q 215 195 305 200" stroke="#DDF8E8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <!-- Collar & Eyelets -->
    <path d="M 140 140 Q 180 120 210 145" stroke="#7EE2A8" stroke-width="3" fill="none"/>
    <circle cx="210" cy="155" r="3" fill="#DDF8E8"/>
    <circle cx="230" cy="165" r="3" fill="#DDF8E8"/>
    <circle cx="250" cy="175" r="3" fill="#DDF8E8"/>
    <!-- Revora Precision Badge -->
    <rect x="265" y="172" width="32" height="12" rx="6" fill="#0B3D2E" stroke="#7EE2A8" stroke-width="1.5"/>
    <text x="281" y="181" text-anchor="middle" fill="#7EE2A8" font-family="sans-serif" font-size="7" font-weight="bold">NITRO</text>
  </g>
</svg>'''

# 2. Slide 1 - Element 2: Wireless Audio Sport Pods & Case
slide_1_headphones = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s1-case-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B3D2E"/>
      <stop offset="70%" stop-color="#07110D"/>
      <stop offset="100%" stop-color="#020806"/>
    </linearGradient>
    <linearGradient id="s1-accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7EE2A8"/>
      <stop offset="100%" stop-color="#16A36A"/>
    </linearGradient>
    <radialGradient id="s1-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#16A36A" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#16A36A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Ambient Soft Shadow -->
  <ellipse cx="200" cy="330" rx="140" ry="22" fill="#000000" opacity="0.35"/>
  <circle cx="200" cy="200" r="130" fill="url(#s1-glow)"/>
  <!-- Charging Case Body (3D Perspective) -->
  <g transform="translate(60, 100) rotate(5, 140, 100)">
    <rect x="40" y="60" width="180" height="130" rx="40" fill="url(#s1-case-grad)" stroke="#16A36A" stroke-width="3"/>
    <!-- Lid Seam -->
    <path d="M 40 115 L 220 115" stroke="#7EE2A8" stroke-width="2" opacity="0.7"/>
    <!-- LED Battery Level Bar -->
    <rect x="110" y="130" width="40" height="5" rx="2.5" fill="url(#s1-accent)"/>
    <!-- Earbud 1 (Floating Left) -->
    <g transform="translate(30, -30) rotate(-18)">
      <circle cx="60" cy="50" r="24" fill="#0B3D2E" stroke="#7EE2A8" stroke-width="2.5"/>
      <rect x="52" y="65" width="16" height="45" rx="8" fill="url(#s1-case-grad)" stroke="#16A36A" stroke-width="2"/>
      <circle cx="60" cy="50" r="10" fill="#7EE2A8" opacity="0.85"/>
      <!-- Sound Vent -->
      <line x1="45" y1="42" x2="52" y2="42" stroke="#DDF8E8" stroke-width="2"/>
    </g>
    <!-- Earbud 2 (Floating Right) -->
    <g transform="translate(150, -40) rotate(22)">
      <circle cx="60" cy="50" r="24" fill="#0B3D2E" stroke="#7EE2A8" stroke-width="2.5"/>
      <rect x="52" y="65" width="16" height="45" rx="8" fill="url(#s1-case-grad)" stroke="#16A36A" stroke-width="2"/>
      <circle cx="60" cy="50" r="10" fill="#7EE2A8" opacity="0.85"/>
      <line x1="68" y1="42" x2="75" y2="42" stroke="#DDF8E8" stroke-width="2"/>
    </g>
  </g>
</svg>'''

# 3. Slide 1 - Element 3: 3D Shopping Bag / Cart Element
slide_1_bag = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s1-bag-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="50%" stop-color="#0B3D2E"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
    <linearGradient id="s1-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DDF8E8"/>
      <stop offset="100%" stop-color="#7EE2A8"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="335" rx="130" ry="20" fill="#000000" opacity="0.35"/>
  <g transform="translate(80, 70) rotate(-4, 120, 150)">
    <!-- Bag Handles -->
    <path d="M 80 110 Q 80 30 120 30 Q 160 30 160 110" stroke="url(#s1-gold)" stroke-width="8" stroke-linecap="round" fill="none"/>
    <!-- Bag Main Geometry (3D Trapezoid) -->
    <path d="M 40 100 L 200 100 L 220 260 L 20 260 Z" fill="url(#s1-bag-grad)" stroke="#7EE2A8" stroke-width="3"/>
    <!-- Bag Side Flap Perspective Depth -->
    <path d="M 200 100 L 235 125 L 250 270 L 220 260 Z" fill="#07110D" stroke="#16A36A" stroke-width="2.5"/>
    <path d="M 40 100 L 200 100 L 235 125 L 75 125 Z" fill="#0B3D2E" opacity="0.8"/>
    <!-- Revora Emblem Crest -->
    <circle cx="120" cy="180" r="28" fill="#07110D" stroke="#7EE2A8" stroke-width="3"/>
    <path d="M 108 180 L 132 180 M 120 168 L 120 192" stroke="#7EE2A8" stroke-width="3.5" stroke-linecap="round"/>
    <!-- Subtle Tag -->
    <rect x="145" y="130" width="30" height="42" rx="4" fill="#07110D" stroke="#DDF8E8" stroke-width="1.5" transform="rotate(15, 145, 130)"/>
    <circle cx="158" cy="138" r="3" fill="#7EE2A8"/>
  </g>
</svg>'''

# 4. Slide 2 - Element 1: Velocity Nitro Running Shoes (Bundle Main)
slide_2_shoe = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s2-shoe" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="50%" stop-color="#0B3D2E"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
    <linearGradient id="s2-sole" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7EE2A8"/>
      <stop offset="100%" stop-color="#DDF8E8"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="330" rx="150" ry="22" fill="#000000" opacity="0.35"/>
  <g transform="translate(40, 70) rotate(-3, 160, 160)">
    <!-- Shoe Upper Body -->
    <path d="M 40 220 Q 80 150 140 130 Q 210 110 270 150 Q 320 145 350 185 Q 360 220 340 245 Q 290 265 190 265 Q 90 270 40 220 Z" fill="url(#s2-shoe)"/>
    <!-- Cushion Wave -->
    <path d="M 38 238 Q 110 258 210 252 Q 300 245 355 228 L 358 250 Q 300 278 190 278 Q 80 278 35 252 Z" fill="url(#s2-sole)"/>
    <path d="M 130 145 Q 190 170 280 175" stroke="#7EE2A8" stroke-width="4" stroke-linecap="round" fill="none"/>
    <!-- Bundle Highlight Badge -->
    <g transform="translate(240, 80)">
      <rect x="0" y="0" width="80" height="26" rx="13" fill="#0B3D2E" stroke="#7EE2A8" stroke-width="2"/>
      <text x="40" y="17" text-anchor="middle" fill="#7EE2A8" font-family="sans-serif" font-size="10" font-weight="bold">₹2,499</text>
    </g>
  </g>
</svg>'''

# 5. Slide 2 - Element 2: Sports Cushion Socks
slide_2_socks = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s2-sock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B3D2E"/>
      <stop offset="50%" stop-color="#16A36A"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="330" rx="130" ry="20" fill="#000000" opacity="0.35"/>
  <g transform="translate(80, 60) rotate(8, 120, 150)">
    <!-- Technical Socks Silhouette (3D Layered) -->
    <path d="M 60 50 L 140 50 L 140 180 Q 140 240 200 250 L 240 250 Q 270 250 270 220 Q 270 190 220 190 L 170 190 L 150 50 Z" fill="url(#s2-sock-grad)" stroke="#7EE2A8" stroke-width="3"/>
    <!-- Compression Arch Band -->
    <rect x="160" y="190" width="35" height="58" rx="4" fill="#07110D" stroke="#7EE2A8" stroke-width="2"/>
    <!-- Ribbed Cuff Stripes -->
    <line x1="60" y1="65" x2="145" y2="65" stroke="#7EE2A8" stroke-width="3"/>
    <line x1="60" y1="80" x2="145" y2="80" stroke="#DDF8E8" stroke-width="3"/>
    <!-- Anti-Blister Toe / Heel Pods -->
    <circle cx="155" cy="215" r="14" fill="#7EE2A8" opacity="0.75"/>
    <circle cx="255" cy="235" r="14" fill="#7EE2A8" opacity="0.75"/>
    <!-- Pair Add-on Badge -->
    <g transform="translate(180, 70)">
      <rect x="0" y="0" width="70" height="26" rx="13" fill="#07110D" stroke="#7EE2A8" stroke-width="2"/>
      <text x="35" y="17" text-anchor="middle" fill="#7EE2A8" font-family="sans-serif" font-size="10" font-weight="bold">+ ₹299</text>
    </g>
  </g>
</svg>'''

# 6. Slide 2 - Element 3: Fitness Hydration / Gear Accessory
slide_2_gear = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s2-bottle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="40%" stop-color="#0B3D2E"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
    <linearGradient id="s2-metal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#DDF8E8"/>
      <stop offset="50%" stop-color="#7EE2A8"/>
      <stop offset="100%" stop-color="#16A36A"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="335" rx="120" ry="20" fill="#000000" opacity="0.35"/>
  <g transform="translate(110, 60) rotate(-6, 90, 150)">
    <!-- Insulated Bottle Body -->
    <rect x="40" y="100" width="100" height="180" rx="20" fill="url(#s2-bottle-grad)" stroke="#7EE2A8" stroke-width="3"/>
    <!-- Bottle Neck -->
    <rect x="60" y="70" width="60" height="30" rx="6" fill="#0B3D2E" stroke="#16A36A" stroke-width="2"/>
    <!-- Stainless Cap & Carabiner Loop -->
    <rect x="50" y="45" width="80" height="25" rx="10" fill="url(#s2-metal)" stroke="#07110D" stroke-width="2"/>
    <path d="M 90 45 L 90 25 Q 90 15 105 15 Q 120 15 120 25 L 120 45" stroke="url(#s2-metal)" stroke-width="5" fill="none"/>
    <!-- Silicone Grip Rings -->
    <rect x="40" y="140" width="100" height="12" rx="3" fill="#07110D"/>
    <rect x="40" y="165" width="100" height="12" rx="3" fill="#07110D"/>
    <!-- Measurement Scale -->
    <line x1="125" y1="120" x2="135" y2="120" stroke="#7EE2A8" stroke-width="2"/>
    <line x1="120" y1="135" x2="135" y2="135" stroke="#7EE2A8" stroke-width="2"/>
    <line x1="125" y1="190" x2="135" y2="190" stroke="#7EE2A8" stroke-width="2"/>
    <line x1="120" y1="205" x2="135" y2="205" stroke="#7EE2A8" stroke-width="2"/>
    <line x1="125" y1="220" x2="135" y2="220" stroke="#7EE2A8" stroke-width="2"/>
  </g>
</svg>'''

# 7. Slide 3 - Element 1: Shopping Cart & Order Box
slide_3_cart = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s3-box-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B3D2E"/>
      <stop offset="60%" stop-color="#16A36A"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="330" rx="140" ry="22" fill="#000000" opacity="0.35"/>
  <g transform="translate(60, 70) rotate(-4, 140, 140)">
    <!-- 3D Order Parcel Box Body -->
    <path d="M 40 120 L 160 60 L 260 110 L 140 170 Z" fill="#16A36A" stroke="#7EE2A8" stroke-width="2.5"/>
    <path d="M 40 120 L 140 170 L 140 270 L 40 220 Z" fill="url(#s3-box-grad)" stroke="#7EE2A8" stroke-width="2.5"/>
    <path d="M 140 170 L 260 110 L 260 210 L 140 270 Z" fill="#07110D" stroke="#16A36A" stroke-width="2.5"/>
    <!-- Security Tape / Band -->
    <path d="M 90 95 L 140 170 L 140 270" stroke="#7EE2A8" stroke-width="6" fill="none" opacity="0.9"/>
    <!-- Verified Shipping Label -->
    <rect x="165" y="160" width="70" height="40" rx="4" fill="#DDF8E8" stroke="#0B3D2E" stroke-width="1.5" transform="rotate(-10, 165, 160)"/>
    <line x1="172" y1="172" x2="220" y2="172" stroke="#07110D" stroke-width="2"/>
    <line x1="172" y1="182" x2="205" y2="182" stroke="#07110D" stroke-width="2"/>
  </g>
</svg>'''

# 8. Slide 3 - Element 2: Secure Payment & Razorpay Test Card
slide_3_card = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s3-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="50%" stop-color="#0B3D2E"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
    <linearGradient id="s3-chip" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DDF8E8"/>
      <stop offset="100%" stop-color="#7EE2A8"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="335" rx="140" ry="22" fill="#000000" opacity="0.35"/>
  <g transform="translate(50, 90) rotate(8, 150, 100)">
    <!-- 3D Card Rectangle -->
    <rect x="20" y="30" width="260" height="160" rx="20" fill="url(#s3-card-grad)" stroke="#7EE2A8" stroke-width="3"/>
    <!-- EMV Security Chip -->
    <rect x="50" y="65" width="42" height="32" rx="6" fill="url(#s3-chip)" stroke="#07110D" stroke-width="1.5"/>
    <line x1="50" y1="81" x2="92" y2="81" stroke="#07110D" stroke-width="1.5"/>
    <line x1="71" y1="65" x2="71" y2="97" stroke="#07110D" stroke-width="1.5"/>
    <!-- Contactless Waves -->
    <path d="M 110 70 Q 116 80 110 90" stroke="#7EE2A8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M 118 65 Q 126 80 118 95" stroke="#7EE2A8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- Card Details -->
    <text x="50" y="145" fill="#FFFFFF" font-family="monospace" font-size="14" font-weight="bold" letter-spacing="2">•••• •••• •••• 4242</text>
    <text x="50" y="170" fill="#7EE2A8" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="1">RAZORPAY TEST MODE</text>
    <!-- Brand Mark -->
    <circle cx="235" cy="155" r="14" fill="#7EE2A8" opacity="0.8"/>
    <circle cx="250" cy="155" r="14" fill="#16A36A" opacity="0.8"/>
  </g>
</svg>'''

# 9. Slide 3 - Element 3: Recovery Shield & Order Success Crest
slide_3_recovery = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="s3-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16A36A"/>
      <stop offset="60%" stop-color="#0B3D2E"/>
      <stop offset="100%" stop-color="#07110D"/>
    </linearGradient>
    <radialGradient id="s3-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7EE2A8" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#7EE2A8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="200" cy="335" rx="130" ry="20" fill="#000000" opacity="0.35"/>
  <circle cx="200" cy="190" r="120" fill="url(#s3-glow)"/>
  <g transform="translate(90, 60) rotate(-2, 110, 130)">
    <!-- 3D Armor Shield -->
    <path d="M 110 30 Q 190 30 190 100 Q 190 190 110 240 Q 30 190 30 100 Q 30 30 110 30 Z" fill="url(#s3-shield-grad)" stroke="#7EE2A8" stroke-width="4"/>
    <!-- Inner Trim Line -->
    <path d="M 110 50 Q 170 50 170 105 Q 170 175 110 215 Q 50 175 50 105 Q 50 50 110 50 Z" stroke="#16A36A" stroke-width="2" fill="none"/>
    <!-- Central Verified Checkmark -->
    <circle cx="110" cy="130" r="38" fill="#07110D" stroke="#7EE2A8" stroke-width="3"/>
    <path d="M 94 130 L 105 142 L 128 116" stroke="#7EE2A8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <!-- Policy Protected Tag -->
    <rect x="55" y="195" width="110" height="22" rx="11" fill="#07110D" stroke="#7EE2A8" stroke-width="1.5"/>
    <text x="110" y="210" text-anchor="middle" fill="#7EE2A8" font-family="sans-serif" font-size="8" font-weight="extrabold" letter-spacing="0.5">RECOVERY READY</text>
  </g>
</svg>'''

assets = [
    ("slide-1-shoe.svg", slide_1_shoe),
    ("slide-1-headphones.svg", slide_1_headphones),
    ("slide-1-bag.svg", slide_1_bag),
    ("slide-2-shoe.svg", slide_2_shoe),
    ("slide-2-socks.svg", slide_2_socks),
    ("slide-2-gear.svg", slide_2_gear),
    ("slide-3-cart.svg", slide_3_cart),
    ("slide-3-card.svg", slide_3_card),
    ("slide-3-recovery.svg", slide_3_recovery),
]

for name, content in assets:
    p = HERO_DIR / name
    with open(p, "w", encoding="utf-8") as f:
        f.write(content.strip())
    print(f"Generated hero 3D asset: {p.name} ({len(content)} bytes)")

print(f"Successfully generated all 9/9 hero 3D assets in {HERO_DIR}!")
