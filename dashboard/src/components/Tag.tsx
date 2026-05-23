interface TagProps {
  label: string;
}

export function Tag({ label }: TagProps) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
      {label}
    </span>
  );
}
