import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-[#08090a] hover:bg-accent-hover active:bg-accent-active shadow-[0_0_0_1px_rgba(215,251,67,0.15)] hover:shadow-glow-sm",
  secondary:
    "bg-surface text-primary border border-border hover:bg-surface-hover hover:border-border-strong",
  outline:
    "bg-transparent text-primary border border-border-strong hover:bg-surface hover:border-secondary",
  ghost: "bg-transparent text-secondary hover:text-primary hover:bg-surface",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 hover:border-danger/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "right",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center font-medium whitespace-nowrap",
          "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
          "cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="inline-flex shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === "right" && (
              <span className="inline-flex shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                {icon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";