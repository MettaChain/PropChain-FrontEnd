import { useState } from "react";

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function FilterSection({
  title,
  children,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b py-4">
      <button
        className="flex w-full items-center justify-between font-semibold"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span>{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}