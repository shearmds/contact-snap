import * as React from "react";
import { cn } from "../../lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  toolbar?: React.ReactNode;
}

/**
 * ScrollArea with optional sticky toolbar at top.
 * Matches the Glaze ScrollArea API used in home-view.tsx.
 */
const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, toolbar, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col h-full min-h-0", className)} {...props}>
      {toolbar && (
        <div className="shrink-0 border-b border-gray-a4">
          {toolbar}
        </div>
      )}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {children}
      </div>
    </div>
  ),
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
