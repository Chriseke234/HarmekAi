import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#FFFFFF] text-[#0A0A0A] font-semibold hover:bg-[#E5E5E5]",
        secondary:
          "bg-[#1C1C1C] text-[#FAFAFA] border border-[#383838] hover:bg-[#262626] hover:border-[#525252]",
        outline:
          "border border-[#383838] bg-transparent text-[#FAFAFA] hover:bg-[#1C1C1C]",
        ghost:
          "bg-transparent text-[#A3A3A3] hover:bg-[#1C1C1C] hover:text-[#FAFAFA]",
        destructive:
          "bg-[#B84A4A] text-[#FAFAFA] hover:bg-[#C95656]",
        link: "text-[#FFFFFF] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
