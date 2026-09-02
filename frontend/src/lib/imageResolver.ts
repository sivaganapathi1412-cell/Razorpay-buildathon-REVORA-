/**
 * REVORA AI — Canonical Image Resolver
 * Provides deterministic mapping of all catalog products, categories,
 * and editorial content to verified local photographic assets.
 * 
 * Complies with strict safety freeze: intercepts incoming API paths (.svg)
 * and resolves them to verified local photographic .jpg assets.
 */

export const CATEGORY_FALLBACKS: Record<string, string> = {
  "Footwear & Running": "/images/fallbacks/footwear-running.jpg",
  "Apparel & Activewear": "/images/fallbacks/apparel-activewear.jpg",
  "Accessories & Gear": "/images/fallbacks/accessories-gear.jpg",
  "Electronics & Wearables": "/images/fallbacks/electronics-wearables.jpg",
  "Nutrition & Recovery": "/images/fallbacks/nutrition-recovery.jpg",
};

export const DEFAULT_FALLBACK = "/images/fallbacks/footwear-running.jpg";

/**
 * Resolves any category name to its local photographic fallback image.
 */
export function resolveCategoryFallback(category?: string | null): string {
  if (category && CATEGORY_FALLBACKS[category]) {
    return CATEGORY_FALLBACKS[category];
  }
  return DEFAULT_FALLBACK;
}

/**
 * Resolves any product image URL to a verified local photographic asset.
 * If incoming URL is an .svg (e.g. from frozen DB/seed), it resolves to the matching .jpg.
 */
export function resolveProductImageUrl(
  url?: string | null,
  category?: string | null
): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return resolveCategoryFallback(category);
  }

  const trimmed = url.trim();

  // Convert any SVG reference in /images/ to photographic JPG
  if (trimmed.toLowerCase().endsWith(".svg")) {
    return trimmed.slice(0, -4) + ".jpg";
  }

  return trimmed;
}
