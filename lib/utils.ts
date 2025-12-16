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

/**
 * Processes student import data from Excel sheets
 * Handles different import types (batch/separate) and column identification
 */
export function processStudentImportData(
  workbook: any,
  importOptions: { gender: 'boys' | 'girls', importType: 'batch' | 'separate', year?: number, studentType?: 'regular' | 'mando' },
  XLSX: any
) {
  const allStudents: any[] = []
  const warnings: string[] = []

  // Determine hostel and gender
  const isGirlsHostel = importOptions.gender === 'girls'
  const hostelId = isGirlsHostel ? 'hostel_girls' : 'hostel_boys'
  const gender = isGirlsHostel ? 'F' : 'M'

  // Determine which sheets to process
  let sheetsToProcess: string[] = []
  if (importOptions.importType === 'batch') {
    sheetsToProcess = workbook.SheetNames
  } else if (importOptions.importType === 'separate' && importOptions.year) {
    const yearNames = ['first', 'second', 'third', 'final']
    const targetSheetName = yearNames[importOptions.year - 1]
    const matchingSheet = workbook.SheetNames.find((sheet: string) =>
      sheet.toLowerCase().includes(targetSheetName)
    )
    if (matchingSheet) {
      sheetsToProcess = [matchingSheet]
    } else {
      warnings.push(`Could not find sheet for year ${importOptions.year}. Available sheets: ${workbook.SheetNames.join(', ')}`)
      sheetsToProcess = workbook.SheetNames
    }
  } else {
    sheetsToProcess = workbook.SheetNames
  }

  // Process each selected sheet
  sheetsToProcess.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length === 0) {
      warnings.push(`Sheet "${sheetName}": No data found`)
      return
    }

    // Determine year from sheet name or options
    let year: number
    if (importOptions.importType === 'separate' && importOptions.year) {
      year = importOptions.year
    } else {
      const yearNames = ['first', 'second', 'third', 'final']
      const sheetNameLower = sheetName.toLowerCase()
      const yearIndex = yearNames.findIndex(name => sheetNameLower.includes(name))
      if (yearIndex !== -1) {
        year = yearIndex + 1
      } else {
        const yearMatch = sheetName.match(/(\d+)(?:st|nd|rd|th)\s*year/i)
        if (yearMatch) {
          year = parseInt(yearMatch[1])
        } else {
          const sheetMatch = sheetName.match(/sheet\s*(\d+)/i)
          if (sheetMatch) {
            year = parseInt(sheetMatch[1])
          } else {
            warnings.push(`Sheet "${sheetName}": Cannot determine year from sheet name. Using default year 1.`)
            year = 1
          }
        }
      }
    }

    // Find headers and map columns - look for headers in first 10 rows
    let headerRowIndex = 0
    let headers: string[] = []

    for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
      const row = jsonData[i] as string[]
      if (row && row.length >= 2) {
        const rowStr = row.map(h => h?.toString().toLowerCase().trim()).join(' ')
        if (rowStr.includes('name') || rowStr.includes('s.no') || rowStr.includes('serial')) {
          headerRowIndex = i
          headers = row
          break
        }
      }
    }

    if (!headers.length) {
      headers = jsonData[0] as string[]
    }

    const columnMap: { [key: string]: number } = {}
    headers.forEach((header, index) => {
      const headerStr = header?.toString().toLowerCase().trim()
      if (headerStr && (headerStr.includes('s.no') || headerStr.includes('serial') || headerStr === 'sno')) {
        columnMap.sNo = index
      } else if (headerStr && (headerStr.includes('name') || headerStr === 'name')) {
        columnMap.name = index
      } else if (headerStr && (headerStr.includes('dept') || headerStr === 'dept' || headerStr === 'department')) {
        columnMap.dept = index
      } else if (headerStr && (headerStr.includes('register no') || headerStr.includes('reg no') || headerStr.includes('register') || headerStr === 'regno' || headerStr.includes('roll no') || headerStr.includes('roll_no'))) {
        columnMap.regNo = index
      }
    })

    // Set defaults for missing columns
    if (columnMap.sNo === undefined) {
      columnMap.sNo = 0
      warnings.push(`Sheet "${sheetName}": Could not find S.No column, assuming column 1`)
    }
    if (columnMap.name === undefined) {
      columnMap.name = 1
      warnings.push(`Sheet "${sheetName}": Could not find Name column, assuming column 2`)
    }
    if (columnMap.dept === undefined) {
      warnings.push(`Sheet "${sheetName}": Could not find Dept column, will use default`)
    }
    if (columnMap.regNo === undefined) {
      warnings.push(`Sheet "${sheetName}": Could not find Register No column, will use generated roll number`)
    }

    // Process data rows
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[]
      if (!row || row.length <= Math.max(columnMap.sNo, columnMap.name)) continue

      const sNo = row[columnMap.sNo]?.toString().trim()
      const name = row[columnMap.name]?.toString().trim()
      const dept = columnMap.dept !== undefined ? row[columnMap.dept]?.toString().trim() : 'MECH'
      const regNo = columnMap.regNo !== undefined ? row[columnMap.regNo]?.toString().trim() : null

      if (!sNo || !name || sNo === '' || name === '') continue

      let rollNo: string
      // For both Regular and Mando, prefer the value from file if present
      if (regNo && regNo !== '') {
        rollNo = regNo
      } else {
        // Only generate if missing
        rollNo = generateUniqueRollNumber(name, dept)
      }

      // Use the predefined year from import options, not from the Excel column
      allStudents.push({
        name,
        rollNo,
        dept: dept || null,
        year: year,
        gender,
        hostelId,
        isMando: importOptions.studentType === 'mando' || false,
      })
    }
  })

  return { students: allStudents, warnings }
}

/**
 * Validates student import data before processing
 */
export function validateStudentImportData(students: any[]): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  students.forEach((student, index) => {
    if (!student.name || student.name.trim() === '') {
      errors.push(`Row ${index + 1}: Name is required`)
    }
    if (!student.rollNo || student.rollNo.trim() === '') {
      errors.push(`Row ${index + 1}: Roll number is required`)
    }
    if (!student.year || isNaN(student.year)) {
      errors.push(`Row ${index + 1}: Valid year is required`)
    }
    if (!student.hostelId) {
      errors.push(`Row ${index + 1}: Hostel ID is required`)
    }
  })

  return { isValid: errors.length === 0, errors }
}
