import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a consistent gradient based on a string (form title or ID)
export function generateGradient(seed: string): string {
  // Generate a hash from the string
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }

  // Use the hash to select from predefined gradient pairs
  const gradients = [
    "from-blue-500 to-purple-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-blue-500",
    "from-cyan-500 to-sky-500",
    "from-violet-500 to-purple-500",
    "from-fuchsia-500 to-pink-500",
    "from-lime-500 to-green-500",
    "from-rose-500 to-red-500",
  ]

  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

// Format date in a nice way
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Unknown"
  
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "Unknown"

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d)
}