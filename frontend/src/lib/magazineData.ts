export interface MagazineStory {
  slug: string;
  issue: string;
  title: string;
  subtitle: string;
  deck: string;
  author: string;
  readTime: string;
  coverImage: string;
  accentColor: string;
  sections: {
    title: string;
    body: string[];
    quote?: string;
    image?: string;
  }[];
}

export const MAGAZINE_STORIES: MagazineStory[] = [
  {
    slug: "agentic-commerce-issue",
    issue: "Issue 01 &bull; August 2026",
    title: "The Agentic Commerce Issue: Autonomous AI in Athletic Retail",
    subtitle: "From passive catalog browsing to intelligent intent orchestration",
    deck: "A comprehensive investigation into how next-generation digital storefronts blend machine intelligence with deterministic inventory control to elevate the runner's journey.",
    author: "Revora Editorial Board",
    readTime: "8 min read",
    coverImage: "/images/magazine/agentic-commerce-issue.jpg",
    accentColor: "emerald",
    sections: [
      {
        title: "I. The Dawn of Goal-Oriented Shopping",
        body: [
          "The modern athlete does not think in product categories. When preparing for their first ultra-marathon, a runner does not search for 'polyester mesh containers'—they search for freedom from dehydration and muscle fatigue.",
          "Yet traditional retail interfaces force athletes to mentally translate their physical ambitions into database tags. Agentic commerce dissolves this barrier by interpreting natural athletic goals directly."
        ],
        quote: "The next great storefront is not a catalog; it is an intelligent companion that understands human performance.",
      },
      {
        title: "II. Deterministic Commerce at the Core",
        body: [
          "While generative models excel at conversational empathy, commerce demands mathematical certainty. Every price, stock quantity, and shipping promise must remain unshakeable.",
          "Revora AI balances these priorities through strict separation of concerns: language models discover customer intent, while deterministic transactional engines manage orders and payments."
        ],
        image: "/images/magazine/the-anatomy-of-a-marathon-bundle.jpg",
      },
    ],
  },
  {
    slug: "the-anatomy-of-a-marathon-bundle",
    issue: "Issue 01 &bull; August 2026",
    title: "The Anatomy of a Marathon Bundle: Speed, Hydration & Recovery",
    subtitle: "How complementary equipment systems boost athlete stamina and store AOV",
    deck: "Breaking down the exact gear ecosystem that powers 42.195 kilometers of endurance, and why smart cross-selling feels like expert coaching rather than an upsell.",
    author: "Elena Rostova",
    readTime: "6 min read",
    coverImage: "/images/magazine/the-anatomy-of-a-marathon-bundle.jpg",
    accentColor: "teal",
    sections: [
      {
        title: "I. The Three Pillars of Race Day",
        body: [
          "Running a marathon is an equipment symphony. Carbon-plated shoes deliver energetic propulsion, lightweight hydration packs maintain cellular balance, and graduated compression calf sleeves accelerate lactate clearance.",
          "When an e-commerce platform surfaces these essentials at the exact moment of decision, the shopper perceives genuine value rather than promotional noise."
        ],
        quote: "True commerce intelligence is offering the right runner the right hydration pack at the exact right moment.",
      },
    ],
  },
  {
    slug: "engineering-trust-in-fintech-checkouts",
    issue: "Issue 01 &bull; August 2026",
    title: "Engineering Trust: Real-Time Gateways and Safe Recovery",
    subtitle: "The architecture behind zero-friction payments and instant checkout preservation",
    deck: "Inside the backend machinery of Razorpay test payment integration, cryptographic webhook verification, and 1-click cart recovery tunnels.",
    author: "Alex Rivera",
    readTime: "7 min read",
    coverImage: "/images/magazine/engineering-trust-in-fintech-checkouts.jpg",
    accentColor: "emerald",
    sections: [
      {
        title: "I. The Frictionless Gateway",
        body: [
          "Payment friction is the silent killer of conversion. Every unnecessary input field and ambiguous redirect diminishes the customer's likelihood to finalize their purchase.",
          "By coupling Razorpay Test Mode with automated webhook state machines, merchants can simulate real payment lifecycles and build rock-solid recovery flows with complete peace of mind."
        ],
      },
    ],
  },
  {
    slug: "the-future-of-merchant-command-centers",
    issue: "Issue 01 &bull; August 2026",
    title: "The Future of Merchant Command Centers: Autonomous Governance",
    subtitle: "How modern store operators monitor AI decisions with complete safety and audit trails",
    deck: "Why giving AI autonomous growth powers requires a new class of merchant command centers built around safety thresholds and human-in-the-loop approvals.",
    author: "Marcus Vance",
    readTime: "5 min read",
    coverImage: "/images/magazine/the-future-of-merchant-command-centers.jpg",
    accentColor: "green",
    sections: [
      {
        title: "I. The Need for High-Visibility Control",
        body: [
          "Merchants want the revenue benefits of autonomous growth without the fear of erratic discounts or margin erosion.",
          "Revora's Merchant Control Center introduces real-time safety gating, approval queues, and immutable decision logging so store owners maintain 100% governance at all times."
        ],
      },
    ],
  },
];
