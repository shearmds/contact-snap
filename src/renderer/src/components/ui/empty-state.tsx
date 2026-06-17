import * as React from "react";
import { cn } from "../../lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  placement?: "inline" | "fullscreen";
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, placement = "fullscreen", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center text-center gap-2",
        placement === "fullscreen" && "justify-center h-full",
        className,
      )}
      {...props}
    />
  ),
);
EmptyState.displayName = "EmptyState";

export const EmptyStateMedia = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mb-2", className)} {...props} />
  ),
);
EmptyStateMedia.displayName = "EmptyStateMedia";

export const EmptyStateTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-body font-semibold text-gray-12", className)} {...props} />
  ),
);
EmptyStateTitle.displayName = "EmptyStateTitle";

export const EmptyStateDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-footnote text-gray-9 w-full", className)} {...props} />
  ),
);
EmptyStateDescription.displayName = "EmptyStateDescription";

export const EmptyStateActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2 mt-1", className)} {...props} />
  ),
);
EmptyStateActions.displayName = "EmptyStateActions";
