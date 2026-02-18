"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, className = "", ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full h-12 rounded-xl bg-bg-elevated border border-border-subtle
            text-text-primary placeholder:text-text-tertiary
            focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10
            transition-all duration-200 text-sm font-mono
            ${icon ? "pl-11 pr-4" : "px-4"}
            ${className}
          `}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
