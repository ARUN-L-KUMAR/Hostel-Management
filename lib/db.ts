import { neon } from "@neondatabase/serverless"

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL!)

// Create a Prisma-like interface for database operations
export const prisma = {
  student: {
    findMany: async (options?: any) => {
      console.log("[v0] Finding students with options:", JSON.stringify(options))

      try {
        // Get all active students
        const result = await sql`SELECT * FROM students WHERE status = 'ACTIVE' ORDER BY name ASC`
        
        let studentsWithHostel = result.map((student: any) => ({
          ...student,
          hostel: { name: student.hostel }, // Convert string to object
          attendance: [], // Initialize empty attendance array
        }))

        // If attendance is requested, fetch it for each student
        if (options?.include?.attendance && studentsWithHostel.length > 0) {
          for (const student of studentsWithHostel) {
            try {
              if (options.include.attendance.where?.date) {
                // Query with date filter
                const attendanceResult = await sql`
                  SELECT * FROM attendance 
                  WHERE "studentId" = ${student.id} 
                  AND date >= ${options.include.attendance.where.date.gte} 
                  AND date <= ${options.include.attendance.where.date.lte}
                  ORDER BY date ASC
                `
                student.attendance = attendanceResult || []
              } else {
                // Query without date filter
                const attendanceResult = await sql`
                  SELECT * FROM attendance 
                  WHERE "studentId" = ${student.id} 
                  ORDER BY date ASC
                `
                student.attendance = attendanceResult || []
              }
            } catch (attendanceError) {
              console.error("[v0] Error fetching attendance for student:", student.id, attendanceError)
              student.attendance = []
            }
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
      const { name, rollNumber, hostel, year, isMando, mandoMultiplier } = options.data
      // Generate a simple ID since cuid() default might not be working
      const id = `std_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      const result = await sql`
        INSERT INTO students (id, name, "rollNo", "hostelId", year, "isMando", "company", status, "createdAt", "updatedAt")
        VALUES (${id}, ${name}, ${rollNumber}, ${hostel}, ${year}, ${isMando}, ${mandoMultiplier}, 'ACTIVE', ${now}, ${now})
        RETURNING *
      `
      return result[0]
    },

    update: async (options: any) => {
      const { name, rollNumber, hostel, year, isMando, mandoMultiplier } = options.data
      const result = await sql`
        UPDATE students SET
          name = ${name},
          "rollNo" = ${rollNumber},
          "hostelId" = ${hostel},
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
      const { studentId, date, breakfast, lunch, dinner } = options.create
      const result = await sql`
        INSERT INTO attendance ("studentId", date, breakfast, lunch, dinner) 
        VALUES (${studentId}, ${date}, ${breakfast}, ${lunch}, ${dinner}) 
        ON CONFLICT ("studentId", date) 
        DO UPDATE SET breakfast = ${breakfast}, lunch = ${lunch}, dinner = ${dinner} 
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
        SELECT breakfast, lunch, dinner, COUNT(*) as count 
        FROM attendance 
        WHERE date >= ${options.where.date.gte} AND date <= ${options.where.date.lte} 
        GROUP BY breakfast, lunch, dinner
      `
      return result.map((row: any) => ({
        breakfast: row.breakfast,
        lunch: row.lunch,
        dinner: row.dinner,
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
        const result = await sql`SELECT * FROM provision_items ORDER BY name ASC`
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
        const { name, unit, unitCost, category } = options.data
        const result = await sql`
          INSERT INTO provision_items (name, unit, unit_cost, category) 
          VALUES (${name}, ${unit}, ${unitCost}, ${category}) 
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating provision item:", error)
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

    upsert: async (options: any) => {
      const { studentId, month, year, totalAmount, mandoCovered, finalAmount, status } = options.create
      const result = await sql`
        INSERT INTO bills ("studentId", month, year, "totalAmount", "mandoCovered", "finalAmount", status) 
        VALUES (${studentId}, ${month}, ${year}, ${totalAmount}, ${mandoCovered}, ${finalAmount}, ${status}) 
        ON CONFLICT ("studentId", month, year) 
        DO UPDATE SET 
          "totalAmount" = ${totalAmount}, 
          "mandoCovered" = ${mandoCovered}, 
          "finalAmount" = ${finalAmount}, 
          status = ${status} 
        RETURNING *
      `
      return result[0]
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
