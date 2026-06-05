import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm shadow-doodle-sm transition-colors",
          "focus:outline-none focus:border-black focus:ring-0 focus:bg-[#fffdf0]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "placeholder:text-gray-500 font-sans",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
