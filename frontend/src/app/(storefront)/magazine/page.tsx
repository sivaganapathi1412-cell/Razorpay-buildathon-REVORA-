import Link from "next/link";
import { Compass, Sparkles, ArrowRight, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MAGAZINE_STORIES } from "@/lib/magazineData";

export default function MagazineIndexPage() {
  const leadStory = MAGAZINE_STORIES[0];
  const otherStories = MAGAZINE_STORIES.slice(1);

  return (
    <div className="space-y-16 max-w-6xl mx-auto">
      {/* Magazine Masthead */}
      <div className="text-center space-y-4 pt-4 border-b border-revora-border pb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-revora-mint">
          <Compass className="h-3.5 w-3.5 text-emerald-400" />
          <span>Revora Magazine &bull; Issue 01 &bull; August 2026</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase font-sans">
          The Agentic Era
        </h1>

        <p className="text-xs sm:text-sm text-revora-muted max-w-xl mx-auto leading-relaxed">
          Editorial visual essays, athletic retail analysis, and the cultural shift toward autonomous goal-oriented commerce.
        </p>
      </div>

      {/* Lead Editorial Cover Story */}
      {leadStory && (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
            Cover Story &bull; {leadStory.issue}
          </span>
          <Link
            href={`/magazine/${leadStory.slug}`}
            className="group block rounded-3xl border border-emerald-800/60 bg-gradient-to-b from-revora-forest-deep via-revora-surface to-revora-bg overflow-hidden hover:border-emerald-500 transition-all shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 aspect-[16/10] overflow-hidden bg-revora-bg">
                <img
                  src={leadStory.coverImage}
                  alt={leadStory.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[320px]"
                />
              </div>
              <div className="lg:col-span-5 p-6 lg:p-10 space-y-4">
                <Badge variant="mint" className="text-[10px] uppercase font-bold">
                  Editorial Cover
                </Badge>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-revora-mint transition-colors leading-tight">
                  {leadStory.title}
                </h2>

                <p className="text-xs font-semibold text-emerald-300">
                  {leadStory.subtitle}
                </p>

                <p className="text-xs text-revora-muted leading-relaxed line-clamp-3">
                  {leadStory.deck}
                </p>

                <div className="pt-4 flex items-center justify-between border-t border-emerald-900/60 text-xs">
                  <span className="text-slate-400">{leadStory.author}</span>
                  <span className="font-bold text-revora-mint group-hover:text-white flex items-center gap-1">
                    Open Story &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Grid of Other Editorial Stories */}
      <div className="space-y-6">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
          Editorial Features
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {otherStories.map((story) => (
            <Link
              key={story.slug}
              href={`/magazine/${story.slug}`}
              className="group rounded-2xl border border-revora-border bg-revora-surface overflow-hidden hover:border-emerald-800/80 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                <div className="aspect-[16/10] w-full overflow-hidden bg-revora-bg relative">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                <div className="p-5 pt-0 space-y-2">
                  <div className="text-[10px] text-revora-muted font-mono">{story.readTime}</div>
                  <h3 className="text-sm font-bold text-white group-hover:text-revora-mint transition-colors line-clamp-2 leading-snug">
                    {story.title}
                  </h3>
                  <p className="text-xs text-revora-muted line-clamp-3 leading-relaxed">
                    {story.deck}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-revora-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-300">{story.author}</span>
                <span className="text-emerald-400 group-hover:text-revora-mint font-semibold">Read &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
