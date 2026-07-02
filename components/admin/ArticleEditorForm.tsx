"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import type { Article, Category, Author } from "@/types";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import AdminSelect from "@/components/admin/ui/AdminSelect";
import AdminToggle from "@/components/admin/ui/AdminToggle";
import Toast from "@/components/admin/ui/Toast";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function calcReadingTime(content: string | null) {
  return Math.max(
    1,
    Math.ceil((content || "").split(/\s+/).filter(Boolean).length / 200)
  );
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function tagsToInput(tags: string[]) {
  return tags.join(", ");
}

function inputToTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

interface ArticleEditorFormProps {
  initialData?: Article;
  categories: Category[];
  authors: Author[];
}

export default function ArticleEditorForm({
  initialData,
  categories,
  authors,
}: ArticleEditorFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id ?? ""
  );
  const [authorId, setAuthorId] = useState(initialData?.author_id ?? "");
  const [tagsInput, setTagsInput] = useState(
    tagsToInput(initialData?.tags ?? [])
  );
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    initialData?.featured_image_url ?? ""
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState(
    initialData?.featured_image_alt ?? ""
  );
  const [isPublished, setIsPublished] = useState(
    initialData?.is_published ?? false
  );
  const [publishedAt, setPublishedAt] = useState(
    toLocalDatetime(initialData?.published_at ?? null)
  );
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initialData?.meta_description ?? ""
  );

  const [slugEdited, setSlugEdited] = useState(!!initialData);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const readingTime = calcReadingTime(content);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited) {
      setSlug(generateSlug(title));
    }
  }, [title, slugEdited]);

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlugEdited(true);
      setSlug(e.target.value);
    },
    []
  );

  const handlePublishedToggle = useCallback(
    (checked: boolean) => {
      setIsPublished(checked);
      if (checked && !publishedAt) {
        setPublishedAt(toLocalDatetime(new Date().toISOString()));
      }
    },
    [publishedAt]
  );

  async function save(publish?: boolean) {
    setSaving(true);

    const shouldPublish = publish ?? isPublished;
    let finalPublishedAt = publishedAt || null;
    if (publish && !publishedAt) {
      const now = toLocalDatetime(new Date().toISOString());
      setPublishedAt(now);
      finalPublishedAt = now;
    }

    const record = {
      title,
      slug,
      subtitle: subtitle || null,
      content: content || null,
      category_id: categoryId || null,
      author_id: authorId || null,
      tags: inputToTags(tagsInput),
      featured_image_url: featuredImageUrl || null,
      featured_image_alt: featuredImageAlt || null,
      is_published: shouldPublish,
      published_at: finalPublishedAt
        ? new Date(finalPublishedAt).toISOString()
        : null,
      reading_time_min: readingTime,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
    };

    if (publish) {
      setIsPublished(true);
    }

    try {
      if (initialData) {
        const { error } = await supabase
          .from("articles")
          .update(record)
          .eq("id", initialData.id);
        if (error) throw error;
        setToast({ message: "Article saved successfully", type: "success" });
      } else {
        const { data, error } = await supabase
          .from("articles")
          .insert(record)
          .select("id")
          .single();
        if (error) throw error;
        setToast({ message: "Article created successfully", type: "success" });
        router.replace(`/admin/articles/${data.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", initialData.id);
      if (error) throw error;
      router.replace("/admin/articles");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete article";
      setToast({ message, type: "error" });
      setDeleting(false);
      setShowDelete(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={showDelete}
        title="Delete article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/articles"
          className="text-sm text-[#6b6560] hover:text-[#1a1a18] transition-colors"
        >
          &larr; Articles
        </Link>
      </div>

      {/* Title & slug */}
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          className="w-full text-2xl font-heading text-[#1a1a18] bg-transparent border-0 border-b border-[#e8e5df] pb-2 focus:outline-none focus:border-[#1a1a18] transition-colors placeholder:text-[#b8b0a4]"
        />
        <div className="flex items-center gap-1 text-sm text-[#6b6560]">
          <span>/articulos/</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="article-slug"
            className="bg-transparent border-0 text-sm text-[#1a1a18] focus:outline-none placeholder:text-[#b8b0a4]"
          />
        </div>
      </div>

      {/* Subtitle / deck */}
      <AdminTextarea
        label="Subtitle / deck"
        id="subtitle"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="One or two sentences — shown under the title and as the card teaser"
        rows={2}
      />

      {/* Category + author + reading time */}
      <div className="grid sm:grid-cols-3 gap-4 items-end">
        <AdminSelect
          label="Category"
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Select a category"
          required
          options={categories
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((c) => ({ value: c.id, label: c.name }))}
        />
        <AdminSelect
          label="Author"
          id="author"
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          placeholder="Select an author"
          options={authors.map((a) => ({ value: a.id, label: a.name }))}
        />
        <div className="pb-2.5 text-sm text-[#6b6560]">
          {readingTime} min read
        </div>
      </div>

      {/* Tags */}
      <AdminInput
        label="Tags"
        id="tags"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="cuidados, economía feminista, comunidad (comma-separated)"
      />

      {/* Featured image */}
      <div className="grid sm:grid-cols-2 gap-4">
        <AdminInput
          label="Featured image URL"
          id="featured_image_url"
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
          placeholder="https://…"
        />
        <AdminInput
          label="Featured image alt text"
          id="featured_image_alt"
          value={featuredImageAlt}
          onChange={(e) => setFeaturedImageAlt(e.target.value)}
          placeholder="Describe the image for screen readers"
        />
      </div>

      {/* Split-pane markdown editor */}
      <div>
        <label className="block text-sm font-medium text-[#1a1a18] mb-1.5">
          Content
        </label>
        <div className="grid grid-cols-2 border border-[#e8e5df] rounded-xl overflow-hidden min-h-[500px]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the article in Markdown..."
            className="font-mono text-sm p-4 bg-[#fafaf8] resize-none h-full border-r border-[#e8e5df] focus:outline-none placeholder:text-[#b8b0a4]"
          />
          <div className="bg-[#0a1628] p-6 overflow-y-auto">
            <div className="prose prose-invert prose-lg max-w-none">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">
                  Preview will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEO section */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-[#1a1a18]">SEO</h3>
        <AdminInput
          label="Meta title"
          id="meta_title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="Custom page title for search engines"
        />
        <AdminTextarea
          label="Meta description"
          id="meta_description"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="Short description for search results"
          rows={2}
        />
      </div>

      {/* Publishing controls */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-[#1a1a18]">Publishing</h3>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <AdminToggle
            label="Published"
            checked={isPublished}
            onChange={handlePublishedToggle}
          />
          <AdminInput
            label="Publish date"
            id="published_at"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving || !title.trim()}
            className="text-sm font-medium px-5 py-2.5 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving || !title.trim()}
            className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Publish"}
          </button>
        </div>
        {initialData && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Delete article
          </button>
        )}
      </div>
    </div>
  );
}
