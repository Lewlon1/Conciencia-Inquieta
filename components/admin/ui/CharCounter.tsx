interface CharCounterProps {
  value: string;
  max: number; // soft recommended max (e.g. 60 or 160)
}

export default function CharCounter({ value, max }: CharCounterProps) {
  const length = value.length;

  const colorClass =
    length > max
      ? "text-red-600"
      : length >= max - 10
        ? "text-[#b8860b]"
        : "text-[#6b6560]";

  return (
    <p className={`mt-1 text-right text-xs ${colorClass}`}>
      {length} / {max}
    </p>
  );
}
