"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isAuthorPublic } from "@/lib/authorVisibility";
import { uploadAuthorAvatar, validateImageFile } from "@/lib/admin/uploadImage";
import AdminInput from "@/components/admin/ui/AdminInput";
import AdminTextarea from "@/components/admin/ui/AdminTextarea";
import Toast from "@/components/admin/ui/Toast";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import { t } from "@/lib/admin/strings";
import type { Author } from "@/types";

interface AuthorEditorFormProps {
  initialData?: Author;
}

export default function AuthorEditorForm({
  initialData,
}: AuthorEditorFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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
  const willBePublic = isAuthorPublic({ bio: bio.trim() || null });

  async function handleAvatarFile(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setToast({ message: validationError, type: "error" });
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadAuthorAvatar(file);
      setAvatarUrl(url);
      markDirty();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t.authorEditor.uploadError;
      setToast({ message, type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    if (!name.trim()) {
      setNameError(t.authorEditor.nameRequired);
      setToast({ message: t.authorEditor.nameRequired, type: "error" });
      return;
    }
    setNameError(null);
    setSaving(true);

    // No updated_at column on `authors` (migration 0003) — don't invent one.
    const record = {
      name: name.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    };

    try {
      if (initialData) {
        const { error } = await supabase
          .from("authors")
          .update(record)
          .eq("id", initialData.id);
        if (error) throw error;
        setDirty(false);
        setToast({ message: t.authorEditor.toastSaved, type: "success" });
        router.refresh();
      } else {
        const { data, error } = await supabase
          .from("authors")
          .insert(record)
          .select("id")
          .single();
        if (error) throw error;
        setDirty(false);
        setToast({ message: t.authorEditor.toastCreated, type: "success" });
        router.replace(`/admin/autores/${data.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t.authorEditor.toastError;
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialData) return;
    setDeleting(true);
    try {
      // articles.author_id has no ON DELETE rule (migration 0004), so deleting a
      // byline that is in use raises a raw FK error. Count first and say so in
      // Spanish instead of surfacing "violates foreign key constraint".
      const { count, error: countError } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("author_id", initialData.id);
      if (countError) throw countError;

      if (count && count > 0) {
        setToast({
          message:
            count === 1
              ? t.authorEditor.deleteBlockedOne
              : t.authorEditor.deleteBlocked.replace("{n}", String(count)),
          type: "error",
        });
        setDeleting(false);
        setShowDelete(false);
        return;
      }

      const { error } = await supabase
        .from("authors")
        .delete()
        .eq("id", initialData.id);
      if (error) throw error;
      setDirty(false);
      router.replace("/admin/autores");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t.authorEditor.toastDeleteFailed;
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
        title={t.authorEditor.confirmDeleteTitle}
        message={t.authorEditor.confirmDeleteMessage}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/autores"
          className="text-sm text-[#6b6560] hover:text-[#1a1a18] transition-colors"
        >
          &larr; {t.authorEditor.backToAuthors}
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
        {/* Avatar */}
        <div>
          <span className="block text-sm font-medium text-[#1a1a18] mb-1.5">
            {t.authorEditor.avatar}
          </span>
          <div className="flex items-center gap-4 md:block">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-28 h-28 object-cover rounded-full border border-[#e8e5df]"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#f5f3ef] border border-dashed border-[#e8e5df] flex items-center justify-center text-sm text-[#b8b0a4]">
                &mdash;
              </div>
            )}
            <div className="md:mt-3 space-y-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="block text-sm font-medium px-4 py-2 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50"
              >
                {uploading
                  ? t.authorEditor.avatarUploading
                  : t.authorEditor.avatarUpload}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl("");
                    markDirty();
                  }}
                  className="block text-sm text-[#6b6560] hover:text-red-600 transition-colors"
                >
                  {t.authorEditor.avatarRemove}
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 max-w-[14rem] text-xs text-[#b8b0a4]">
            {t.authorEditor.avatarHint}
          </p>
        </div>

        {/* Name + bio */}
        <div className="space-y-4">
          <div>
            <AdminInput
              label={t.authorEditor.name}
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markDirty();
              }}
              placeholder={t.authorEditor.namePlaceholder}
              required
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600">{nameError}</p>
            )}
          </div>

          <div>
            <AdminTextarea
              label={t.authorEditor.bio}
              id="bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                markDirty();
              }}
              placeholder={t.authorEditor.bioPlaceholder}
              rows={4}
            />
            {/* The public grid hides placeholder bios — see lib/authorVisibility.ts. */}
            <p
              className={`mt-1 text-xs ${
                willBePublic ? "text-[#6b6560]" : "text-[#b8860b]"
              }`}
            >
              {willBePublic
                ? t.authorEditor.visibilityVisible
                : t.authorEditor.visibilityHidden}
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || uploading || !name.trim()}
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50"
        >
          {saving ? t.common.saving : t.common.save}
        </button>
        {initialData && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            {t.authorEditor.deleteAuthor}
          </button>
        )}
      </div>
    </div>
  );
}
