"use client";

import { useState } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  id?: string;
  placeholder?: string;
}

export default function TagInput({
  value,
  onChange,
  label = "Etiquetas",
  id,
  placeholder = "Añade una etiqueta y pulsa Enter",
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    const exists = value.some(
      (t) => t.toLowerCase() === tag.toLowerCase(),
    );
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (draft.trim()) addTag(draft);
  };

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#1a1a18] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-1.5 border border-[#e8e5df] rounded-lg bg-[#fafaf8] px-2 py-1.5 transition-colors focus-within:ring-2 focus-within:ring-deep/20 focus-within:border-deep">
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#f6e7f6] text-[#382a44]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              aria-label={`Quitar etiqueta ${tag}`}
              className="text-[#382a44]/60 hover:text-[#382a44] focus:outline-none leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[8rem] bg-transparent border-none px-1 py-0.5 text-[#1a1a18] placeholder:text-[#b8b0a4] focus:outline-none"
        />
      </div>
    </div>
  );
}
