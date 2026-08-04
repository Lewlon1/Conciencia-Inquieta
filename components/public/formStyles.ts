// Shared field styling for the public capture forms (contact + service
// booking), so the two can't drift apart visually.

export const fieldLabel =
  "mb-2 block font-display text-sm font-bold uppercase tracking-wide text-ci-ink";

export const fieldInput =
  "w-full rounded-2xl border-2 border-ci-ink/15 bg-white px-5 py-3 text-ci-ink placeholder-ci-ink/35 transition-colors focus:border-ci-orange focus:outline-none";

export const fieldTextarea = `${fieldInput} min-h-[140px] resize-y`;

export const submitButton =
  "w-full rounded-full bg-ci-orange px-6 py-4 font-display font-bold uppercase tracking-wide text-ci-ink transition-colors hover:bg-ci-purple sm:w-auto";

export const errorNote =
  "rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800";
