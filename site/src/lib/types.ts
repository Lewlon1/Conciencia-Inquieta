// Mirrors types/index.ts in the admin app. Duplicated rather than shared —
// the admin (Next.js, repo root) and this site (Astro, site/) are two
// independently deployable projects against the same Supabase schema.

export interface Category {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface Author {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  content: string | null;
  category_id: string | null;
  tags: string[];
  author_id: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  is_published: boolean;
  published_at: string | null;
  reading_time_min: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleWithRelations extends Article {
  category: Category | null;
  author: Author | null;
}
