import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-[26px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[999px] border border-transparent px-3 py-1 text-[11px] font-medium whitespace-nowrap transition-all duration-150 ease-out focus-visible:shadow-[0_0_0_3px_var(--genesis-accent-subtle)] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-genesis-accent text-white",
        secondary:
          "bg-genesis-accent-subtle text-genesis-accent",
        destructive:
          "bg-error/10 text-error",
        outline:
          "border-border-visible text-text-1",
        ghost:
          "text-text-2 hover:bg-surface-2 hover:text-text-1",
        link: "text-genesis-accent underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
