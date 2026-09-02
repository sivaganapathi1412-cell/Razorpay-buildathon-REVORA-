"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Sparkles, 
  Plus, 
  Minus, 
  Check, 
  ShieldCheck, 
  Truck, 
  RefreshCw,
  Zap,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { addToCart } from "@/lib/cartService";
import { ProductImage } from "@/components/ui/ProductImage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addingRecommendation, setAddingRecommendation] = useState(false);
  const [recommendationAdded, setRecommendationAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/products/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          setError("Product could not be found or is currently unavailable.");
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
        setError("Network error while connecting to catalog service.");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = async (targetProduct: any, isAiRecommended = false) => {
    if (isAiRecommended) {
      setAddingRecommendation(true);
    } else {
      setAdding(true);
    }

    try {
      await addToCart(targetProduct.id, isAiRecommended ? 1 : quantity, isAiRecommended);
      if (isAiRecommended) {
        setRecommendationAdded(true);
      } else {
        setAdded(true);
        setTimeout(() => {
          router.push("/cart");
        }, 800);
      }
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAdding(false);
      setAddingRecommendation(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mx-auto" />
          <p className="text-xs text-revora-muted">Loading product specifications...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-revora-muted">{error || "The product you are looking for might be out of stock."}</p>
        <Link href="/catalog">
          <Button variant="primary" size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Storefront</span>
          </Button>
        </Link>
      </div>
    );
  }

  const related = product.related_products || [];
  const primaryRecommendation = related[0] || null;

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-revora-muted">
        <Link href="/catalog" className="hover:text-white flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Catalog</span>
        </Link>
        <span>/</span>
        <Link href={`/catalog?category=${encodeURIComponent(product.category)}`} className="text-emerald-400 hover:text-revora-mint font-semibold transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-slate-300 truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Product Image Gallery */}
        <div className="lg:col-span-6 rounded-3xl border border-revora-border bg-revora-surface overflow-hidden aspect-square relative shadow-2xl">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            category={product.category}
            priority={true}
            className="h-full w-full object-cover"
            containerClassName="h-full w-full"
          />
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="mint" className="text-xs font-bold uppercase tracking-wider">
              {product.category}
            </Badge>
          </div>
        </div>

        {/* Product Info & Purchase Actions */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                {formatCurrency(Number(product.price))}
              </span>
              <span className="text-xs text-revora-muted">Tax included &bull; Free Express Delivery</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-revora-muted border-t border-b border-revora-border/80 py-3">
              <div>
                SKU: <strong className="text-slate-200">{product.sku}</strong>
              </div>
              <div>
                Availability: <strong className="text-emerald-400 font-bold">{product.stock_quantity} in stock</strong>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-300">Quantity:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-revora-border bg-revora-bg p-1.5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-revora-surface disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-bold font-mono text-white px-2 min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-revora-surface disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-xs text-revora-muted font-mono">
                  Line Total: <strong className="text-emerald-400">{formatCurrency(Number(product.price) * quantity)}</strong>
                </span>
              </div>
            </div>

            {/* Trust and Assurance Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-revora-border bg-revora-surface flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-200 font-medium">Dispatches within 24h</span>
              </div>
              <div className="p-3 rounded-xl border border-revora-border bg-revora-surface flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-200 font-medium">Razorpay Safe Payments</span>
              </div>
            </div>
          </div>

          {/* Add to Cart CTA */}
          <div className="pt-4 border-t border-revora-border space-y-3">
            <Button
              onClick={() => handleAddToCart(product, false)}
              disabled={adding || product.stock_quantity <= 0}
              variant="primary"
              size="lg"
              className="w-full gap-2.5 text-xs font-bold h-12 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/60"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4 text-revora-mint" />
                  <span>Added! Proceeding to Cart...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add to Cart ({formatCurrency(Number(product.price) * quantity)})</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-xs text-revora-muted pt-1">
              <Link href="/catalog" className="hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                <span>Continue browsing catalog</span>
              </Link>
              <Link href="/cart" className="text-emerald-400 hover:text-revora-mint font-semibold flex items-center gap-1">
                <span>View Cart</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Revora Personalized Recommendation Card (Canonical Scenario) */}
      {primaryRecommendation && (
        <div className="rounded-2xl border border-emerald-800/70 bg-gradient-to-r from-revora-forest-deep via-revora-surface to-revora-bg p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-revora-mint" />
            <span className="text-xs font-bold text-revora-mint uppercase tracking-wider">
              Revora Smart Recommendation
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <h3 className="text-base font-bold text-white">
                Pairs Well With: {primaryRecommendation.name}
              </h3>
              <p className="text-xs text-revora-muted leading-relaxed">
                Frequently chosen by athletes purchasing {product.name} to maximize running comfort and prevent blisters.
              </p>
              <div className="text-xs font-extrabold text-emerald-400 font-mono pt-1">
                {formatCurrency(Number(primaryRecommendation.price))}
              </div>
            </div>

            <Button
              onClick={() => handleAddToCart(primaryRecommendation, true)}
              disabled={addingRecommendation || recommendationAdded}
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-bold shrink-0 border-emerald-700/80 bg-revora-surface hover:bg-emerald-950/60 text-slate-100 hover:text-white"
            >
              {recommendationAdded ? (
                <>
                  <Check className="h-3.5 w-3.5 text-revora-mint" />
                  <span>Added Add-on!</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-revora-mint" />
                  <span>+ Add to Order ({formatCurrency(Number(primaryRecommendation.price))})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Related Products Grid */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-revora-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
                Complementary Gear
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Frequently Paired With This Item
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((item: any) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                className="group rounded-2xl border border-revora-border bg-revora-surface p-3.5 hover:border-emerald-800/80 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="aspect-square rounded-xl bg-revora-bg overflow-hidden relative">
                    <ProductImage
                      src={item.image_url}
                      alt={item.name}
                      category={item.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-revora-mint transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {formatCurrency(Number(item.price))}
                  </span>
                  <span className="text-[10px] text-revora-muted group-hover:text-white flex items-center gap-1">
                    View <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
