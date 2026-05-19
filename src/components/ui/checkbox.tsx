"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[var(--radius-element)] border-[1.5px] border-border-visible transition-all duration-150 ease-out outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:shadow-[0_0_0_3px_var(--genesis-accent-subtle)] disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error aria-invalid:shadow-[0_0_0_3px_rgba(217,79,79,0.2)] data-checked:border-genesis-accent data-checked:bg-genesis-accent data-checked:text-white",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
