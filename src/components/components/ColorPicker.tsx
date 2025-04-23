// import React, { useState, useRef, useEffect } from 'react';

// interface ColorPickerProps {
//   label: string;
//   value: string;
//   onChange: (value: string) => void;
//   error?: string;
//   required?: boolean;
// }

// export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, error, required }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const pickerRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const presetColors = [
//     '#E74C3C', '#E67E22', '#F1C40F', '#8B4513', '#2ECC71', 
//     '#27AE60', '#9B59B6', '#8E44AD', '#3498DB',
//     '#48D1CC', '#98FB98', '#000000', '#34495E', '#95A5A6', '#FFFFFF'
//   ];

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         pickerRef.current &&
//         !pickerRef.current.contains(event.target as Node) &&
//         inputRef.current !== event.target // Ignore clicks on input
//       ) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handlePresetClick = (color: string) => {
//     onChange(color);
//     setIsOpen(false);
//   };

//   const handleColorBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const width = rect.width;
//     const hue = (x / width) * 360;

//     const hslToHex = (h: number, s: number, l: number) => {
//       l /= 100;
//       const a = s * Math.min(l, 1 - l) / 100;
//       const f = (n: number) => {
//         const k = (n + h / 30) % 12;
//         const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
//         return Math.round(255 * color).toString(16).padStart(2, '0');
//       };
//       return `#${f(0)}${f(8)}${f(4)}`;
//     };

//     onChange(hslToHex(hue, 100, 50));
//   };

//   return (
//     <div className="relative" ref={pickerRef}>
//       <label className="block text-sm font-medium text-gray-700 mb-1">
//         {label}
//         {required && <span className="text-red-500 ml-1">*</span>}
//       </label>
//       <div className="flex items-center gap-2">
//         <input
//           ref={inputRef}
//           type="text"
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           placeholder="#000000"
//           className={`w-40 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
//             error ? 'border-red-500' : 'border-gray-300'
//           }`}
//           onClick={() => setIsOpen(true)}
//         />
//         <div 
//           className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
//           style={{ backgroundColor: value }}
//           onClick={() => setIsOpen(true)}
//         />
//       </div>
//       {isOpen && (
//         <div className="absolute z-50 mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 w-64">
//           <div 
//             className="w-full h-4 mb-3 rounded relative cursor-pointer"
//             style={{
//               background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)'
//             }}
//             onClick={handleColorBarClick}
//           />
//           <div className="grid grid-cols-5 gap-2">
//             {presetColors.map((color, index) => (
//               <button
//                 key={index}
//                 className="w-8 h-8 rounded border border-gray-300"
//                 style={{ backgroundColor: color }}
//                 onClick={() => handlePresetClick(color)}
//                 aria-label={`Select color ${color}`}
//               />
//             ))}
//           </div>
//         </div>
//       )}
//       {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
//     </div>
//   );
// };

import React, { useState, useRef, useEffect } from 'react';
import { SketchPicker } from 'react-color';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, error, required }) => {
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
            error ? 'border-red-500' : 'border-gray-300'
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

