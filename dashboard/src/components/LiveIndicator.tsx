export function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span
          className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#10B981]"
          aria-hidden="true"
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
      </span>
      <span
        className="text-[11px] font-medium tracking-[0.05em] uppercase"
        style={{ color: '#10B981' }}
      >
        LIVE
      </span>
    </span>
  );
}
