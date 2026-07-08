"use client";

import { useRef, useState } from "react";
import { uploadArticleImage } from "@/lib/admin/uploadImage";

interface MarkdownToolbarProps {
  value: string;
  onChange: (next: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const BTN_CLASS =
  "flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-[#e8e5df] px-1.5 text-[13px] font-semibold text-[#6b6560] transition-colors hover:bg-[#f5f3ef] focus:outline-none focus:ring-2 focus:ring-deep/20 disabled:cursor-not-allowed disabled:opacity-50";

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={BTN_CLASS}
    >
      {children}
    </button>
  );
}

function LinkIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4.5" cy="6" r="1.2" />
      <circle cx="4.5" cy="12" r="1.2" />
      <circle cx="4.5" cy="18" r="1.2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export default function MarkdownToolbar({
  value,
  onChange,
  textareaRef,
}: MarkdownToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Commit a new value, then restore focus + caret AFTER React re-renders the
  // controlled textarea (requestAnimationFrame fires past the commit/paint).
  const commit = (next: string, selStart: number, selEnd: number) => {
    onChange(next);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  };

  const getSelection = (): { start: number; end: number } | null => {
    const ta = textareaRef.current;
    if (!ta) return null;
    return { start: ta.selectionStart, end: ta.selectionEnd };
  };

  // Inline wrap: **bold**, *italic*, ...
  const applyInline = (marker: string, placeholder: string) => {
    const sel = getSelection();
    if (!sel) return;
    const { start, end } = sel;
    const selected = value.slice(start, end);
    const inner = selected || placeholder;
    const next = value.slice(0, start) + marker + inner + marker + value.slice(end);
    const innerStart = start + marker.length;
    commit(next, innerStart, innerStart + inner.length);
  };

  // Line prefix: "## ", "### ", "> ", "- " on every line the selection touches.
  const applyLinePrefix = (prefix: string) => {
    const sel = getSelection();
    if (!sel) return;
    const { start, end } = sel;
    const from = start - 1;
    const lineStart = from < 0 ? 0 : value.lastIndexOf("\n", from) + 1;
    const segment = value.slice(lineStart, end);
    const lines = segment.length > 0 ? segment.split("\n") : [""];
    const prefixed = lines.map((line) => prefix + line).join("\n");
    const next = value.slice(0, lineStart) + prefixed + value.slice(end);
    const added = prefix.length * lines.length;
    if (start === end) {
      const caret = end + added;
      commit(next, caret, caret);
    } else {
      commit(next, lineStart, end + added);
    }
  };

  // Link: [selección](url) with the caret dropped into the url slot.
  const applyLink = () => {
    const sel = getSelection();
    if (!sel) return;
    const { start, end } = sel;
    const selected = value.slice(start, end);
    if (selected) {
      const inserted = `[${selected}](url)`;
      const next = value.slice(0, start) + inserted + value.slice(end);
      // Position of "url": "[" + text + "](" => start + 1 + len + 2
      const urlStart = start + selected.length + 3;
      commit(next, urlStart, urlStart + 3);
    } else {
      const inserted = "[texto](url)";
      const next = value.slice(0, start) + inserted + value.slice(start);
      const textStart = start + 1; // just after "["
      commit(next, textStart, textStart + "texto".length);
    }
  };

  const openFilePicker = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  // Derive a friendly alt text from the file name (strip extension + separators).
  const deriveAlt = (fileName: string): string =>
    fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    input.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadArticleImage(file);
      const alt = deriveAlt(file.name);
      const inserted = `![${alt}](${url})`;
      // Read live values in case the editor typed while the upload was in flight.
      const ta = textareaRef.current;
      const base = ta ? ta.value : value;
      const insertAt = ta ? ta.selectionStart : base.length;
      const next = base.slice(0, insertAt) + inserted + base.slice(insertAt);
      const altStart = insertAt + 2; // just after "!["
      commit(next, altStart, altStart + alt.length);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo subir la imagen. Intenta de nuevo."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <ToolButton label="Negrita" onClick={() => applyInline("**", "texto")}>
        <span className="font-bold">B</span>
      </ToolButton>
      <ToolButton label="Cursiva" onClick={() => applyInline("*", "texto")}>
        <span className="font-serif italic">I</span>
      </ToolButton>
      <ToolButton label="Título" onClick={() => applyLinePrefix("## ")}>
        <span className="text-[11px] font-bold">H2</span>
      </ToolButton>
      <ToolButton label="Subtítulo" onClick={() => applyLinePrefix("### ")}>
        <span className="text-[11px] font-bold">H3</span>
      </ToolButton>
      <ToolButton label="Enlace" onClick={applyLink}>
        <LinkIcon />
      </ToolButton>
      <ToolButton label="Cita" onClick={() => applyLinePrefix("> ")}>
        <QuoteIcon />
      </ToolButton>
      <ToolButton label="Lista" onClick={() => applyLinePrefix("- ")}>
        <ListIcon />
      </ToolButton>
      <ToolButton
        label="Insertar imagen"
        onClick={openFilePicker}
        disabled={uploading}
      >
        <ImageIcon />
      </ToolButton>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {uploading && (
        <span className="ml-1 text-xs text-[#6b6560]" role="status">
          Subiendo imagen...
        </span>
      )}
      {error && (
        <span className="ml-1 text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
