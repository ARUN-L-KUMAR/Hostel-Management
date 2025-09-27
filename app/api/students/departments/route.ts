import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Fetching departments from API...')
    
    // Fetch all students including mando students to get all departments
    const students = await prisma.student.findMany({
      where: {
        isMando: 'ALL' // Special flag to get all students
      }
    })

    console.log('Total students found:', students.length)
    
    // Log the structure of the first few students to see all fields
    if (students.length > 0) {
      console.log('First student structure:', Object.keys(students[0]))
      console.log('First 5 students full data:', students.slice(0, 5))
    }
    
    console.log('Sample student dept values:', students.slice(0, 10).map(s => ({ name: s.name, dept: s.dept })))

    // Extract unique department values, filter out null/undefined, normalize variations, and remove duplicates
    const deptMap = new Map<string, string>()
    
    students
      .map(student => student.dept)
      .filter((dept): dept is string => dept !== null && dept !== undefined && dept.trim() !== '')
      .forEach(dept => {
        // Normalize the department name for comparison
        const normalizedKey = dept.trim()
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\s*\(\s*/g, '(') // Remove spaces before opening parenthesis
          .replace(/\s*\)\s*/g, ')') // Remove spaces before closing parenthesis
          .toLowerCase() // Convert to lowercase for comparison
        
        // Keep the first occurrence or prefer the one with better formatting
        if (!deptMap.has(normalizedKey)) {
          // Store the cleaned version (with proper spacing)
          const cleanedDept = dept.trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\s*\(\s*/g, ' (') // Ensure space before opening parenthesis
            .replace(/\s*\)\s*/g, ')') // Remove spaces before closing parenthesis
          deptMap.set(normalizedKey, cleanedDept)
        }
      })
    
    const deptList = Array.from(deptMap.values()).sort()

    console.log('Processed department list:', deptList)

    return NextResponse.json(deptList, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
  }
}