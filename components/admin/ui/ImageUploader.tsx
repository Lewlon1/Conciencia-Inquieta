"use client";

import { useId, useRef, useState } from "react";
import {
  uploadArticleImage,
  validateImageFile,
} from "@/lib/admin/uploadImage";
import ImageFocalEditor from "@/components/admin/ui/ImageFocalEditor";
import {
  ARTICLE_CARD_FRAME,
  ARTICLE_FEATURE_FRAME,
  ARTICLE_HERO_FRAME,
} from "@/lib/focalImage";

interface ImageUploaderProps {
  value: string; // current featured_image_url ("" if none)
  alt: string; // current featured_image_alt
  onChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  focalX: number | null;
  focalY: number | null;
  focalZoom: number | null;
  onFocalChange: (focal: { focalX: number; focalY: number; focalZoom: number }) => void;
  label?: string; // defaults to "Imagen destacada"
  altLabel?: string; // defaults to "Texto alternativo de la imagen"
}

const INPUT_CLASS =
  "w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-[#1a1a18] bg-[#fafaf8] placeholder:text-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors disabled:opacity-50";

const LABEL_CLASS = "block text-sm font-medium text-[#1a1a18] mb-1.5";

const SMALL_BUTTON_CLASS =
  "text-sm font-medium px-4 py-2 rounded-lg border border-[#e8e5df] text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors disabled:opacity-50";

function suggestAltFromFilename(filename: string): string {
  return filename
    .replace(/\.[^./\\]+$/, "") // strip extension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ImageUploader({
  value,
  alt,
  onChange,
  onAltChange,
  focalX,
  focalY,
  focalZoom,
  onFocalChange,
  label = "Imagen destacada",
  altLabel = "Texto alternativo de la imagen",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const altId = useId();
  const urlId = useId();

  const openPicker = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadArticleImage(file);
      onChange(url);
      if (!alt.trim()) {
        const suggested = suggestAltFromFilename(file.name);
        if (suggested) {
          onAltChange(suggested);
        }
      }
    } catch {
      setError("No se pudo subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again re-triggers change.
    e.target.value = "";
    if (file) {
      void handleFile(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!uploading) {
      setDragActive(true);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (uploading) {
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (uploading) {
      return;
    }
    const items = e.clipboardData?.items;
    if (!items) {
      return;
    }
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void handleFile(file);
          return;
        }
      }
    }
  };

  const onZoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const spinner = (
    <span
      aria-hidden="true"
      className="inline-block w-5 h-5 border-2 border-[#e8e5df] border-t-deep rounded-full animate-spin"
    />
  );

  return (
    <div
      className="space-y-3"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onPaste={onPaste}
    >
      <span className={LABEL_CLASS}>{label}</span>

      {uploading ? (
        <div className="flex flex-col items-center justify-center gap-2 w-full min-h-[160px] px-4 py-8 border-2 border-dashed border-[#e8e5df] rounded-xl bg-[#fafaf8] text-center">
          {spinner}
          <span className="text-sm text-[#6b6560]">Subiendo...</span>
        </div>
      ) : value ? (
        <div
          tabIndex={0}
          className="rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-3 focus:outline-none focus:ring-2 focus:ring-deep/20"
        >
          <ImageFocalEditor
            key={value}
            imageUrl={value}
            alt={alt}
            focalX={focalX}
            focalY={focalY}
            focalZoom={focalZoom}
            onChange={onFocalChange}
            referenceFrame={ARTICLE_HERO_FRAME}
            mirrorFrames={[ARTICLE_CARD_FRAME, ARTICLE_FEATURE_FRAME]}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={openPicker}
              className={SMALL_BUTTON_CLASS}
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                onChange("");
              }}
              className={`${SMALL_BUTTON_CLASS} text-red-600 hover:bg-red-50 hover:border-red-200`}
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={onZoneKeyDown}
          className={`flex flex-col items-center justify-center gap-2 w-full min-h-[160px] px-4 py-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-deep/20 ${
            dragActive
              ? "border-deep bg-deep/5"
              : "border-[#e8e5df] bg-[#fafaf8] hover:bg-[#f5f3ef]"
          }`}
        >
          <span className="text-sm font-medium text-[#1a1a18]">
            Arrastra una imagen o haz clic para seleccionar
          </span>
          <span className="text-xs text-[#6b6560]">
            También puedes pegar una imagen (Ctrl/Cmd + V). JPG, PNG, WebP o GIF · máx. 10 MB
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="text-xs font-medium text-[#6b6560] hover:text-[#1a1a18] transition-colors"
        >
          {showUrlInput ? "Ocultar campo de URL" : "…o pega una URL"}
        </button>
        {showUrlInput && (
          <input
            id={urlId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className={`${INPUT_CLASS} mt-1.5`}
          />
        )}
      </div>

      <div>
        <label htmlFor={altId} className={LABEL_CLASS}>
          {altLabel}
        </label>
        <input
          id={altId}
          type="text"
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Describe la imagen para lectores de pantalla"
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}
