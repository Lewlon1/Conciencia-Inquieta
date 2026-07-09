"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeFocalStyle,
  DEFAULT_FOCAL,
  MAX_ZOOM,
  MIN_ZOOM,
  type FrameSpec,
} from "@/lib/focalImage";

const DISPLAY_WIDTH = 320; // px — fixed width the reference image is shown at while editing
const MIRROR_WIDTH = 150; // px — fixed width of each read-only mirror tile

interface ImageFocalEditorProps {
  imageUrl: string;
  alt: string;
  focalX: number | null;
  focalY: number | null;
  focalZoom: number | null;
  onChange: (focal: { focalX: number; focalY: number; focalZoom: number }) => void;
  referenceFrame: FrameSpec;
  mirrorFrames: FrameSpec[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizePercent(value: number | null | undefined, fallback: number): number {
  if (value == null || Number.isNaN(value)) return fallback;
  return clamp(value, 0, 100);
}

function sanitizeZoom(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return DEFAULT_FOCAL.focalZoom;
  return clamp(value, MIN_ZOOM, MAX_ZOOM);
}

export default function ImageFocalEditor({
  imageUrl,
  alt,
  focalX,
  focalY,
  focalZoom,
  onChange,
  referenceFrame,
  mirrorFrames,
}: ImageFocalEditorProps) {
  const x = sanitizePercent(focalX, DEFAULT_FOCAL.focalX);
  const y = sanitizePercent(focalY, DEFAULT_FOCAL.focalY);
  const zoom = sanitizeZoom(focalZoom);

  const imgRef = useRef<HTMLImageElement>(null);
  const [displayHeight, setDisplayHeight] = useState<number | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Hooks must run unconditionally on every render. displayHeight starts
  // null and the component returns early (below) until the image loads, so
  // any hook declared after that early return would be skipped on the first
  // render(s) but present once displayHeight is set — React would then
  // throw "Rendered more hooks than during the previous render." dragRef
  // doesn't depend on anything computed after the early return, so it's
  // declared here instead, alongside the other unconditional hooks.
  const dragRef = useRef<{
    mode: "pan" | "resize";
    startClientX: number;
    startClientY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  // handlePointerMove/handlePointerUp below are plain function declarations
  // re-created on every render, so the *specific* closures attached to
  // `window` by startDrag() are whichever render was current when the drag
  // began — not necessarily this render's. This ref always points at
  // whichever pair is actually attached, so the unmount-cleanup effect
  // (which only ever runs once, at mount) can remove the right listeners
  // instead of a stale mount-time closure that was never attached.
  const activeDragListenersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: () => void;
  } | null>(null);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    setDisplayHeight((DISPLAY_WIDTH * img.naturalHeight) / img.naturalWidth);
  }, []);

  const handleImageError = useCallback(() => {
    setLoadFailed(true);
  }, []);

  // Tear down any in-progress drag's window listeners if this component
  // unmounts mid-gesture, so a stale closure doesn't linger on `window`
  // until some unrelated pointerup fires elsewhere on the page.
  useEffect(() => {
    return () => {
      const active = activeDragListenersRef.current;
      if (!active) return;
      window.removeEventListener("pointermove", active.move);
      window.removeEventListener("pointerup", active.up);
    };
  }, []);

  const refAspect = referenceFrame.width / referenceFrame.height;

  // The crop rectangle's size at zoom=1 is whatever object-fit:cover would
  // pick: full image height + cropped width (image relatively wider than
  // the frame), or full width + cropped height (image relatively taller).
  function baseRectSize(imgW: number, imgH: number) {
    const imgAspect = imgW / imgH;
    if (imgAspect > refAspect) {
      const height = imgH;
      return { width: height * refAspect, height };
    }
    const width = imgW;
    return { width, height: width / refAspect };
  }

  if (!displayHeight) {
    return (
      <div className="text-sm text-[#6b6560]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: "none" }}
        />
        {loadFailed ? "No se pudo cargar la imagen." : "Cargando imagen…"}
      </div>
    );
  }

  const base = baseRectSize(DISPLAY_WIDTH, displayHeight);
  const rectWidth = base.width / zoom;
  const rectHeight = base.height / zoom;
  const centerX = (x / 100) * DISPLAY_WIDTH;
  const centerY = (y / 100) * displayHeight;
  const rectLeft = clamp(centerX - rectWidth / 2, 0, DISPLAY_WIDTH - rectWidth);
  const rectTop = clamp(centerY - rectHeight / 2, 0, displayHeight - rectHeight);

  function updateFromRect(left: number, top: number, width: number, height: number) {
    // Derive the intended center from the incoming rect *before* clamping
    // width. For pan, width === the (already-valid) previous width, so this
    // is a no-op and the result is identical to clamping `left` directly.
    // For resize, `width` may be the raw, not-yet-clamped size the pointer
    // asked for — if we clamped `left` as-is against the *clamped* width
    // instead of re-deriving position from the center, hitting the
    // MIN_ZOOM/MAX_ZOOM bound would silently shift the rectangle's center
    // (since `left` was computed assuming the unclamped width). Recomputing
    // the clamped position from the center keeps the center fixed through
    // the zoom-bound clamp, and edge clamping still applies afterwards.
    const centerXPx = left + width / 2;
    const centerYPx = top + height / 2;
    const clampedWidth = clamp(width, base.width / MAX_ZOOM, base.width / MIN_ZOOM);
    const clampedHeight = clampedWidth / refAspect;
    const clampedLeft = clamp(centerXPx - clampedWidth / 2, 0, DISPLAY_WIDTH - clampedWidth);
    const clampedTop = clamp(centerYPx - clampedHeight / 2, 0, displayHeight! - clampedHeight);
    const newX = ((clampedLeft + clampedWidth / 2) / DISPLAY_WIDTH) * 100;
    const newY = ((clampedTop + clampedHeight / 2) / displayHeight!) * 100;
    const newZoom = clamp(base.width / clampedWidth, MIN_ZOOM, MAX_ZOOM);
    onChange({ focalX: newX, focalY: newY, focalZoom: newZoom });
  }

  function handlePointerMove(e: PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;

    if (drag.mode === "pan") {
      updateFromRect(drag.startLeft + dx, drag.startTop + dy, drag.startWidth, drag.startHeight);
      return;
    }

    // Resize: rectangle center stays fixed; distance from center to the
    // pointer (on whichever axis moved further, scaled by aspect ratio)
    // drives the new half-width. Works the same for any of the 4 corners.
    const centerXAtStart = drag.startLeft + drag.startWidth / 2;
    const centerYAtStart = drag.startTop + drag.startHeight / 2;
    const pointerDx = Math.abs(centerXAtStart - (centerXAtStart + dx));
    const pointerDy = Math.abs(centerYAtStart - (centerYAtStart + dy));
    const halfWidth = Math.max(pointerDx, pointerDy * refAspect);
    const newWidth = halfWidth * 2;
    updateFromRect(
      centerXAtStart - newWidth / 2,
      centerYAtStart - newWidth / refAspect / 2,
      newWidth,
      newWidth / refAspect
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
    activeDragListenersRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }

  function startDrag(mode: "pan" | "resize", e: React.PointerEvent) {
    e.preventDefault();
    if (mode === "resize") e.stopPropagation();
    dragRef.current = {
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startLeft: rectLeft,
      startTop: rectTop,
      startWidth: rectWidth,
      startHeight: rectHeight,
    };
    activeDragListenersRef.current = { move: handlePointerMove, up: handlePointerUp };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-medium text-[#6b6560] mb-1.5">
          {referenceFrame.label}
        </div>
        <div
          className="relative select-none rounded-lg overflow-hidden bg-[#2b2434]"
          style={{ width: DISPLAY_WIDTH, height: displayHeight }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            draggable={false}
            style={{ width: DISPLAY_WIDTH, height: displayHeight, display: "block" }}
          />
          <div
            data-testid="focal-rect"
            onPointerDown={(e) => startDrag("pan", e)}
            className="absolute border-2 border-[#fff9f1] rounded cursor-move"
            style={{
              left: rectLeft,
              top: rectTop,
              width: rectWidth,
              height: rectHeight,
              boxShadow: "0 0 0 999px rgba(43,36,52,.55)",
            }}
          >
            {(["nw", "ne", "sw", "se"] as const).map((corner) => (
              <div
                key={corner}
                data-testid={`focal-handle-${corner}`}
                onPointerDown={(e) => startDrag("resize", e)}
                className="absolute w-3 h-3 bg-[#fff9f1] rounded-sm cursor-nwse-resize"
                style={{
                  top: corner.includes("n") ? -6 : undefined,
                  bottom: corner.includes("s") ? -6 : undefined,
                  left: corner.includes("w") ? -6 : undefined,
                  right: corner.includes("e") ? -6 : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {mirrorFrames.map((frame) => {
          const style = computeFocalStyle(x, y, zoom);
          const mirrorHeight = MIRROR_WIDTH / (frame.width / frame.height);
          return (
            <div key={frame.label}>
              <div className="text-xs font-medium text-[#6b6560] mb-1.5">
                {frame.label}
              </div>
              <div
                className="rounded-lg overflow-hidden bg-[#2b2434]"
                style={{ width: MIRROR_WIDTH, height: mirrorHeight }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: style.objectPosition,
                    transform: style.transform,
                    transformOrigin: style.transformOrigin,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_FOCAL })}
        className="text-xs font-medium text-[#6b6560] hover:text-[#1a1a18] underline"
      >
        Restablecer posición
      </button>
    </div>
  );
}
