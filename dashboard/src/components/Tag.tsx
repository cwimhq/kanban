interface TagProps {
  label: string;
}

export function Tag({ label }: TagProps) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide bg-[#27273A] text-[#8A8AA3]">
      {label}
    </span>
  );
}
