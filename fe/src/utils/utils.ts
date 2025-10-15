import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Ví dụ: Dùng để tránh conflict css
// cn("bg-red-500", "text-white", "p-4") => "bg-red-500 text-white p-4"
// cn("bg-red-500", "text-white", "p-4", "rounded-lg") => "bg-red-500 text-white p-4 rounded-lg"