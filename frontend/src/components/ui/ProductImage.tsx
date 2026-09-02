"use client";

import { useState, useEffect } from "react";
import { resolveProductImageUrl, resolveCategoryFallback } from "@/lib/imageResolver";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
}

export function ProductImage({
  src,
  alt,
  category,
  priority = false,
  className = "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
  containerClassName = "relative aspect-square w-full bg-revora-bg overflow-hidden",
}: ProductImageProps) {
  const initialSrc = resolveProductImageUrl(src, category);
  const fallbackSrc = resolveCategoryFallback(category);

  const [imgSrc, setImgSrc] = useState<string>(initialSrc);
  const [hasFailed, setHasFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Synchronize when src or category changes dynamically
  useEffect(() => {
    const resolved = resolveProductImageUrl(src, category);
    setImgSrc(resolved);
    setHasFailed(false);
  }, [src, category]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null; // Prevent loop
    if (!hasFailed && imgSrc !== fallbackSrc) {
      setHasFailed(true);
      setImgSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Prevent CSS aspect-ratio percentage height collapse:
  // If container is pure w-full h-full inside an aspect-ratio parent, apply absolute inset-0
  const isPureFullSize = containerClassName === "w-full h-full" || containerClassName === "h-full w-full";
  const finalContainerClass = isPureFullSize
    ? "absolute inset-0 w-full h-full overflow-hidden"
    : `relative ${containerClassName}`;

  return (
    <div className={finalContainerClass}>
      <img
        src={imgSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} block ${isLoaded ? "opacity-100" : "opacity-95"} transition-opacity duration-200`}
      />
    </div>
  );
}
