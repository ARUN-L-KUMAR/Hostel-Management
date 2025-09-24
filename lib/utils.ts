import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique 12-digit roll number for students
 * Format: [3 letters from name][3 letters from dept][6 random chars]
 */
export function generateUniqueRollNumber(name: string, dept: string = 'MECH'): string {
  // Clean and prepare name (take first 3 letters, uppercase)
  const namePart = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X')

  // Clean and prepare department (take first 3 letters, uppercase)
  const deptPart = dept.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'M')

  // Generate 6 random alphanumeric characters
  const randomChars = generateRandomString(6)

  // Combine to create 12-digit roll number
  return `${namePart}${deptPart}${randomChars}`
}

/**
 * Generates a random alphanumeric string of specified length
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Ensures roll number uniqueness by checking against existing roll numbers
 * If duplicate found, generates a new one with additional random suffix
 */
export async function ensureUniqueRollNumber(baseRollNumber: string, existingRollNumbers: string[] = []): Promise<string> {
  let rollNumber = baseRollNumber
  let attempts = 0
  const maxAttempts = 100

  while (existingRollNumbers.includes(rollNumber) && attempts < maxAttempts) {
    // Add random suffix to make it unique
    const randomSuffix = generateRandomString(2)
    rollNumber = baseRollNumber.substring(0, 10) + randomSuffix
    attempts++
  }

  if (attempts >= maxAttempts) {
    // Fallback: completely random roll number
    rollNumber = generateRandomString(12)
  }

  return rollNumber
}
