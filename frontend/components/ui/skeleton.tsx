import { cn } from "@/lib/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skel-sketch", className)}
      {...props}
    />
  )
}

export { Skeleton }
