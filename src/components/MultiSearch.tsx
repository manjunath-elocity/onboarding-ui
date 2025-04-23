import { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { clsx } from "clsx";

interface MultiSelectSearchProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectSearch({
  label,
  options,
  value,
  onChange,
  placeholder = "Search...",
}: MultiSelectSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter options based on query and exclude already selected
  const filtered = options
    .filter((opt) => !value.includes(opt))
    .filter((opt) => opt.toLowerCase().includes(query.toLowerCase()));

  function selectOption(opt: string) {
    onChange([...value, opt]);
    setQuery("");
    setIsOpen(true);
  }

  function removeOption(opt: string) {
    onChange(value.filter((v) => v !== opt));
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        className="flex flex-wrap gap-1 items-center border border-gray-300 rounded px-2 py-1 hover:shadow-sm cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {value.map((val) => (
          <span
            key={val}
            className="flex items-center bg-blue-100 text-sm rounded-full px-2 py-0.5"
          >
            {val}
            <X
              className="ml-1 h-4 w-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                removeOption(val);
              }}
            />
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-[6rem] py-1 px-1 text-sm focus:outline-none"
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-300 shadow-lg">
          {filtered.map((opt) => (
            <li
              key={opt}
              className={clsx(
                "flex items-center justify-between px-2 py-1 cursor-pointer text-sm hover:bg-gray-100"
              )}
              onClick={() => selectOption(opt)}
            >
              <span>{opt}</span>
              <Check className="h-4 w-4 opacity-50" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
