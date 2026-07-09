"use client";

import { useRef, useState } from "react";
import { uploadServiceImage, validateImageFile } from "@/lib/admin/uploadImage";
import { t } from "@/lib/admin/strings";
import ImageFocalEditor from "@/components/admin/ui/ImageFocalEditor";
import { DEFAULT_FOCAL, SERVICE_CARD_FRAME, SERVICE_HERO_FRAME } from "@/lib/focalImage";

interface ServiceImagesUploaderProps {
  value: string[]; // ordered image URLs; first is the cover
  alt: string;
  onChange: (urls: string[]) => void;
  onAltChange: (alt: string) => void;
  focalX: number | null;
  focalY: number | null;
  focalZoom: number | null;
  onFocalChange: (focal: { focalX: number; focalY: number; focalZoom: number }) => void;
}

const INPUT_CLASS =
  "w-full px-3 py-2.5 border border-[#e8e5df] rounded-lg text-[#1a1a18] bg-[#fafaf8] placeholder:text-[#b8b0a4] focus:outline-none focus:ring-2 focus:ring-deep/20 focus:border-deep transition-colors disabled:opacity-50";

const LABEL_CLASS = "block text-sm font-medium text-[#1a1a18] mb-1.5";

const CHIP_BUTTON_CLASS =
  "text-xs font-medium px-2 py-1 rounded-md border border-[#e8e5df] bg-white/90 text-[#1a1a18] hover:bg-[#f5f3ef] transition-colors";

export default function ServiceImagesUploader({
  value,
  alt,
  onChange,
  onAltChange,
  focalX,
  focalY,
  focalZoom,
  onFocalChange,
}: ServiceImagesUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  // Upload one or more files sequentially, appending each URL as it lands.
  const handleFiles = async (files: File[]) => {
    setError(null);
    setUploading(true);
    let next = value;
    try {
      for (const file of files) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }
        const hadNoCoverBefore = next.length === 0;
        const { url } = await uploadServiceImage(file);
        next = [...next, url];
        onChange(next);
        if (hadNoCoverBefore) {
          onFocalChange({ ...DEFAULT_FOCAL });
        }
      }
    } catch {
      setError(t.serviceEditor.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // reset so re-picking the same file re-triggers change
    if (files.length) void handleFiles(files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!uploading) setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length) void handleFiles(files);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) {
      e.preventDefault();
      void handleFiles(files);
    }
  };

  const onZoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const removeAt = (index: number) => {
    setError(null);
    const wasCover = index === 0;
    onChange(value.filter((_, i) => i !== index));
    if (wasCover) onFocalChange({ ...DEFAULT_FOCAL });
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    const reordered = [...value];
    const [picked] = reordered.splice(index, 1);
    reordered.unshift(picked);
    onChange(reordered);
    onFocalChange({ ...DEFAULT_FOCAL });
  };

  return (
    <div
      className="space-y-3"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onPaste={onPaste}
    >
      <span className={LABEL_CLASS}>{t.serviceEditor.images}</span>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative rounded-xl border border-[#e8e5df] bg-[#fafaf8] p-2"
            >
              {index === 0 && (
                <span className="absolute top-3 left-3 z-10 text-[10px] font-semibold uppercase tracking-wider bg-deep text-white px-2 py-0.5 rounded-full">
                  {t.serviceEditor.coverBadge}
                </span>
              )}
              {index === 0 ? (
                <ImageFocalEditor
                  key={url}
                  imageUrl={url}
                  alt={alt}
                  focalX={focalX}
                  focalY={focalY}
                  focalZoom={focalZoom}
                  onChange={onFocalChange}
                  referenceFrame={SERVICE_CARD_FRAME}
                  mirrorFrames={[SERVICE_HERO_FRAME]}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  className="h-28 w-full rounded-lg object-cover"
                />
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(index)}
                    className={CHIP_BUTTON_CLASS}
                  >
                    {t.serviceEditor.makeCover}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className={`${CHIP_BUTTON_CLASS} text-red-600 hover:bg-red-50 hover:border-red-200`}
                >
                  {t.serviceEditor.remove}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={onZoneKeyDown}
        aria-disabled={uploading}
        className={`flex flex-col items-center justify-center gap-2 w-full min-h-[120px] px-4 py-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-deep/20 ${
          dragActive
            ? "border-deep bg-deep/5"
            : "border-[#e8e5df] bg-[#fafaf8] hover:bg-[#f5f3ef]"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        {uploading ? (
          <>
            <span
              aria-hidden="true"
              className="inline-block w-5 h-5 border-2 border-[#e8e5df] border-t-deep rounded-full animate-spin"
            />
            <span className="text-sm text-[#6b6560]">
              {t.serviceEditor.uploading}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-[#1a1a18]">
              {t.serviceEditor.addImage}
            </span>
            <span className="text-xs text-[#6b6560]">
              {t.serviceEditor.imagesHint}
            </span>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onInputChange}
        className="hidden"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label htmlFor="service-image-alt" className={LABEL_CLASS}>
          {t.serviceEditor.imageAlt}
        </label>
        <input
          id="service-image-alt"
          type="text"
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder={t.serviceEditor.imageAltPlaceholder}
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}
