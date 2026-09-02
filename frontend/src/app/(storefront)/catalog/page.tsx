"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  Search, 
  Plus, 
  Check, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { addToCart } from "@/lib/cartService";
import { ShoppingAssistantModal } from "@/components/ai/ShoppingAssistantModal";
import { ProductImage } from "@/components/ui/ProductImage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get("category");

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryParam || "ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isAiOpen, setIsAiOpen] = useState(false);

  useEffect(() => {
    if (initialCategoryParam) {
      setSelectedCategory(initialCategoryParam);
    }
  }, [initialCategoryParam]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) {
        const data = await res.json();
        const catNames = data.map((c: any) => c.name).filter(Boolean);
        if (catNames.length > 0) {
          setCategories(catNames);
        }
      }
    } catch (err) {
      console.warn("Could not load categories directly:", err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `${API_BASE}/products?limit=120`;
      if (selectedCategory && selectedCategory !== "ALL") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);

        setCategories((prev) => {
          if (prev.length > 0) return prev;
          return Array.from(new Set(data.map((p: any) => p.category))).filter(Boolean) as string[];
        });
      } else {
        setError("Failed to load catalog products from backend server.");
      }
    } catch (err: any) {
      console.error("Failed to load catalog products:", err);
      setError("We couldn't load products due to a network connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product.id, 1, false);
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to add product to cart:", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner with AI Assistant Launcher */}
      <div className="rounded-3xl border border-revora-border bg-gradient-to-r from-revora-forest-deep via-revora-surface to-revora-bg p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-revora-mint uppercase tracking-wider">REVORA STOREFRONT</span>
            <Badge variant="mint" className="text-[10px] font-mono font-bold">
              {products.length} Products
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Performance Footwear, Apparel &amp; Gear</h1>
          <p className="text-xs text-revora-muted leading-relaxed">
            High-mileage running shoes, moisture-wicking training layers, hydration packs, and muscle recovery essentials.
          </p>
        </div>

        <Button
          onClick={() => setIsAiOpen(true)}
          variant="primary"
          size="md"
          className="gap-2 text-xs font-bold shrink-0 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30"
        >
          <Sparkles className="h-4 w-4 text-revora-mint" />
          <span>Shop with Revora AI</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-revora-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search footwear, socks, vest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-revora-border bg-revora-surface pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-colors ${
              selectedCategory === "ALL"
                ? "border-emerald-500 bg-emerald-950/60 text-revora-mint font-bold"
                : "border-revora-border bg-revora-surface text-slate-300 hover:text-white"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "border-emerald-500 bg-emerald-950/60 text-revora-mint font-bold"
                  : "border-revora-border bg-revora-surface text-slate-300 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-4 border-revora-border bg-revora-surface animate-pulse space-y-3 rounded-2xl">
              <div className="aspect-square rounded-xl bg-revora-bg" />
              <div className="h-3 bg-revora-bg rounded w-1/3" />
              <div className="h-4 bg-revora-bg rounded w-3/4" />
              <div className="h-4 bg-revora-bg rounded w-1/4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Error Loading Catalog</h3>
            <p className="text-xs text-slate-300">{error}</p>
          </div>
          <Button onClick={loadProducts} variant="outline" size="sm" className="gap-1 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-revora-border bg-revora-surface p-12 text-center space-y-3">
          <ShoppingBag className="h-10 w-10 text-revora-muted mx-auto" />
          <p className="text-sm font-bold text-white">No products found</p>
          <p className="text-xs text-revora-muted">Try adjusting your search keywords or category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod, idx) => (
            <Card
              key={prod.id || prod.sku}
              className="border-revora-border bg-revora-surface hover:border-emerald-800/80 transition-all duration-200 flex flex-col justify-between overflow-hidden group rounded-2xl shadow-lg"
            >
              <div>
                <div className="aspect-square w-full bg-revora-bg relative overflow-hidden border-b border-revora-border">
                  <ProductImage
                    src={prod.image_url}
                    alt={prod.name}
                    category={prod.category}
                    priority={idx < 8}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    containerClassName="w-full h-full"
                  />
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="text-[11px] font-mono font-bold bg-revora-bg/90 border border-emerald-900/80 px-2 py-0.5 rounded text-emerald-400">
                      {formatCurrency(Number(prod.price))}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 z-10">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-revora-surface/90 text-revora-mint px-2 py-0.5 rounded border border-emerald-900/60">
                      {prod.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-revora-mint transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-[11px] text-revora-muted line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center gap-2">
                <Button
                  onClick={() => handleAddToCart(prod)}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-bold gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30"
                >
                  {addedIds[prod.id] ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-revora-mint" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </Button>
                <Link href={`/product/${prod.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-slate-300 hover:text-white border-revora-border"
                    title="View details"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reusable Interactive Shopping Assistant Modal */}
      <ShoppingAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onItemAdded={loadProducts}
      />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto py-16 text-center text-xs text-revora-muted">
        Loading catalog collection...
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
