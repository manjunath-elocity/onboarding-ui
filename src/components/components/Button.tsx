import React from "react";
import { Trash2, Plus } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string; // New prop for loading text
  variant?: "primary" | "danger" | "success";
  icon?: "trash" | "plus";
  iconOnly?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  loadingText = "Processing...", // Default loading text
  variant = "primary",
  icon,
  iconOnly = false,
  className = "",
  ...props
}) => {
  const baseStyles =
    "rounded-lg font-medium transition-colors flex items-center justify-center gap-2";
  const sizeStyles = iconOnly ? "p-2" : "px-4 py-2 text-sm";

  const variantStyles = {
    primary: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
  };

  const getIcon = () => {
    switch (icon) {
      case "trash":
        return <Trash2 className="w-4 h-4" />;
      case "plus":
        return <Plus className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <button
      {...props}
      className={`
        ${baseStyles}
        ${sizeStyles}
        ${props.disabled ? "bg-gray-300 cursor-not-allowed" : variantStyles[variant]}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{loadingText}</span> {/* Show loading text */}
        </>
      ) : (
        <>
          {getIcon()}
          {!iconOnly && children}
        </>
      )}
    </button>
  );
};
