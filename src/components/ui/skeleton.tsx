import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-[var(--radius-md)] bg-surface-2 animate-[genesis-fade-in_300ms_ease-in-out_both]", className)}
      style={{ opacity: 0.6 }}
      {...props}
    />
  )
}

export { Skeleton }
