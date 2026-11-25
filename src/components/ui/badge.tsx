import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-[#D97745]/40 bg-[#D97745]/15 text-[#F0A47A]",
        secondary: "border-[#3D3730] bg-[#211E1A] text-[#B5AEA2]",
        success: "border-[#84A98C]/40 bg-[#84A98C]/15 text-[#A5C6AC]",
        warning: "border-[#D9A05B]/40 bg-[#D9A05B]/15 text-[#ECC28A]",
        destructive: "border-[#D95B5B]/40 bg-[#D95B5B]/15 text-[#EB9494]",
        outline: "border-[#3D3730] text-[#B5AEA2]",
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
