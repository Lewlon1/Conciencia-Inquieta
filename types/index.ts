// Database row types (matching Supabase schema)

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  pillar: "Decode" | "Reframe" | "Navigate" | "Align" | null;
  featured_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  reading_time_min: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}
