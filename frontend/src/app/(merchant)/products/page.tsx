"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Search, Tag, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/products?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch merchant products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="border-b border-revora-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Product Catalog Management</h1>
          <p className="text-xs text-revora-muted mt-1">
            Authoritative database inventory, unit margins, and live stock levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="cyan">{products.length} Active Database Products</Badge>
          <Button
            onClick={fetchProducts}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-revora-border text-slate-300 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products by SKU, name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-revora-border bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-revora-cyan"
          />
        </div>
      </div>

      <Card className="p-5 border-revora-border bg-slate-900/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-revora-border text-slate-400">
              <tr>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Retail Price</th>
                <th className="pb-3">Cost Price</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-revora-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading authoritative product database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id || p.sku} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono text-slate-400">{p.sku}</td>
                    <td className="py-3 font-semibold text-white">{p.name}</td>
                    <td className="py-3 text-slate-300">{p.category}</td>
                    <td className="py-3 font-bold text-emerald-400">{formatCurrency(p.price)}</td>
                    <td className="py-3 text-slate-400">{formatCurrency(p.cost_price || p.cost || 0)}</td>
                    <td className="py-3 text-slate-300">{p.stock_quantity ?? p.stock ?? 0} units</td>
                    <td className="py-3 text-right">
                      <Badge variant="emerald">Active</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
