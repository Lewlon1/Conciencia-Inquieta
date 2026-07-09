"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import ImageUploader from "@/components/admin/ui/ImageUploader";
import MarkdownToolbar from "@/components/admin/ui/MarkdownToolbar";
import TagInput from "@/components/admin/ui/TagInput";
import CharCounter from "@/components/admin/ui/CharCounter";
import SeoPreview from "@/components/admin/ui/SeoPreview";
import { t } from "@/lib/admin/strings";

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
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [authorId, setAuthorId] = useState(initialData?.author_id ?? "");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    initialData?.featured_image_url ?? ""
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState(
    initialData?.featured_image_alt ?? ""
  );
  const [focalX, setFocalX] = useState<number | null>(initialData?.focal_x ?? null);
  const [focalY, setFocalY] = useState<number | null>(initialData?.focal_y ?? null);
  const [focalZoom, setFocalZoom] = useState<number | null>(
    initialData?.focal_zoom ?? null
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
  const [errors, setErrors] = useState<{ title?: string; category?: string }>(
    {}
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readingTime = calcReadingTime(content);

  // ---- Unsaved-changes guard + local draft autosave ----
  // A snapshot of everything the editor holds; compared against the initial
  // snapshot to know when there are unsaved edits, and stashed in localStorage
  // so a crash / accidental navigation doesn't lose the work.
  const storageKey = `ci-admin-draft:${initialData?.id ?? "new"}`;
  const snapshot = JSON.stringify({
    title,
    slug,
    subtitle,
    content,
    categoryId,
    authorId,
    tags,
    featuredImageUrl,
    featuredImageAlt,
    focalX,
    focalY,
    focalZoom,
    isPublished,
    publishedAt,
    metaTitle,
    metaDescription,
  });

  const initialSnapshotRef = useRef<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState<string | null>(null);

  // Capture the baseline once on mount and surface any newer saved draft.
  useEffect(() => {
    initialSnapshotRef.current = snapshot;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && saved !== snapshot) setDraftAvailable(saved);
    } catch {
      /* localStorage unavailable — non-fatal */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark dirty whenever the form diverges from its baseline.
  useEffect(() => {
    if (initialSnapshotRef.current === null) return;
    setDirty(snapshot !== initialSnapshotRef.current);
  }, [snapshot]);

  // Debounced autosave while there are unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, snapshot);
      } catch {
        /* quota / unavailable — non-fatal */
      }
    }, 800);
    return () => clearTimeout(id);
  }, [dirty, snapshot, storageKey]);

  // Native browser warning if the tab is closed with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* non-fatal */
    }
  }, [storageKey]);

  function restoreDraft() {
    if (!draftAvailable) return;
    try {
      const d = JSON.parse(draftAvailable);
      setTitle(d.title ?? "");
      setSlug(d.slug ?? "");
      setSlugEdited(true);
      setSubtitle(d.subtitle ?? "");
      setContent(d.content ?? "");
      setCategoryId(d.categoryId ?? "");
      setAuthorId(d.authorId ?? "");
      setTags(Array.isArray(d.tags) ? d.tags : []);
      setFeaturedImageUrl(d.featuredImageUrl ?? "");
      setFeaturedImageAlt(d.featuredImageAlt ?? "");
      setFocalX(d.focalX ?? null);
      setFocalY(d.focalY ?? null);
      setFocalZoom(d.focalZoom ?? null);
      setIsPublished(!!d.isPublished);
      setPublishedAt(d.publishedAt ?? "");
      setMetaTitle(d.metaTitle ?? "");
      setMetaDescription(d.metaDescription ?? "");
    } catch {
      /* corrupt draft — ignore */
    }
    setDraftAvailable(null);
  }

  function discardDraft() {
    clearDraft();
    setDraftAvailable(null);
  }

  // Auto-generate slug from title until the slug is hand-edited.
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
    // Required-field validation (title + category) with inline feedback.
    const nextErrors: { title?: string; category?: string } = {};
    if (!title.trim()) nextErrors.title = t.editor.titleRequired;
    if (!categoryId) nextErrors.category = t.editor.categoryRequired;
    if (nextErrors.title || nextErrors.category) {
      setErrors(nextErrors);
      setToast({
        message: nextErrors.title ?? nextErrors.category!,
        type: "error",
      });
      return;
    }
    setErrors({});

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
      tags,
      featured_image_url: featuredImageUrl || null,
      featured_image_alt: featuredImageAlt || null,
      focal_x: focalX,
      focal_y: focalY,
      focal_zoom: focalZoom,
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
        clearDraft();
        initialSnapshotRef.current = snapshot;
        setDirty(false);
        setToast({ message: t.editor.toastSaved, type: "success" });
      } else {
        const { data, error } = await supabase
          .from("articles")
          .insert(record)
          .select("id")
          .single();
        if (error) throw error;
        clearDraft();
        setDirty(false);
        setToast({ message: t.editor.toastCreated, type: "success" });
        router.replace(`/admin/articles/${data.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.editor.toastError;
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
      clearDraft();
      router.replace("/admin/articles");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t.editor.toastDeleteFailed;
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
        title={t.editor.confirmDeleteTitle}
        message={t.editor.confirmDeleteMessage}
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
          &larr; {t.editor.backToArticles}
        </Link>
      </div>

      {/* Unsaved-draft restore banner */}
      {draftAvailable && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#fabb5c] bg-[#fff7e8] px-4 py-3 text-sm">
          <span className="text-[#7a5a1e]">{t.editor.restoreDraftPrompt}</span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={restoreDraft}
              className="font-medium text-[#1a1a18] underline"
            >
              {t.editor.restore}
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="text-[#6b6560] hover:text-[#1a1a18]"
            >
              {t.editor.discard}
            </button>
          </div>
        </div>
      )}

      {/* Title & slug */}
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.editor.titlePlaceholder}
          className="w-full text-2xl font-heading text-[#1a1a18] bg-transparent border-0 border-b border-[#e8e5df] pb-2 focus:outline-none focus:border-[#1a1a18] transition-colors placeholder:text-[#b8b0a4]"
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title}</p>
        )}
        <div className="flex items-center gap-1 text-sm text-[#6b6560]">
          <span>/articulos/</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder={t.editor.slugPlaceholder}
            className="bg-transparent border-0 text-sm text-[#1a1a18] focus:outline-none placeholder:text-[#b8b0a4]"
          />
        </div>
      </div>

      {/* Subtitle / deck */}
      <AdminTextarea
        label={t.editor.subtitle}
        id="subtitle"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder={t.editor.subtitlePlaceholder}
        rows={2}
      />

      {/* Category + author + reading time */}
      <div className="grid sm:grid-cols-3 gap-4 items-start">
        <div>
          <AdminSelect
            label={t.editor.category}
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder={t.editor.categoryPlaceholder}
            required
            options={categories
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((c) => ({ value: c.id, label: c.name }))}
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>
        <AdminSelect
          label={t.editor.author}
          id="author"
          value={authorId}
          onChange={(e) => setAuthorId(e.target.value)}
          placeholder={t.editor.authorPlaceholder}
          options={authors.map((a) => ({ value: a.id, label: a.name }))}
        />
        <div className="pt-9 text-sm text-[#6b6560]">
          {readingTime} {t.common.minRead}
        </div>
      </div>

      {/* Tags */}
      <TagInput
        label={t.editor.tags}
        id="tags"
        value={tags}
        onChange={setTags}
        placeholder={t.editor.tagsPlaceholder}
      />

      {/* Featured image */}
      <ImageUploader
        value={featuredImageUrl}
        alt={featuredImageAlt}
        onChange={(url) => {
          setFeaturedImageUrl(url);
          setFocalX(null);
          setFocalY(null);
          setFocalZoom(null);
        }}
        onAltChange={setFeaturedImageAlt}
        focalX={focalX}
        focalY={focalY}
        focalZoom={focalZoom}
        onFocalChange={({ focalX: x, focalY: y, focalZoom: z }) => {
          setFocalX(x);
          setFocalY(y);
          setFocalZoom(z);
        }}
        label={t.editor.featuredImage}
        altLabel={t.editor.featuredImageAlt}
      />

      {/* Split-pane markdown editor with formatting toolbar */}
      <div>
        <label className="block text-sm font-medium text-[#1a1a18] mb-1.5">
          {t.editor.content}
        </label>
        <div className="mb-2">
          <MarkdownToolbar
            value={content}
            onChange={setContent}
            textareaRef={textareaRef}
          />
        </div>
        <div className="grid grid-cols-2 border border-[#e8e5df] rounded-xl overflow-hidden min-h-[500px]">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.editor.contentPlaceholder}
            className="font-mono text-sm p-4 bg-[#fafaf8] resize-none h-full border-r border-[#e8e5df] focus:outline-none placeholder:text-[#b8b0a4]"
          />
          <div className="article-preview overflow-y-auto">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-[#b8b0a4] italic">{t.editor.previewEmpty}</p>
            )}
          </div>
        </div>
      </div>

      {/* SEO section */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-[#1a1a18]">{t.editor.seo}</h3>
        <div>
          <AdminInput
            label={t.editor.metaTitle}
            id="meta_title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder={t.editor.metaTitlePlaceholder}
          />
          <CharCounter value={metaTitle} max={60} />
        </div>
        <div>
          <AdminTextarea
            label={t.editor.metaDescription}
            id="meta_description"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder={t.editor.metaDescriptionPlaceholder}
            rows={2}
          />
          <CharCounter value={metaDescription} max={160} />
        </div>
        <SeoPreview
          title={metaTitle || title}
          description={metaDescription}
          slug={slug}
        />
      </div>

      {/* Publishing controls */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-[#1a1a18]">
          {t.editor.publishing}
        </h3>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <AdminToggle
            label={t.editor.published}
            checked={isPublished}
            onChange={handlePublishedToggle}
          />
          <AdminInput
            label={t.editor.publishDate}
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
            {saving ? t.common.saving : t.editor.saveDraft}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving || !title.trim()}
            className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50"
          >
            {saving ? t.common.saving : t.editor.publish}
          </button>
        </div>
        {initialData && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            {t.editor.deleteArticle}
          </button>
        )}
      </div>
    </div>
  );
}
