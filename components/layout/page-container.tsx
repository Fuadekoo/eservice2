import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.ComponentProps<"div"> {
  scrollable?: boolean;
}

export default function PageContainer({
  children,
  className,
  scrollable = true,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full",
        scrollable ? "overflow-auto" : "overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
