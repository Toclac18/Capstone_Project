import { cn } from "@/utils/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-100 dark:bg-dark-2",
        className,
      )}
      {...props}
    />
  );
}
