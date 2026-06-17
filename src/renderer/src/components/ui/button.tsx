import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md text-body font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-9",
  {
    variants: {
      variant: {
        default: "border border-gray-a6 bg-gray-a2 text-gray-12 hover:bg-gray-a3",
        filled:  "bg-gray-a3 text-gray-12 hover:bg-gray-a4",
        accent:  "bg-blue-9 text-white hover:bg-blue-10",
        glass:   "bg-transparent text-gray-11 hover:bg-gray-a3",
      },
      size: {
        default: "h-7 px-3 py-1",
        large:   "h-8 px-3 py-1",
        icon:    "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  iconOnly?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, iconOnly, ...props }, ref) => {
    const resolvedSize = iconOnly ? "icon" : size;
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size: resolvedSize }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
