import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-pastel-blue text-black hover:bg-blue-300",
  destructive:
    "bg-pastel-pink text-black hover:bg-red-300",
  outline:
    "bg-paper text-black hover:bg-gray-100",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 border-transparent shadow-none",
  link:
    "bg-transparent text-blue-600 underline-offset-4 hover:underline border-transparent shadow-none",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
  icon: "p-2",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-doodle font-semibold",
          "border-doodle shadow-doodle transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
          "active:translate-y-[4px] active:shadow-none hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
