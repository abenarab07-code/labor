import raw from "./blog-articles.json";

export type BlogFaq = { question: string; answer: string };

export type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  tags: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  publishedAt: string;
  updatedAt: string;
  author: string;
  reviewer: string;
  reviewStatus: string;
  coverImage: string;
  coverImageAlt: string;
  readingTime: string;
  relatedArticleSlugs: string[];
  relatedServiceSlug: string;
  faq: BlogFaq[];
  articleBody: string;
};

export const blogArticles: BlogArticle[] = raw as BlogArticle[];

export const SITE_URL = "https://sourire-studio.lovable.app";

/**
 * Map external "service slug" recommendations from the SEO package
 * to actual routes in this project (which uses /soins#anchor).
 */
const SERVICE_ROUTE_MAP: Record<string, { href: string; label: string }> = {
  "/services/consultation-dentaire": { href: "/soins#consultation", label: "Consultation" },
  "/services/urgences-dentaires": { href: "/soins#urgences", label: "Urgences dentaires" },
  "/services/detartrage-soins-des-gencives": { href: "/soins#detartrage", label: "Détartrage" },
  "/services/blanchiment-dentaire": { href: "/soins#blanchiment", label: "Blanchiment dentaire" },
  "/services/facettes-dentaires": { href: "/soins#facettes", label: "Facettes" },
  "/services/couronnes-dentaires": { href: "/soins#protheses", label: "Couronnes et prothèses" },
  "/services/implants-dentaires": { href: "/soins#implantologie", label: "Implants dentaires" },
  "/services/orthodontie-aligneurs": { href: "/soins#aligneurs", label: "Aligneurs et orthodontie" },
};

export function resolveServiceLink(slug: string): { href: string; label: string } {
  return SERVICE_ROUTE_MAP[slug] ?? { href: "/soins", label: "Nos soins" };
}

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((a) => a.slug === slug);
}

export function getRelatedArticles(slugs: string[]): BlogArticle[] {
  return slugs.map((s) => getArticleBySlug(s)).filter(Boolean) as BlogArticle[];
}

export function formatFrDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
