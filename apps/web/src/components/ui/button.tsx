import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-paper border border-ink hover:bg-signal hover:border-signal hover:text-ink",
  secondary: "bg-paper text-ink border border-ink hover:bg-mist",
  ghost: "bg-transparent text-ink border border-transparent hover:border-line",
  accent:
    "bg-signal text-ink border border-signal hover:bg-ink hover:border-ink hover:text-paper",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className = "", variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 active:scale-[0.97] ${variants[variant]} ${className}`}
    {...props}
  />
));
Button.displayName = "Button";
