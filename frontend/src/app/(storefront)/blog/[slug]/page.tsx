import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, Share2, Sparkles, CheckCircle2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BLOG_POSTS } from "@/lib/blogData";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article className="space-y-12 max-w-4xl mx-auto">
      {/* Navigation and Category */}
      <div className="space-y-4">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-revora-mint transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to all articles</span>
        </Link>

        <div className="flex items-center gap-3">
          <Badge variant="mint" className="text-[10px] uppercase font-bold">
            {post.category}
          </Badge>
          <span className="text-xs text-revora-muted flex items-center gap-1 font-mono">
            <Clock className="h-3.5 w-3.5" />
            {post.readTime}
          </span>
          <span className="text-xs text-revora-muted flex items-center gap-1 font-mono">
            <Calendar className="h-3.5 w-3.5" />
            {post.date}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          {post.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
          {post.excerpt}
        </p>

        {/* Author Details Bar */}
        <div className="flex items-center justify-between border-t border-b border-revora-border py-4">
          <div className="flex items-center gap-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-10 w-10 rounded-full object-cover border border-emerald-700/60"
            />
            <div>
              <span className="font-bold text-white text-xs block">{post.author.name}</span>
              <span className="text-revora-muted text-[11px]">{post.author.role}</span>
            </div>
          </div>
          <div className="text-xs text-revora-muted">
            Revora Engineering Research
          </div>
        </div>
      </div>

      {/* Main Hero Image */}
      <div className="rounded-3xl border border-revora-border overflow-hidden bg-revora-surface shadow-2xl aspect-[16/9]">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Content */}
      <div className="space-y-10 text-slate-200 leading-relaxed text-sm sm:text-base">
        {post.content.map((section, idx) => (
          <section key={idx} className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-2">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, pIdx) => (
              <p key={pIdx} className="text-slate-300 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}

        {/* Key Takeaways Box */}
        <Card className="rounded-2xl border-emerald-800/60 bg-emerald-950/30 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-revora-mint font-bold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Key Takeaways for Commerce Operators</span>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
            {post.keyTakeaways.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Related Reading Footer */}
      <div className="pt-12 border-t border-revora-border space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">More Commerce Intelligence</h3>
          <Link href="/blog" className="text-xs text-emerald-400 hover:text-revora-mint font-semibold">
            View all articles &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {related.map((rel) => (
            <Link
              key={rel.slug}
              href={`/blog/${rel.slug}`}
              className="group rounded-2xl border border-revora-border bg-revora-surface p-5 hover:border-emerald-800/80 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">{rel.category}</span>
                <h4 className="text-xs font-bold text-white group-hover:text-revora-mint transition-colors line-clamp-2">
                  {rel.title}
                </h4>
              </div>
              <span className="text-[11px] text-revora-muted pt-3 flex items-center justify-between">
                <span>{rel.readTime}</span>
                <span className="text-emerald-400 font-semibold group-hover:text-revora-mint">Read &rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
