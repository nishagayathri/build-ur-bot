import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[var(--radius-md)] border-[1.5px] border-border bg-surface-1 px-4 py-2.5 text-[15px] text-text-1 transition-all duration-150 ease-out outline-none placeholder:text-text-3 focus-visible:border-genesis-accent focus-visible:shadow-[0_0_0_3px_var(--genesis-accent-subtle)] disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error aria-invalid:shadow-[0_0_0_3px_rgba(217,79,79,0.2)] md:text-[13px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
