import React, { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";
import { clsx } from "clsx";
import { Currency } from "../../types/country";

interface MultiCurrencySelectProps {
  label: string;
  options: Currency[];
  value: Currency[];
  onChange: (value: Currency[]) => void;
}

export default function MultiCurrencySelect({
  label,
  options,
  value,
  onChange,
}: MultiCurrencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState<Currency[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Filter options: not already selected, matching query
  const filtered = options
    .filter((opt) => !value.some((v) => v.code === opt.code))
    .filter(
      (opt) =>
        opt.code.toLowerCase().includes(query.toLowerCase()) ||
        opt.currency.toLowerCase().includes(query.toLowerCase())
    );

  function selectOption(opt: Currency) {
    onChange([...value, opt]);
    setQuery("");
    setIsOpen(true);
  }

  function removeSelected(code: string) {
    onChange(value.filter((v) => v.code !== code));
  }

  function handleManualChange(index: number, field: keyof Currency, val: string | number) {
    const updated = manual.map((m, i) =>
      i === index ? { ...m, [field]: typeof m[field] === "number" ? Number(val) : val } : m
    );
    setManual(updated);
  }

  function addManual() {
    setManual([...manual, { number: 0, code: "", currency: "" }]);
  }

  function commitManual(index: number) {
    const entry = manual[index];
    if (entry.code && entry.currency && entry.number) {
      onChange([...value, entry]);
      removeManual(index);
    }
  }

  function removeManual(index: number) {
    setManual((m) => m.filter((_, i) => i !== index));
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        className="flex flex-wrap gap-1 items-center border border-gray-300 rounded px-2 py-1 cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {/* Selected existing currencies */}
        {value.map((v) => (
          <span
            key={v.code}
            className="flex items-center bg-green-100 text-sm rounded-full px-2 py-0.5"
          >
            {v.code}
            <X
              className="ml-1 h-4 w-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                removeSelected(v.code);
              }}
            />
          </span>
        ))}

        <input
          type="text"
          className="flex-1 min-w-[6rem] py-1 px-1 text-sm focus:outline-none"
          placeholder="Search or add..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Dropdown for existing currencies */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-300 shadow-lg">
          {filtered.map((opt) => (
            <li
              key={opt.code}
              className={clsx(
                "flex items-center justify-between px-2 py-1 cursor-pointer text-sm hover:bg-gray-100"
              )}
              onClick={() => selectOption(opt)}
            >
              <span>
                {opt.code} — {opt.currency}
              </span>
              <Check className="h-4 w-4 opacity-50" />
            </li>
          ))}
        </ul>
      )}

      {/* Manual entry form */}
      <div className="mt-4 space-y-2">
        <h5 className="text-sm font-medium">Add New Currencies:</h5>
        {manual.map((m, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">
            <input
              type="number"
              placeholder="Number"
              className="p-2 border rounded"
              value={m.number || ""}
              onChange={(e) => handleManualChange(i, "number", e.target.value)}
            />
            <input
              type="text"
              placeholder="Code (3 letters)"
              className="p-2 border rounded"
              maxLength={3}
              value={m.code}
              onChange={(e) => handleManualChange(i, "code", e.target.value.toUpperCase())}
            />
            <input
              type="text"
              placeholder="Currency Name"
              className="p-2 border rounded"
              value={m.currency}
              onChange={(e) => handleManualChange(i, "currency", e.target.value)}
            />
            <div className="flex gap-1">
              {m.code && m.currency && m.number ? (
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-green-100"
                  onClick={() => commitManual(i)}
                >
                  <Check className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                className="p-1 rounded-full hover:bg-red-100"
                onClick={() => removeManual(i)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
          onClick={addManual}
        >
          Add Another
        </button>
      </div>
    </div>
  );
}
