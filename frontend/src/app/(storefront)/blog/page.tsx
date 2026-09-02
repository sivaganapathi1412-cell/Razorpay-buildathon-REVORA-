import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/lib/blogData";

export default function BlogIndexPage() {
  const featured = BLOG_POSTS[0];
  const rest = BLOG_POSTS.slice(1);

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Blog Hero Header */}
      <div className="rounded-3xl border border-revora-border bg-gradient-to-r from-revora-forest-deep via-revora-surface to-revora-bg p-8 sm:p-12 space-y-4 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-revora-mint">
          <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
          <span>Revora Engineering &amp; Commerce Research</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          The Commerce Intelligence Blog
        </h1>
        <p className="text-xs sm:text-sm text-revora-muted max-w-2xl leading-relaxed">
          Architectural deep-dives, fintech recovery strategies, and AI growth mechanics engineered for modern D2C commerce builders.
        </p>
      </div>

      {/* Featured Lead Post */}
      {featured && (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
            Featured Research
          </span>
          <Link
            href={`/blog/${featured.slug}`}
            className="group block rounded-3xl border border-revora-border bg-revora-surface overflow-hidden hover:border-emerald-700/60 transition-all shadow-xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto h-full w-full overflow-hidden bg-revora-bg">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[280px]"
                />
              </div>
              <div className="lg:col-span-5 p-6 lg:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="mint" className="text-[10px] uppercase font-bold">
                    {featured.category}
                  </Badge>
                  <span className="text-xs text-revora-muted flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    {featured.readTime}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-revora-mint transition-colors leading-tight">
                  {featured.title}
                </h2>

                <p className="text-xs sm:text-sm text-revora-muted leading-relaxed line-clamp-3">
                  {featured.excerpt}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-revora-border/60">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={featured.author.avatar}
                      alt={featured.author.name}
                      className="h-7 w-7 rounded-full object-cover border border-emerald-700/60"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-white block">{featured.author.name}</span>
                      <span className="text-revora-muted text-[10px]">{featured.author.role}</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-400 group-hover:text-revora-mint flex items-center gap-1">
                    Read Article &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Grid of Remaining 5 Posts */}
      <div className="space-y-6">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
          Latest Articles &bull; {rest.length} Publications
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-revora-border bg-revora-surface overflow-hidden hover:border-emerald-800/80 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3.5">
                <div className="aspect-[16/9] w-full overflow-hidden bg-revora-bg relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge variant="mint" className="text-[9px] uppercase font-bold">
                      {post.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-revora-muted font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{post.readTime}</span>
                    <span>&bull;</span>
                    <span>{post.date}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-revora-mint transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-revora-muted line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-revora-border/60 mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-300 font-medium">{post.author.name}</span>
                <span className="text-xs font-semibold text-emerald-400 group-hover:text-revora-mint flex items-center gap-1">
                  Read &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
