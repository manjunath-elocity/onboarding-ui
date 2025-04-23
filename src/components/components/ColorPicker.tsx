import React, { useState, useRef, useEffect } from "react";
import { SketchPicker } from "react-color";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  error,
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        inputRef.current !== event.target
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className={`w-40 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          onClick={() => setIsOpen(true)}
        />
        <div
          className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
          <SketchPicker
            color={value as string}
            onChangeComplete={(color: { hex: string }) => onChange(color.hex)}
          />
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
