// Database row types (matching Supabase schema)

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

/** Article with its category/author joined in — what admin list views and the public site fetch. */
export interface ArticleWithRelations extends Article {
  category: Category | null;
  author: Author | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}
