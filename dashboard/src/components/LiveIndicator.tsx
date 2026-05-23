export function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span
          className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-500"
          aria-hidden="true"
        />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span
        className="text-[10px] font-bold tracking-[0.08em] uppercase text-emerald-500"
      >
        LIVE
      </span>
    </span>
  );
}
