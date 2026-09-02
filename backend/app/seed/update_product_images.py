import re
from pathlib import Path

demo_data_path = Path(__file__).resolve().parent.parent / "seed" / "demo_data.py"
content = demo_data_path.read_text(encoding="utf-8")

# Map of SKU to local SVG path
image_map = {
    "REV-SHOE-01": "/images/products/footwear/velocity-nitro-running-shoes.svg",
    "REV-SHOE-02": "/images/products/footwear/apex-carbon-marathon-racer.svg",
    "REV-SHOE-03": "/images/products/footwear/cloudstride-ultra-distance-trainers.svg",
    "REV-SHOE-04": "/images/products/footwear/trailgrip-all-terrain-summit-shoes.svg",
    "REV-SHOE-05": "/images/products/footwear/sprintglide-lightweight-tempo-shoes.svg",
    "REV-SHOE-06": "/images/products/footwear/hydroshield-waterproof-trail-runners.svg",
    "REV-SHOE-07": "/images/products/footwear/aerostep-gym-and-cross-training-shoes.svg",
    "REV-SHOE-08": "/images/products/footwear/echoglide-natural-motion-shoes.svg",
    "REV-SHOE-09": "/images/products/footwear/enduramax-long-run-road-shoes.svg",
    "REV-SHOE-10": "/images/products/footwear/tempoflex-responsive-daily-trainers.svg",
    "REV-SHOE-11": "/images/products/footwear/pacelite-beginner-athletic-running-shoes.svg",
    "REV-SHOE-12": "/images/products/footwear/marathonpro-carbon-elite-racers.svg",

    "REV-APP-01": "/images/products/apparel/aerovent-pro-seamless-running-tee.svg",
    "REV-APP-02": "/images/products/apparel/endurance-2-in-1-compression-shorts.svg",
    "REV-APP-03": "/images/products/apparel/thermalshield-packable-windbreaker.svg",
    "REV-APP-04": "/images/products/apparel/coreflex-high-waist-athletic-leggings.svg",
    "REV-APP-05": "/images/products/apparel/hydrodry-sleeveless-marathon-singlet.svg",
    "REV-APP-06": "/images/products/apparel/stormflex-half-zip-winter-layer.svg",
    "REV-APP-07": "/images/products/apparel/impactfit-medium-support-sports-bra.svg",
    "REV-APP-08": "/images/products/apparel/swiftmotion-track-training-joggers.svg",
    "REV-APP-09": "/images/products/apparel/aerodry-ultra-lightweight-training-singlet.svg",
    "REV-APP-10": "/images/products/apparel/velocity-compression-training-tights.svg",
    "REV-APP-11": "/images/products/apparel/thermalrun-merino-wool-base-layer.svg",
    "REV-APP-12": "/images/products/apparel/recoveryflex-post-run-pullover-hoodie.svg",

    "REV-SOCK-01": "/images/products/accessories/breathable-sports-cushion-socks-3-pack.svg",
    "REV-HEAD-01": "/images/products/accessories/sweat-wicking-performance-headband.svg",
    "REV-VEST-01": "/images/products/accessories/trailrunner-hydration-vest-5l.svg",
    "REV-BOTTLE-01": "/images/products/accessories/insulated-stainless-steel-sports-bottle-750ml.svg",
    "REV-BELT-01": "/images/products/accessories/no-bounce-ultra-slim-running-belt.svg",
    "REV-CAP-01": "/images/products/accessories/laser-vent-uv-protection-running-cap.svg",
    "REV-GLOVE-01": "/images/products/accessories/touchscreen-winter-running-gloves.svg",
    "REV-SLEEVE-01": "/images/products/accessories/graduated-compression-calf-sleeves-pair.svg",
    "REV-LACE-01": "/images/products/accessories/speedlock-reflective-elastic-shoe-laces.svg",
    "REV-BAND-01": "/images/products/accessories/nightglow-high-visibility-led-armband.svg",
    "REV-TOWEL-01": "/images/products/accessories/quickdry-microfiber-sports-sweat-towel.svg",
    "REV-DUFFEL-01": "/images/products/accessories/endurance-ventilated-gym-and-race-duffel-35l.svg",

    "REV-TECH-01": "/images/products/electronics/pulsetrack-pro-gps-sports-watch.svg",
    "REV-TECH-02": "/images/products/electronics/aerobeats-ipx7-wireless-sport-earbuds.svg",
    "REV-TECH-03": "/images/products/electronics/aeropulse-optical-armband-heart-rate-monitor.svg",
    "REV-TECH-04": "/images/products/electronics/nightrunner-high-lumen-chest-light.svg",
    "REV-TECH-05": "/images/products/electronics/boneconduction-open-ear-audio-headset.svg",
    "REV-TECH-06": "/images/products/electronics/speedcadence-bluetooth-running-pod.svg",
    "REV-TECH-07": "/images/products/electronics/smartjumper-digital-speed-jump-rope.svg",
    "REV-TECH-08": "/images/products/electronics/stridesense-foot-pod-cadence-tracker.svg",
    "REV-TECH-09": "/images/products/electronics/corebeat-chest-strap-heart-rate-monitor.svg",
    "REV-TECH-10": "/images/products/electronics/trailbeam-rechargeable-ultra-headlamp-400lm.svg",
    "REV-TECH-11": "/images/products/electronics/smarthydrate-bluetooth-water-intake-sensor.svg",
    "REV-TECH-12": "/images/products/electronics/sprinttimer-digital-multi-lap-interval-watch.svg",

    "REV-NUT-01": "/images/products/recovery/hydroelectrolyte-hydration-drink-mix-30-servings.svg",
    "REV-NUT-02": "/images/products/recovery/deeptissue-muscle-massage-gun-4-speeds.svg",
    "REV-NUT-03": "/images/products/recovery/high-density-grid-foam-muscle-roller-18-inch.svg",
    "REV-NUT-04": "/images/products/recovery/endurance-energy-gels-variety-box-12-pack.svg",
    "REV-NUT-05": "/images/products/recovery/plantpro-100%-vegan-protein-powder-1kg.svg",
    "REV-NUT-06": "/images/products/recovery/aerorecovery-cold-therapy-ice-compression-wrap.svg",
    "REV-NUT-07": "/images/products/recovery/targeted-muscle-trigger-point-lacrosse-ball.svg",
    "REV-NUT-08": "/images/products/recovery/spiky-plantar-fascia-foot-massage-roller.svg",
    "REV-NUT-09": "/images/products/recovery/cooling-instant-relief-sports-towel.svg",
    "REV-NUT-10": "/images/products/recovery/magnesium-glycinate-sleep-and-muscle-tablets-60ct.svg",
    "REV-NUT-11": "/images/products/recovery/heavy-duty-mobility-recovery-resistance-bands-set-of-3.svg",
    "REV-NUT-12": "/images/products/recovery/marathon-finisher-complete-recovery-nutrition-kit.svg",
}

# Update demo_data.py image_urls
for sku, local_img in image_map.items():
    # match sku block
    pattern = rf'("sku":\s*"{sku}",.*?)"image_url":\s*"[^"]+"'
    content = re.sub(pattern, rf'\1"image_url": "{local_img}"', content, flags=re.DOTALL)

demo_data_path.write_text(content, encoding="utf-8")
print("Updated demo_data.py image_url values to local SVGs.")
