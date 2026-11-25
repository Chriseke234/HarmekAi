import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#3D3730] bg-[#141210] px-3 py-2 text-sm text-[#F5F2EB] placeholder:text-[#968E82] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97745] focus-visible:border-[#D97745] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
