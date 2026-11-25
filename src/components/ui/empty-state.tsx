import * as React from "react";
import { cn } from "@/lib/utils";
import { EmberFox } from "@/components/brand/ember-fox";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2B2722] bg-[#141210] px-6 py-12 text-center",
        className
      )}
    >
      <div className="relative mb-4">
        <EmberFox mood="listening" size={56} />
        {icon ? (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#2B2722] bg-[#211E1A] text-[#D97745]">
            {icon}
          </div>
        ) : null}
      </div>
      <h4 className="font-display text-lg font-medium text-[#F5F2EB]">{title}</h4>
      <p className="mt-1.5 max-w-md text-sm text-[#B5AEA2]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
