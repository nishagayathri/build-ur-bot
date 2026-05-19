import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[var(--radius-md)] border-[1.5px] border-border bg-surface-1 px-4 py-2.5 text-[15px] text-text-1 transition-all duration-150 ease-out outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-3 focus-visible:border-genesis-accent focus-visible:shadow-[0_0_0_3px_var(--genesis-accent-subtle)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error aria-invalid:shadow-[0_0_0_3px_rgba(217,79,79,0.2)] md:text-[13px] dark:bg-surface-1",
        className
      )}
      {...props}
    />
  )
}

export { Input }
