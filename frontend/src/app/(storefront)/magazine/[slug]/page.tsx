import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Compass, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MAGAZINE_STORIES } from "@/lib/magazineData";

export function generateStaticParams() {
  return MAGAZINE_STORIES.map((story) => ({
    slug: story.slug,
  }));
}

export default function MagazineStoryPage({ params }: { params: { slug: string } }) {
  const story = MAGAZINE_STORIES.find((s) => s.slug === params.slug);

  if (!story) {
    notFound();
  }

  return (
    <article className="space-y-12 max-w-4xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          href="/magazine"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-revora-mint transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Magazine</span>
        </Link>
      </div>

      {/* Story Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2">
          <Badge variant="mint" className="text-[10px] uppercase font-bold tracking-wider">
            {story.issue}
          </Badge>
          <span className="text-xs text-revora-muted font-mono">{story.readTime}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
          {story.title}
        </h1>

        <p className="text-base sm:text-lg text-emerald-300 font-medium">
          {story.subtitle}
        </p>

        <p className="text-xs sm:text-sm text-revora-muted leading-relaxed max-w-2xl mx-auto">
          {story.deck}
        </p>

        <div className="pt-2 text-xs text-slate-400 font-mono">
          Words by <strong className="text-white">{story.author}</strong>
        </div>
      </div>

      {/* Main Cover Photography */}
      <div className="rounded-3xl border border-emerald-800/60 overflow-hidden shadow-2xl aspect-[16/9] bg-revora-surface">
        <img
          src={story.coverImage}
          alt={story.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Story Content & Editorial Pullquotes */}
      <div className="space-y-12 text-slate-200 leading-relaxed text-sm sm:text-base max-w-3xl mx-auto">
        {story.sections.map((sec, idx) => (
          <div key={idx} className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-4">
              {sec.title}
            </h2>

            {sec.body.map((para, pIdx) => (
              <p key={pIdx} className="text-slate-300 leading-relaxed">
                {para}
              </p>
            ))}

            {sec.quote && (
              <div className="my-8 rounded-2xl border-l-4 border-emerald-400 bg-revora-surface/90 p-6 sm:p-8 space-y-2">
                <Quote className="h-6 w-6 text-emerald-400 opacity-60" />
                <p className="text-base sm:text-lg font-serif italic text-white leading-snug">
                  &ldquo;{sec.quote}&rdquo;
                </p>
              </div>
            )}

            {sec.image && (
              <div className="rounded-2xl border border-revora-border overflow-hidden my-6 aspect-[16/10]">
                <img
                  src={sec.image}
                  alt={sec.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Magazine Footer */}
      <div className="pt-12 border-t border-revora-border flex items-center justify-between text-xs">
        <Link href="/magazine" className="text-emerald-400 hover:text-revora-mint font-semibold flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Magazine Stories</span>
        </Link>
        <Link href="/catalog" className="text-revora-mint hover:text-white font-semibold">
          Shop Performance Gear &rarr;
        </Link>
      </div>
    </article>
  );
}
