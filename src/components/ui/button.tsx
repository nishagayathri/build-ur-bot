import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-[13px] font-medium whitespace-nowrap outline-none select-none transition-all duration-150 ease-out active:not-aria-[haspopup]:scale-[0.97] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_var(--genesis-accent-subtle)] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_rgba(217,79,79,0.2)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "rounded-[999px] bg-primary text-primary-foreground hover:opacity-85",
        outline:
          "rounded-[999px] border-[1.5px] border-border-visible bg-transparent text-foreground hover:bg-surface-2 aria-expanded:bg-surface-2",
        secondary:
          "rounded-[999px] bg-secondary text-secondary-foreground hover:bg-surface-3 aria-expanded:bg-surface-3",
        ghost:
          "rounded-[var(--radius-md)] text-text-2 hover:text-text-1 hover:bg-surface-2 aria-expanded:bg-surface-2",
        destructive:
          "rounded-[999px] bg-error text-white hover:opacity-85",
        link: "text-genesis-accent underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-3 text-[11px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3.5 text-[13px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10 rounded-[var(--radius-md)]",
        "icon-xs":
          "size-7 rounded-[var(--radius-md)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[var(--radius-md)]",
        "icon-lg": "size-11 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={nativeButton ?? (props.render == null)}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
