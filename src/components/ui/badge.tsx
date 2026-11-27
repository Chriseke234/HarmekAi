import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-[#FFFFFF]/40 bg-[#FFFFFF]/15 text-[#E5E5E5]",
        secondary: "border-[#383838] bg-[#1C1C1C] text-[#A3A3A3]",
        success: "border-[#D4D4D4]/40 bg-[#D4D4D4]/15 text-[#E5E5E5]",
        warning: "border-[#D9A05B]/40 bg-[#D9A05B]/15 text-[#ECC28A]",
        destructive: "border-[#D95B5B]/40 bg-[#D95B5B]/15 text-[#EB9494]",
        outline: "border-[#383838] text-[#A3A3A3]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
