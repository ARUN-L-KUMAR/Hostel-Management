import { neon } from "@neondatabase/serverless"

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL!)

// Create a Prisma-like interface for database operations
export const prisma = {
  student: {
    findMany: async (options?: any) => {
      console.log("[v0] Finding students with options:", JSON.stringify(options))

      try {
        // For now, get all students with hostel info
        // TODO: Implement proper filtering
        const result = await sql`
          SELECT s.*, h.name as hostel_name
          FROM students s
          LEFT JOIN hostels h ON s."hostelId" = h.id
          ORDER BY s.name ASC
        `

        let studentsWithHostel = result.map((student: any) => ({
          ...student,
          hostel: { name: student.hostel_name }, // Use the joined hostel name
          attendance: [], // Initialize empty attendance array
        }))

        // Apply client-side filtering for now
        if (options?.where) {
          if (options.where.hostelId) {
            studentsWithHostel = studentsWithHostel.filter(s => s.hostelId === options.where.hostelId)
          }
          // Handle nested hostel name filtering
          if (options.where.hostel?.name) {
            studentsWithHostel = studentsWithHostel.filter(s => s.hostel?.name === options.where.hostel.name)
          }
          if (options.where.year) {
            studentsWithHostel = studentsWithHostel.filter(s => s.year === options.where.year)
          }
          if (options.where.isMando !== undefined) {
            studentsWithHostel = studentsWithHostel.filter(s => s.isMando === options.where.isMando)
          }
          if (options.where.status) {
            studentsWithHostel = studentsWithHostel.filter(s => s.status === options.where.status)
          }
          if (options.where.OR) {
            studentsWithHostel = studentsWithHostel.filter(s => {
              return options.where.OR.some((condition: any) => {
                if (condition.name) {
                  return s.name.toLowerCase().includes(condition.name.contains.toLowerCase())
                } else if (condition.rollNo) {
                  return s.rollNo.toLowerCase().includes(condition.rollNo.contains.toLowerCase())
                }
                return false
              })
            })
          }
        }

        // If attendance is requested, fetch all attendance for the date range and assign to students
        if (options?.include?.attendance && studentsWithHostel.length > 0) {
          try {
            // Log all attendance records in the table for debugging (only if records exist)
            const allAttendanceRecords = await sql`SELECT * FROM attendance ORDER BY date ASC`
            if (allAttendanceRecords.length > 0) {
              console.log(`[v0] ATTENDANCE RECORDS IN TABLE (${allAttendanceRecords.length} total):`, allAttendanceRecords)
            } else {
              console.log(`[v0] No attendance records found in table`)
            }

            let attendanceQuery = sql`SELECT * FROM attendance WHERE 1=1`
            let orderBy = sql`ORDER BY "studentId", date ASC`

            // Apply date filter if specified
            if (options.include.attendance.where?.date) {
              if (options.include.attendance.where.date.gte) {
                const gteDate = new Date(options.include.attendance.where.date.gte)
                const gteISOString = gteDate.toISOString()
                attendanceQuery = sql`${attendanceQuery} AND date >= ${gteISOString}`
                console.log(`[v0] Applied date gte filter: ${gteISOString}`)
              }
              if (options.include.attendance.where.date.lte) {
                const lteDate = new Date(options.include.attendance.where.date.lte)
                const lteISOString = lteDate.toISOString()
                attendanceQuery = sql`${attendanceQuery} AND date <= ${lteISOString}`
                console.log(`[v0] Applied date lte filter: ${lteISOString}`)
              }
            }

            // Apply orderBy if specified
            if (options.include.attendance.orderBy) {
              const orderField = options.include.attendance.orderBy.date || options.include.attendance.orderBy
              const orderDirection = orderField === 'desc' ? sql`DESC` : sql`ASC`
              orderBy = sql`ORDER BY "studentId", date ${orderDirection}`
            }

            console.log(`[v0] Executing attendance query with filters`)
            const allAttendance = await sql`${attendanceQuery} ${orderBy}`
            console.log(`[v0] Attendance query returned ${allAttendance.length} records`)

            // Group attendance by studentId
            const attendanceByStudent = new Map()
            allAttendance.forEach((att: any) => {
              if (!attendanceByStudent.has(att.studentId)) {
                attendanceByStudent.set(att.studentId, [])
              }
              attendanceByStudent.get(att.studentId).push(att)
            })

            console.log(`[v0] Student IDs with attendance:`, Array.from(attendanceByStudent.keys()))

            // Assign attendance to students
            studentsWithHostel.forEach(student => {
              student.attendance = attendanceByStudent.get(student.id) || []
              if (student.attendance.length > 0) {
                console.log(`[v0] Student ${student.id} (${student.name}) has ${student.attendance.length} attendance records`)
              }
            })

            // Check if any attendance records couldn't be assigned
            const assignedStudentIds = new Set(studentsWithHostel.map(s => s.id))
            const unassignedAttendance = Array.from(attendanceByStudent.entries()).filter(([studentId]) => !assignedStudentIds.has(studentId))
            if (unassignedAttendance.length > 0) {
              console.log(`[v0] WARNING: ${unassignedAttendance.length} attendance records could not be assigned to students:`, unassignedAttendance)
            }

          } catch (attendanceError) {
            console.error("[v0] Error fetching attendance:", attendanceError)
            studentsWithHostel.forEach(student => {
              student.attendance = []
            })
          }
        }

        console.log("[v0] Found students:", studentsWithHostel.length)
        return studentsWithHostel
      } catch (error) {
        console.error("[v0] Error finding students:", error)
        return []
      }
    },

    findUnique: async (options: any) => {
      console.log("[v0] Finding unique student:", options.where.id || options.where.rollNo)

      try {
        let result

        if (options.where.id) {
          result = await sql`SELECT * FROM students WHERE id = ${options.where.id}`
        } else if (options.where.rollNo) {
          result = await sql`SELECT * FROM students WHERE "rollNo" = ${options.where.rollNo}`
        } else {
          return null
        }

        if (result.length === 0) return null

        const student: any = {
          ...result[0],
          hostel: { name: result[0].hostel }, // Convert string to object
        }

        // Fetch related data if includes are specified
        if (options?.include?.attendance) {
          student.attendance = await sql`
            SELECT * FROM attendance WHERE "studentId" = ${student.id}
            ORDER BY date DESC LIMIT 30
          `
        }
        if (options?.include?.bills) {
          student.bills = await sql`
            SELECT * FROM bills WHERE "studentId" = ${student.id}
            ORDER BY year DESC, month DESC LIMIT 12
          `
        }

        console.log("[v0] Found student:", student.name)
        return student
      } catch (error) {
        console.error("[v0] Error finding student:", error)
        return null
      }
    },

    create: async (options: any) => {
      const { name, rollNo, dept, year, hostelId, isMando } = options.data
      // Generate a simple ID since cuid() default might not be working
      const id = `std_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      const result = await sql`
        INSERT INTO students (id, name, "rollNo", "dept", "hostelId", year, "isMando", status, "createdAt", "updatedAt")
        VALUES (${id}, ${name}, ${rollNo}, ${dept || null}, ${hostelId}, ${year}, ${isMando}, 'ACTIVE', ${now}, ${now})
        RETURNING *
      `
      return result[0]
    },

    update: async (options: any) => {
      const { name, rollNumber, hostelId, year, isMando, mandoMultiplier } = options.data
      const result = await sql`
        UPDATE students SET
          name = ${name},
          "rollNo" = ${rollNumber},
          "hostelId" = ${hostelId},
          year = ${year},
          "isMando" = ${isMando},
          "company" = ${mandoMultiplier}
        WHERE id = ${options.where.id}
        RETURNING *
      `
      return result[0]
    },

    delete: async (options: any) => {
      await sql`DELETE FROM students WHERE id = ${options.where.id}`
      return { id: options.where.id }
    },
  },

  attendance: {
    findMany: async (options?: any) => {
      console.log("[v0] Finding attendance with options:", options)

      if (!options?.where?.date) {
        // Simple case - get recent attendance
        const result = await sql`
          SELECT a.*, s.name as student_name FROM attendance a
          LEFT JOIN students s ON a."studentId" = s.id
          ORDER BY a.date DESC LIMIT 100
        `
        return result.map((row: any) => ({
          ...row,
          student: { name: row.student_name },
        }))
      }

      const result = await sql`
        SELECT a.*, s.name as student_name FROM attendance a
        LEFT JOIN students s ON a."studentId" = s.id
        WHERE a.date >= ${options.where.date.gte} AND a.date <= ${options.where.date.lte}
        ORDER BY a.date ASC, s.name ASC
      `

      // Transform to include student object
      return result.map((row: any) => ({
        ...row,
        student: { name: row.student_name },
      }))
    },

    upsert: async (options: any) => {
      const { studentId, date, code, note } = options.create
      // Ensure date is treated as UTC
      const utcDate = new Date(date)
      utcDate.setUTCHours(0, 0, 0, 0) // Set to UTC midnight

      // Generate a simple ID since cuid() default might not be working
      const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      const result = await sql`
        INSERT INTO attendance (id, "studentId", date, code, note, "createdAt", "updatedAt")
        VALUES (${id}, ${studentId}, ${utcDate}, ${code}, ${note || null}, ${now}, ${now})
        ON CONFLICT ("studentId", date)
        DO UPDATE SET code = ${code}, note = ${note || null}, "updatedAt" = ${now}
        RETURNING *
      `
      return result[0]
    },

    count: async (options?: any) => {
      if (!options?.where?.date) {
        const result = await sql`SELECT COUNT(*) FROM attendance`
        return Number.parseInt(result[0].count)
      }

      const result = await sql`
        SELECT COUNT(*) FROM attendance
        WHERE date >= ${options.where.date.gte} AND date <= ${options.where.date.lte}
      `
      return Number.parseInt(result[0].count)
    },

    groupBy: async (options: any) => {
      const result = await sql`
        SELECT code, COUNT(*) as count
        FROM attendance
        WHERE date >= ${options.where.date.gte} AND date <= ${options.where.date.lte}
        GROUP BY code
      `
      return result.map((row: any) => ({
        code: row.code,
        _count: Number.parseInt(row.count),
      }))
    },
  },

  expense: {
    findMany: async (options?: any) => {
      try {
        if (!options?.where?.date) {
          const result = await sql`
            SELECT * FROM expenses 
            ORDER BY date DESC LIMIT 100
          `
          return result.map((row: any) => ({
            ...row,
            provisionItem: null, // No provision item relation for now
          }))
        }

        const result = await sql`
          SELECT * FROM expenses 
          WHERE date >= ${options.where.date.gte} AND date <= ${options.where.date.lte}
          ORDER BY date DESC
        `

        // Transform to include provisionItem object
        return result.map((row: any) => ({
          ...row,
          provisionItem: null, // No provision item relation for now
        }))
      } catch (error) {
        console.error("[v0] Error finding expenses:", error)
        // If expenses table doesn't exist, return empty array
        return []
      }
    },
  },

  provisionItem: {
    findMany: async (options?: any) => {
      try {
        let result

        // Handle where clause for case-insensitive name search
        if (options?.where?.name?.equals) {
          if (options.where.name.mode === 'insensitive') {
            result = await sql`SELECT * FROM provision_items WHERE LOWER(name) = LOWER(${options.where.name.equals}) ORDER BY name ASC`
          } else {
            result = await sql`SELECT * FROM provision_items WHERE name = ${options.where.name.equals} ORDER BY name ASC`
          }

          // Handle take limit
          if (options?.take && result.length > options.take) {
            result = result.slice(0, options.take)
          }
        } else {
          result = await sql`SELECT * FROM provision_items ORDER BY name ASC`
        }

        console.log("[v0] Found provision items:", result.length)

        // Add empty usage array for each provision item
        return result.map((item: any) => ({
          ...item,
          usage: [], // Empty usage array for now
        }))
      } catch (error) {
        console.error("[v0] Error finding provision items:", error)
        return []
      }
    },

    create: async (options: any) => {
      try {
        const { name, unit, unitCost, unitMeasure } = options.data
        // Generate a simple ID since cuid() default might not be working
        const id = `prov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date()
        const result = await sql`
          INSERT INTO provision_items (id, name, unit, "unitCost", "unitMeasure", "createdAt", "updatedAt")
          VALUES (${id}, ${name}, ${unit}, ${unitCost}, ${unitMeasure}, ${now}, ${now})
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating provision item:", error)
        throw error
      }
    },

    update: async (options: any) => {
      try {
        const { id } = options.where
        const { name, unit, unitCost, unitMeasure } = options.data
        const now = new Date()
        
        const result = await sql`
          UPDATE provision_items SET
            name = ${name},
            unit = ${unit},
            "unitCost" = ${unitCost},
            "unitMeasure" = ${unitMeasure},
            "updatedAt" = ${now}
          WHERE id = ${id}
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error updating provision item:", error)
        throw error
      }
    },

    delete: async (options: any) => {
      try {
        const { id } = options.where
        const result = await sql`
          DELETE FROM provision_items
          WHERE id = ${id}
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error deleting provision item:", error)
        throw error
      }
    },
  },

  bill: {
    findMany: async (options?: any) => {
      if (!options?.where) {
        const result = await sql`
          SELECT b.*, s.name as student_name FROM bills b
          LEFT JOIN students s ON b."studentId" = s.id
          ORDER BY b.year DESC, b.month DESC
        `
        return result.map((row: any) => ({
          ...row,
          student: { name: row.student_name },
        }))
      }

      let whereClause = ""
      const whereConditions = []

      if (options.where.month !== undefined) {
        whereConditions.push(`b.month = ${options.where.month}`)
      }
      if (options.where.year !== undefined) {
        whereConditions.push(`b.year = ${options.where.year}`)
      }

      if (whereConditions.length > 0) {
        whereClause = ` WHERE ${whereConditions.join(" AND ")}`
      }

      const result = await sql`
        SELECT b.*, s.name as student_name FROM bills b
        LEFT JOIN students s ON b."studentId" = s.id
        ${sql.unsafe(whereClause)}
        ORDER BY b.year DESC, b.month DESC
      `

      // Transform to include student object
      return result.map((row: any) => ({
        ...row,
        student: { name: row.student_name },
      }))
    },

    findUnique: async (options: any) => {
      try {
        let result
        if (options.where.month) {
          result = await sql`SELECT * FROM bills WHERE month = ${options.where.month}`
        } else {
          return null
        }

        if (result.length === 0) return null

        const bill = result[0]

        // Include studentBills if requested
        if (options?.include?.studentBills) {
          const studentBills = await sql`
            SELECT sb.*, s.name as student_name, s."rollNo", h.name as hostel_name
            FROM student_bills sb
            LEFT JOIN students s ON sb."studentId" = s.id
            LEFT JOIN hostels h ON s."hostelId" = h.id
            WHERE sb."billId" = ${bill.id}
          `
          bill.studentBills = studentBills.map((sb: any) => ({
            ...sb,
            student: {
              id: sb.studentId,
              name: sb.student_name,
              rollNo: sb.rollNo,
              hostel: { name: sb.hostel_name },
              attendance: [], // Will be populated if needed
            },
          }))
        }

        return bill
      } catch (error) {
        console.error("[v0] Error finding bill:", error)
        return null
      }
    },

    create: async (options: any) => {
      try {
        const {
          month, totalExpense, labourTotal, provisionTotal, carryForward,
          advanceTotal, perDayRate, totalMandays, mandoAmount, status
        } = options.data

        const id = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date()

        const result = await sql`
          INSERT INTO bills (
            id, month, "totalExpense", "labourTotal", "provisionTotal",
            "carryForward", "advanceTotal", "perDayRate", "totalMandays",
            "mandoAmount", status, "generatedAt", "createdAt", "updatedAt"
          ) VALUES (
            ${id}, ${month}, ${totalExpense || 0}, ${labourTotal || 0}, ${provisionTotal || 0},
            ${carryForward || 0}, ${advanceTotal || 0}, ${perDayRate || 0}, ${totalMandays || 0},
            ${mandoAmount || 70250}, ${status || 'DRAFT'}, ${now}, ${now}, ${now}
          )
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating bill:", error)
        throw error
      }
    },

    upsert: async (options: any) => {
      try {
        const month = options.where?.month || (options.update || options.create).month
        const {
          totalExpense, labourTotal, provisionTotal, carryForward,
          advanceTotal, perDayRate, provisionPerDayRate, advancePerDayRate,
          totalMandays, mandoAmount, status
        } = options.update || options.create

        const now = new Date()

        // First try to find existing bill
        const existing = await sql`SELECT id FROM bills WHERE month = ${month}`
        if (existing.length > 0) {
          // Update existing
          const result = await sql`
            UPDATE bills SET
              "totalExpense" = ${totalExpense || 0},
              "labourTotal" = ${labourTotal || 0},
              "provisionTotal" = ${provisionTotal || 0},
              "carryForward" = ${carryForward || 0},
              "advanceTotal" = ${advanceTotal || 0},
              "perDayRate" = ${perDayRate || 0},
              "provisionPerDayRate" = ${provisionPerDayRate || 25.00},
              "advancePerDayRate" = ${advancePerDayRate || 18.75},
              "totalMandays" = ${totalMandays || 0},
              "mandoAmount" = ${mandoAmount || 70250},
              status = ${status || 'DRAFT'},
              "updatedAt" = ${now}
            WHERE month = ${month}
            RETURNING *
          `
          return result[0]
        } else {
          // Create new
          const id = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const result = await sql`
            INSERT INTO bills (
              id, month, "totalExpense", "labourTotal", "provisionTotal",
              "carryForward", "advanceTotal", "perDayRate", "provisionPerDayRate",
              "advancePerDayRate", "totalMandays", "mandoAmount", status,
              "generatedAt", "createdAt", "updatedAt"
            ) VALUES (
              ${id}, ${month}, ${totalExpense || 0}, ${labourTotal || 0}, ${provisionTotal || 0},
              ${carryForward || 0}, ${advanceTotal || 0}, ${perDayRate || 0},
              ${provisionPerDayRate || 25.00}, ${advancePerDayRate || 18.75},
              ${totalMandays || 0}, ${mandoAmount || 70250}, ${status || 'DRAFT'},
              ${now}, ${now}, ${now}
            )
            RETURNING *
          `
          return result[0]
        }
      } catch (error) {
        console.error("[v0] Error upserting bill:", error)
        throw error
      }
    },
  },

  mandoCoverage: {
    upsert: async (options: any) => {
      const { month, year, totalCovered, boysAmount, girlsAmount, remainingBudget } = options.create
      const result = await sql`
        INSERT INTO "mandoCoverage" (month, year, "totalCovered", "boysAmount", "girlsAmount", "remainingBudget") 
        VALUES (${month}, ${year}, ${totalCovered}, ${boysAmount}, ${girlsAmount}, ${remainingBudget}) 
        ON CONFLICT (month, year) 
        DO UPDATE SET 
          "totalCovered" = ${totalCovered}, 
          "boysAmount" = ${boysAmount}, 
          "girlsAmount" = ${girlsAmount}, 
          "remainingBudget" = ${remainingBudget} 
        RETURNING *
      `
      return result[0]
    },
  },

  hostel: {
    findUnique: async (options: any) => {
      try {
        const result = await sql`SELECT * FROM hostels WHERE id = ${options.where.id}`
        return result.length > 0 ? result[0] : null
      } catch (error) {
        console.error("[v0] Error finding hostel:", error)
        return null
      }
    },

    create: async (options: any) => {
      try {
        const { id, name, description } = options.data
        const now = new Date()
        const result = await sql`
          INSERT INTO hostels (id, name, description, "createdAt", "updatedAt")
          VALUES (${id}, ${name}, ${description}, ${now}, ${now})
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating hostel:", error)
        throw error
      }
    },
  },

  user: {
    findMany: async (options?: any) => {
      try {
        let result
        if (options?.where) {
          // Apply filters if needed
          if (options.where.role) {
            result = await sql`SELECT * FROM users WHERE role = ${options.where.role} ORDER BY name ASC`
          } else {
            result = await sql`SELECT * FROM users ORDER BY name ASC`
          }
        } else {
          result = await sql`SELECT * FROM users ORDER BY name ASC`
        }
        
        console.log("[v0] Found users:", result.length)
        return result
      } catch (error) {
        console.error("[v0] Error finding users:", error)
        return []
      }
    },

    findUnique: async (options: any) => {
      try {
        let result
        if (options.where.id) {
          result = await sql`SELECT * FROM users WHERE id = ${options.where.id}`
        } else if (options.where.email) {
          result = await sql`SELECT * FROM users WHERE email = ${options.where.email}`
        } else {
          return null
        }

        if (result.length === 0) return null
        return result[0]
      } catch (error) {
        console.error("[v0] Error finding user:", error)
        return null
      }
    },

    create: async (options: any) => {
      try {
        const { name, email, role, password } = options.data
        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date()
        
        // Try with password first, fallback without if column doesn't exist
        let result
        try {
          result = await sql`
            INSERT INTO users (id, name, email, role, password, "createdAt", "updatedAt")
            VALUES (${id}, ${name}, ${email}, ${role}, ${password || null}, ${now}, ${now})
            RETURNING *
          `
        } catch (error: any) {
          if (error.code === '42703') { // Column doesn't exist
            result = await sql`
              INSERT INTO users (id, name, email, role, "createdAt", "updatedAt")
              VALUES (${id}, ${name}, ${email}, ${role}, ${now}, ${now})
              RETURNING *
            `
          } else {
            throw error
          }
        }
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating user:", error)
        throw error
      }
    },

    update: async (options: any) => {
      try {
        const { id } = options.where
        const { name, email, role } = options.data
        const now = new Date()
        
        const result = await sql`
          UPDATE users SET
            name = ${name},
            email = ${email},
            role = ${role},
            "updatedAt" = ${now}
          WHERE id = ${id}
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error updating user:", error)
        throw error
      }
    },

    delete: async (options: any) => {
      try {
        const { id } = options.where
        const result = await sql`
          DELETE FROM users
          WHERE id = ${id}
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error deleting user:", error)
        throw error
      }
    },
  },

  // Transaction support
  $transaction: async (operations: any[]) => {
    // Simple implementation - execute operations sequentially
    const results = []
    for (const operation of operations) {
      results.push(await operation)
    }
    return results
  },
}
