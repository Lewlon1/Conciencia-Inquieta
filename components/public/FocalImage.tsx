import { computeFocalStyle } from "@/lib/focalImage";

interface FocalImageProps {
  src: string;
  alt: string;
  focalX?: number | null;
  focalY?: number | null;
  focalZoom?: number | null;
  className?: string;
}

// Drop-in replacement for a plain <img> inside a .ph/.hero-img/.service-hero
// frame (object-fit: cover already applies via that ancestor's CSS) — this
// just adds the object-position + zoom anchor on top.
export default function FocalImage({
  src,
  alt,
  focalX,
  focalY,
  focalZoom,
  className,
}: FocalImageProps) {
  const { objectPosition, transform, transformOrigin } = computeFocalStyle(
    focalX,
    focalY,
    focalZoom
  );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ objectPosition, transform, transformOrigin }}
    />
  );
}
