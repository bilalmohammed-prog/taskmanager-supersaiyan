import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility to intelligently merge Tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-zinc-50",
          {
            "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 shadow-sm": variant === "primary",
            "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900": variant === "secondary",
            "border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900": variant === "outline",
            "hover:bg-zinc-100 hover:text-zinc-900": variant === "ghost",
            "h-9 px-4 py-2": size === "default",
            "h-8 px-3 rounded-md text-xs": size === "sm",
            "h-11 px-8 rounded-md": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
