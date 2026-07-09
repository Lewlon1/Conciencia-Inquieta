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
  focal_x: number | null;
  focal_y: number | null;
  focal_zoom: number | null;
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

export interface Service {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  /** Optional, free-form price line ("Desde 50€", "Consultar"). */
  price_text: string | null;
  /** Gallery of image URLs; the first entry is the cover. */
  image_urls: string[];
  image_alt: string | null;
  /** Focal point/zoom for image_urls[0] (the cover). Resets when a different image is promoted to cover. */
  focal_x: number | null;
  focal_y: number | null;
  focal_zoom: number | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** A visitor's booking request captured from the public services page. */
export interface ServiceBooking {
  id: string;
  service_id: string | null;
  service_title: string | null;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}
