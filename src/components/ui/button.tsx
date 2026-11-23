import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-xs font-semibold tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a477] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#c6a477] text-[#171412] hover:bg-[#d7b989]",
        secondary: "bg-[#762f3c] text-[#f5f0e8] hover:bg-[#8c3a49]",
        outline: "border border-[rgba(198,164,119,0.78)] bg-transparent text-[#f5f0e8] hover:bg-[rgba(198,164,119,0.10)]",
        ghost: "bg-transparent text-current hover:bg-white/10",
        link: "h-auto rounded-none bg-transparent p-0 text-[#c6a477] underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-5 py-3",
        sm: "min-h-9 px-3 py-2",
        lg: "min-h-12 px-7 py-4",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
