import { useState } from "react";
import { CircleHelp } from "lucide-react";

interface InlineHelpProps {
  title: string;
  description: string;
}

export default function InlineHelp({
  title,
  description,
}: InlineHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <CircleHelp
        size={16}
        className="cursor-pointer text-gray-500 hover:text-gray-700"
      />

      {open && (
        <div className="absolute left-6 top-0 z-50 w-64 rounded-lg border bg-white p-3 shadow-lg">
          <p className="font-semibold">{title}</p>

          <p className="mt-1 text-sm text-gray-600">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}