import * as React from "react";
import { cn } from "../../lib/utils";

/** Matches the Glaze Toolbar API used in home-view.tsx */

export const Toolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-toolbar
      className={cn("flex items-center h-11 px-3 gap-2 drag-region", className)}
      {...props}
    />
  ),
);
Toolbar.displayName = "Toolbar";

export const ToolbarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 flex items-center min-w-0", className)} {...props} />
  ),
);
ToolbarContent.displayName = "ToolbarContent";

export const ToolbarTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-body font-semibold text-gray-12 truncate", className)}
      {...props}
    />
  ),
);
ToolbarTitle.displayName = "ToolbarTitle";

export const ToolbarActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-1 shrink-0", className)} {...props} />
  ),
);
ToolbarActions.displayName = "ToolbarActions";
