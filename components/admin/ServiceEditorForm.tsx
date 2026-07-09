"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/types";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import AdminToggle from "@/components/admin/ui/AdminToggle";
import Toast from "@/components/admin/ui/Toast";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import ServiceImagesUploader from "@/components/admin/ui/ServiceImagesUploader";
import { t } from "@/lib/admin/strings";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip NFD-decomposed accents ("Sesion")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ServiceEditorFormProps {
  initialData?: Service;
}

export default function ServiceEditorForm({
  initialData,
}: ServiceEditorFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [priceText, setPriceText] = useState(initialData?.price_text ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialData?.image_urls ?? []
  );
  const [imageAlt, setImageAlt] = useState(initialData?.image_alt ?? "");
  const [sortOrder, setSortOrder] = useState(
    String(initialData?.sort_order ?? 0)
  );
  const [isPublished, setIsPublished] = useState(
    initialData?.is_published ?? false
  );

  const [slugEdited, setSlugEdited] = useState(!!initialData);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Auto-generate slug from title until the slug is hand-edited.
  useEffect(() => {
    if (!slugEdited) setSlug(generateSlug(title));
  }, [title, slugEdited]);

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

  const markDirty = () => setDirty(true);

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlugEdited(true);
      setSlug(e.target.value);
      markDirty();
    },
    []
  );

  async function save(publish?: boolean) {
    if (!title.trim()) {
      setTitleError(t.serviceEditor.titleRequired);
      setToast({ message: t.serviceEditor.titleRequired, type: "error" });
      return;
    }
    setTitleError(null);
    setSaving(true);

    const shouldPublish = publish ?? isPublished;
    const parsedOrder = parseInt(sortOrder, 10);

    const record = {
      title: title.trim(),
      slug: slug || generateSlug(title),
      summary: summary || null,
      description: description || null,
      price_text: priceText.trim() || null,
      image_urls: imageUrls,
      image_alt: imageAlt.trim() || null,
      sort_order: Number.isFinite(parsedOrder) ? parsedOrder : 0,
      is_published: shouldPublish,
      updated_at: new Date().toISOString(),
    };

    if (publish) setIsPublished(true);

    try {
      if (initialData) {
        const { error } = await supabase
          .from("services")
          .update(record)
          .eq("id", initialData.id);
        if (error) throw error;
        setDirty(false);
        setToast({ message: t.serviceEditor.toastSaved, type: "success" });
      } else {
        const { data, error } = await supabase
          .from("services")
          .insert(record)
          .select("id")
          .single();
        if (error) throw error;
        setDirty(false);
        setToast({ message: t.serviceEditor.toastCreated, type: "success" });
        router.replace(`/admin/services/${data.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t.serviceEditor.toastError;
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
        .from("services")
        .delete()
        .eq("id", initialData.id);
      if (error) throw error;
      setDirty(false);
      router.replace("/admin/services");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t.serviceEditor.toastDeleteFailed;
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
        title={t.serviceEditor.confirmDeleteTitle}
        message={t.serviceEditor.confirmDeleteMessage}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/services"
          className="text-sm text-[#6b6560] hover:text-[#1a1a18] transition-colors"
        >
          &larr; {t.serviceEditor.backToServices}
        </Link>
      </div>

      {/* Title & slug */}
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          placeholder={t.serviceEditor.titlePlaceholder}
          className="w-full text-2xl font-heading text-[#1a1a18] bg-transparent border-0 border-b border-[#e8e5df] pb-2 focus:outline-none focus:border-[#1a1a18] transition-colors placeholder:text-[#b8b0a4]"
        />
        {titleError && <p className="text-sm text-red-600">{titleError}</p>}
        <div className="flex items-center gap-1 text-sm text-[#6b6560]">
          <span>/servicios/</span>
          <input
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder={t.serviceEditor.slugPlaceholder}
            className="bg-transparent border-0 text-sm text-[#1a1a18] focus:outline-none placeholder:text-[#b8b0a4]"
          />
        </div>
      </div>

      {/* Summary */}
      <AdminTextarea
        label={t.serviceEditor.summary}
        id="summary"
        value={summary}
        onChange={(e) => {
          setSummary(e.target.value);
          markDirty();
        }}
        placeholder={t.serviceEditor.summaryPlaceholder}
        rows={2}
      />

      {/* Price + sort order */}
      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <AdminInput
          label={t.serviceEditor.price}
          id="price_text"
          value={priceText}
          onChange={(e) => {
            setPriceText(e.target.value);
            markDirty();
          }}
          placeholder={t.serviceEditor.pricePlaceholder}
        />
        <div>
          <AdminInput
            label={t.serviceEditor.sortOrder}
            id="sort_order"
            type="number"
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              markDirty();
            }}
          />
          <p className="mt-1 text-xs text-[#b8b0a4]">
            {t.serviceEditor.sortOrderHint}
          </p>
        </div>
      </div>

      {/* Images */}
      <ServiceImagesUploader
        value={imageUrls}
        alt={imageAlt}
        onChange={(urls) => {
          setImageUrls(urls);
          markDirty();
        }}
        onAltChange={(alt) => {
          setImageAlt(alt);
          markDirty();
        }}
      />

      {/* Description with live preview */}
      <div>
        <label className="block text-sm font-medium text-[#1a1a18] mb-1.5">
          {t.serviceEditor.description}
        </label>
        <div className="grid md:grid-cols-2 border border-[#e8e5df] rounded-xl overflow-hidden min-h-[280px]">
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            placeholder={t.serviceEditor.descriptionPlaceholder}
            className="font-mono text-sm p-4 bg-[#fafaf8] resize-none h-full md:border-r border-[#e8e5df] focus:outline-none placeholder:text-[#b8b0a4] min-h-[200px]"
          />
          <div className="article-preview overflow-y-auto">
            {description ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {description}
              </ReactMarkdown>
            ) : (
              <p className="text-[#b8b0a4] italic p-4">
                {t.serviceEditor.descriptionPlaceholder}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Publishing controls */}
      <div className="bg-white border border-[#e8e5df] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[#1a1a18] mb-4">
          {t.serviceEditor.publishing}
        </h3>
        <AdminToggle
          label={t.serviceEditor.published}
          checked={isPublished}
          onChange={(checked) => {
            setIsPublished(checked);
            markDirty();
          }}
        />
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
            {saving ? t.common.saving : t.serviceEditor.saveDraft}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving || !title.trim()}
            className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50"
          >
            {saving ? t.common.saving : t.serviceEditor.publish}
          </button>
        </div>
        {initialData && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            {t.serviceEditor.deleteService}
          </button>
        )}
      </div>
    </div>
  );
}
