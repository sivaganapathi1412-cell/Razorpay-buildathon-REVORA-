"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Plus, Check, ArrowRight, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { addToCart } from "@/lib/cartService";
import { ProductImage } from "@/components/ui/ProductImage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ShoppingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onItemAdded?: () => void;
}

export function ShoppingAssistantModal({
  isOpen,
  onClose,
  initialPrompt,
  onItemAdded,
}: ShoppingAssistantModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      role: "assistant",
      content: "Hello! I am Revora AI. What gear or apparel are you looking for today? Tell me your training distance, budget, or race goal.",
      recommendations: [],
      suggested_prompts: [
        "Running shoes under ₹3,000",
        "Marathon hydration pack & bottles",
        "Breathable running socks & apparel",
        "Deep tissue recovery massage tools",
      ],
    },
  ]);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = (queryText || message).trim();
    if (!text) return;

    const userEntry = { role: "user", content: text };
    setChatHistory((prev) => [...prev, userEntry]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai-shopping/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply || "Here are matching recommendations from our live catalog:",
            recommendations: data.recommendations || [],
            suggested_prompts: data.suggested_prompts || [],
          },
        ]);
      } else {
        throw new Error("Failed to get AI recommendation");
      }
    } catch (err) {
      console.error("AI Assistant query error:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I searched our store catalog. Try browsing our active inventory by category:",
          recommendations: [],
          suggested_prompts: ["Running shoes under ₹3,000", "Hydration vest", "Massage gun"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product.id, 1, true);
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      if (onItemAdded) onItemAdded();
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to add product to cart:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-xl w-full max-h-[85vh] bg-revora-surface border-revora-border flex flex-col shadow-2xl overflow-hidden rounded-3xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-revora-border flex items-center justify-between bg-revora-bg/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/30 border border-emerald-700/50 flex items-center justify-center text-revora-mint">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Shop with Revora AI</h3>
              <span className="text-[10px] text-revora-muted">Conversational intent discovery &amp; catalog matching</span>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-revora-muted hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {chatHistory.map((item, idx) => (
            <div
              key={idx}
              className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2.5 ${
                  item.role === "user"
                    ? "bg-emerald-700 text-white shadow-md"
                    : "bg-revora-bg border border-revora-border text-slate-200 shadow-sm"
                }`}
              >
                <p className="leading-relaxed text-xs">{item.content}</p>

                {/* Recommendations Cards inside Chat */}
                {item.recommendations && item.recommendations.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {item.recommendations.map((rec: any) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-revora-surface border border-revora-border/80"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ProductImage
                            src={rec.image_url}
                            alt={rec.name}
                            className="h-full w-full object-cover"
                            containerClassName="h-11 w-11 rounded-lg bg-revora-bg shrink-0 border border-revora-border overflow-hidden"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-[11px] truncate">{rec.name}</h4>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">
                              {formatCurrency(Number(rec.price))}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(rec)}
                          variant="primary"
                          size="sm"
                          className="text-[10px] h-7 px-3 gap-1 shrink-0 font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          {addedIds[rec.id] ? (
                            <>
                              <Check className="h-3 w-3 text-revora-mint" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Prompts */}
                {item.suggested_prompts && item.suggested_prompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.suggested_prompts.map((p: string, pIdx: number) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(p)}
                        className="text-[10px] rounded-full border border-emerald-900/60 bg-revora-surface px-2.5 py-0.5 text-slate-300 hover:border-emerald-400 hover:text-revora-mint transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl p-3 bg-revora-bg border border-revora-border text-xs text-revora-muted flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                <span>Searching active database catalog...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-revora-border bg-revora-bg/60 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask e.g. 'I need running shoes under ₹3000'..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-xl border border-revora-border bg-revora-surface px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !message.trim()}
            variant="primary"
            size="sm"
            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
