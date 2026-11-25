import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97745] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11100E] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#D97745] text-[#11100E] font-semibold hover:bg-[#E28758]",
        secondary:
          "bg-[#211E1A] text-[#F5F2EB] border border-[#3D3730] hover:bg-[#2A2621] hover:border-[#4F473E]",
        outline:
          "border border-[#3D3730] bg-transparent text-[#F5F2EB] hover:bg-[#211E1A]",
        ghost:
          "bg-transparent text-[#B5AEA2] hover:bg-[#211E1A] hover:text-[#F5F2EB]",
        destructive:
          "bg-[#B84A4A] text-[#F5F2EB] hover:bg-[#C95656]",
        link: "text-[#D97745] underline-offset-4 hover:underline",
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
