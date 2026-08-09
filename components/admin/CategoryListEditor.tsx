"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Toast from "@/components/admin/ui/Toast";
import { t } from "@/lib/admin/strings";

/**
 * Rename + reorder the nine magazine sections. Deliberately NOT full CRUD:
 *
 * - No slug editing. The slug is the public URL (/categoria/<slug>) and the key
 *   `styleForCategory()` looks up in lib/categoryStyle.ts. Editing it would 404
 *   every existing link and share, so it renders as read-only text here.
 * - No create/delete. A new section needs a matching STYLES entry in
 *   lib/categoryStyle.ts (Tailwind only compiles shape classes it can see
 *   literally in source), so creating one is a code change —
 *   see docs/categorias-runbook.md.
 *
 * Renaming is safe by construction: the style lookup keys off slug, not name.
 */

interface EditableCategory {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  articleCount: number;
}

function normalise(name: string) {
  return name.trim().toLocaleLowerCase("es-ES");
}

export default function CategoryListEditor({
  initialCategories,
}: {
  initialCategories: EditableCategory[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [rows, setRows] = useState<EditableCategory[]>(initialCategories);
  const [saving, setSaving] = useState(false);
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

  const emptyNames = rows.some((r) => !r.name.trim());

  // Duplicate labels are legal in the DB but read as a bug in the sidebar.
  const duplicateIds = useMemo(() => {
    const seen = new Map<string, string>();
    const dupes = new Set<string>();
    for (const row of rows) {
      const key = normalise(row.name);
      if (!key) continue;
      const first = seen.get(key);
      if (first) {
        dupes.add(first);
        dupes.add(row.id);
      } else {
        seen.set(key, row.id);
      }
    }
    return dupes;
  }, [rows]);

  const invalid = emptyNames || duplicateIds.size > 0;

  function rename(id: string, name: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
    setDirty(true);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  async function save() {
    if (invalid) {
      setToast({
        message: emptyNames
          ? t.categories.nameRequired
          : t.categories.duplicateName,
        type: "error",
      });
      return;
    }
    setSaving(true);

    // Renumber the WHOLE set 1..N rather than only the moved rows: sort_order
    // has no unique constraint, so partial updates are how duplicate positions
    // (and non-deterministic public ordering) creep in.
    const payload = rows.map((row, index) => ({
      id: row.id,
      slug: row.slug,
      name: row.name.trim(),
      sort_order: index + 1,
    }));

    try {
      const { error } = await supabase.from("categories").upsert(payload);
      if (error) throw error;
      setRows((prev) =>
        prev.map((row, index) => ({
          ...row,
          name: row.name.trim(),
          sort_order: index + 1,
        }))
      );
      setDirty(false);
      setToast({ message: t.categories.toastSaved, type: "success" });
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t.categories.toastError;
      setToast({ message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-[#e8e5df] rounded-xl px-6 py-12 text-center">
        <p className="text-sm text-[#b8b0a4]">{t.categories.empty}</p>
      </div>
    );
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

      <p className="text-sm text-[#6b6560]">{t.categories.renameHint}</p>

      <div className="bg-white border border-[#e8e5df] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e8e5df] text-left">
              {[
                t.categories.tableOrder,
                t.categories.tableName,
                t.categories.tableUrl,
                t.categories.tableArticles,
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-xs font-medium text-[#6b6560] uppercase tracking-wider"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ede8]">
            {rows.map((row, index) => {
              const duplicate = duplicateIds.has(row.id);
              const empty = !row.name.trim();
              return (
                <tr key={row.id} className="hover:bg-[#f5f3ef] transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums text-[#6b6560] w-4">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`${t.categories.moveUp}: ${row.name}`}
                        className="p-1 rounded-md border border-[#e8e5df] text-[#6b6560] hover:bg-white hover:text-[#1a1a18] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === rows.length - 1}
                        aria-label={`${t.categories.moveDown}: ${row.name}`}
                        className="p-1 rounded-md border border-[#e8e5df] text-[#6b6560] hover:bg-white hover:text-[#1a1a18] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <label htmlFor={`category-${row.id}`} className="sr-only">
                      {t.categories.tableName}
                    </label>
                    <input
                      id={`category-${row.id}`}
                      type="text"
                      value={row.name}
                      maxLength={40}
                      onChange={(e) => rename(row.id, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm text-[#1a1a18] bg-[#fafaf8] focus:outline-none focus:ring-2 transition-colors ${
                        duplicate || empty
                          ? "border-red-400 focus:ring-red-200 focus:border-red-500"
                          : "border-[#e8e5df] focus:ring-deep/20 focus:border-deep"
                      }`}
                    />
                    {(duplicate || empty) && (
                      <p className="mt-1 text-xs text-red-600">
                        {empty
                          ? t.categories.nameRequired
                          : t.categories.duplicateName}
                      </p>
                    )}
                  </td>
                  {/* Read-only on purpose: the slug is the public URL. */}
                  <td className="px-6 py-4 align-top text-sm text-[#b8b0a4] font-mono whitespace-nowrap">
                    /categoria/{row.slug}
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-[#6b6560] whitespace-nowrap">
                    {row.articleCount === 1
                      ? t.categories.articlesOne
                      : t.categories.articlesOther.replace(
                          "{n}",
                          String(row.articleCount)
                        )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty || invalid}
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-deep text-white hover:bg-deep/90 transition-colors disabled:opacity-50"
        >
          {saving ? t.common.saving : t.categories.save}
        </button>
        {dirty && !saving && (
          <span className="text-sm text-[#b8860b]">
            {t.categories.unsavedWarning}
          </span>
        )}
      </div>

      {/* Without this the screen reads as half-built ("where is New?"). */}
      <div className="bg-[#fafaf8] border border-[#e8e5df] rounded-xl p-5">
        <h3 className="text-sm font-medium text-[#1a1a18] mb-1.5">
          {t.categories.newCategoryNoteTitle}
        </h3>
        <p className="text-sm text-[#6b6560] leading-relaxed">
          {t.categories.newCategoryNote}
        </p>
      </div>
    </div>
  );
}
