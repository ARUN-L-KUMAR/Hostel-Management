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
        console.log('[SUCCESS] Department column fixed - using "dept" with proper quoting')

        const result = await sql`
          SELECT s.id, s.name, s."rollNo", s."dept", s.year, s.gender, s."isMando", s.company, s.status, s."hostelId", s."joinDate", s."leaveDate", s."createdAt", s."updatedAt", h.name as hostel_name
          FROM students s
          LEFT JOIN hostels h ON s."hostelId" = h.id
          ORDER BY s.name ASC
        `

        console.log('[v0] Sample raw student from database - all fields:', Object.keys(result[0] || {}))
        console.log('[v0] First student raw data:', result[0])

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
          // Only filter by mando status if explicitly requested
          if (options.where.isMando !== undefined) {
            if (options.where.isMando === 'ALL') {
              // Special flag to include all students (don't filter by mando status)
              console.log('[v1] Including ALL students (mando and non-mando)')
            } else {
              studentsWithHostel = studentsWithHostel.filter(s => s.isMando === options.where.isMando)
            }
          } else {
            // If no mando filter specified, exclude mando students (for attendance system)
            studentsWithHostel = studentsWithHostel.filter(s => !s.isMando)
          }
          if (options.where.status) {
            studentsWithHostel = studentsWithHostel.filter(s => s.status === options.where.status)
          }
          // Handle department filtering - both exact match and contains search
          if (options.where.dept) {
            if (typeof options.where.dept === 'string') {
              // Exact match for department
              studentsWithHostel = studentsWithHostel.filter(s => s.dept === options.where.dept)
              console.log(`[v0] Applied exact dept filter: ${options.where.dept}`)
            } else if (typeof options.where.dept === 'object' && options.where.dept.contains) {
              // Contains search for department
              const deptFilter = options.where.dept.contains.toLowerCase()
              studentsWithHostel = studentsWithHostel.filter(s => 
                s.dept && s.dept.toLowerCase().includes(deptFilter)
              )
              console.log(`[v0] Applied contains dept filter: ${deptFilter}`)
            }
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
        } else {
          // If no where clause, exclude mando students by default
          studentsWithHostel = studentsWithHostel.filter(s => !s.isMando)
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
      const { name, rollNo, dept, year, gender, hostelId, isMando } = options.data
      // Generate a simple ID since cuid() default might not be working
      const id = `std_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      const result = await sql`
        INSERT INTO students (id, name, "rollNo", "dept", "hostelId", year, gender, "isMando", status, "createdAt", "updatedAt")
        VALUES (${id}, ${name}, ${rollNo}, ${dept || null}, ${hostelId}, ${year}, ${gender || null}, ${isMando}, 'ACTIVE', ${now}, ${now})
        RETURNING *
      `
      return result[0]
    },

    update: async (options: any) => {
      try {
        const { id } = options.where
        const data = options.data
        const now = new Date()
        
        // Build the update fields based on what's provided
        const updates = []
        if (data.name !== undefined) updates.push(`name = '${data.name}'`)
        if (data.rollNumber !== undefined) updates.push(`"rollNo" = '${data.rollNumber}'`)
        if (data.hostelId !== undefined) updates.push(`"hostelId" = '${data.hostelId}'`)
        if (data.year !== undefined) updates.push(`year = ${data.year}`)
        if (data.isMando !== undefined) updates.push(`"isMando" = ${data.isMando}`)
        if (data.company !== undefined) updates.push(`company = '${data.company || null}'`)
        if (data.status !== undefined) updates.push(`status = '${data.status}'`)
        if (data.dept !== undefined) updates.push(`dept = '${data.dept || null}'`)
        if (data.leaveDate !== undefined) {
          const leaveDate = data.leaveDate ? `'${new Date(data.leaveDate).toISOString()}'` : 'NULL'
          updates.push(`"leaveDate" = ${leaveDate}`)
        }
        
        // Always update updatedAt
        updates.push(`"updatedAt" = '${now.toISOString()}'`)
        
        const result = await sql`
          UPDATE students SET ${sql.unsafe(updates.join(', '))}
          WHERE id = ${id}
          RETURNING *
        `
        
        if (result.length === 0) return null
        
        // If include hostel is requested, fetch hostel data
        if (options.include?.hostel) {
          const hostelResult = await sql`SELECT * FROM hostels WHERE id = ${result[0].hostelId}`
          result[0].hostel = hostelResult[0] || null
        }
        
        return result[0]
      } catch (error) {
        console.error("[v0] Error updating student:", error)
        throw error
      }
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
        // Simple case - get recent attendance (exclude mando students)
        const result = await sql`
          SELECT a.*, s.name as student_name FROM attendance a
          LEFT JOIN students s ON a."studentId" = s.id
          WHERE (s."isMando" IS NULL OR s."isMando" = false)
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
        AND (s."isMando" IS NULL OR s."isMando" = false)
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

    create: async (options: any) => {
      try {
        const { name, type, amount, date, description, billId } = options.data
        const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date()
        const result = await sql`
          INSERT INTO expenses (id, name, type, amount, date, description, "billId", "createdAt", "updatedAt")
          VALUES (${id}, ${name}, ${type}, ${amount}, ${date}, ${description}, ${billId || null}, ${now}, ${now})
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating expense:", error)
        throw error
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

  provisionUsage: {
    findMany: async (options?: any) => {
      try {
        let query = sql`
          SELECT pu.*, pi.name as provision_name, pi.unit, pi."unitCost"
          FROM provision_usage pu
          LEFT JOIN provision_items pi ON pu."provisionItemId" = pi.id
        `

        const whereConditions = []

        if (options?.where?.date) {
          if (options.where.date.gte) {
            whereConditions.push(sql`pu.date >= ${options.where.date.gte}`)
          }
          if (options.where.date.lte) {
            whereConditions.push(sql`pu.date <= ${options.where.date.lte}`)
          }
        }

        if (whereConditions.length > 0) {
          query = sql`${query} WHERE ${whereConditions[0]}`
          for (let i = 1; i < whereConditions.length; i++) {
            query = sql`${query} AND ${whereConditions[i]}`
          }
        }

        query = sql`${query} ORDER BY pu.date DESC`

        const result = await query

        return result.map((row: any) => ({
          ...row,
          provisionItem: {
            id: row.provisionItemId,
            name: row.provision_name,
            unit: row.unit,
            unitCost: row.unitCost,
          },
        }))
      } catch (error) {
        console.error("[v0] Error finding provision usages:", error)
        return []
      }
    },

    create: async (options: any) => {
      try {
        const { provisionItemId, date, fromDate, toDate, quantity } = options.data
        const id = `pu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date()
        const result = await sql`
          INSERT INTO provision_usage (id, "provisionItemId", date, "fromDate", "toDate", quantity, "createdAt", "updatedAt")
          VALUES (${id}, ${provisionItemId}, ${date}, ${fromDate || null}, ${toDate || null}, ${quantity}, ${now}, ${now})
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating provision usage:", error)
        throw error
      }
    },

    update: async (options: any) => {
      try {
        const { id } = options.where
        const { provisionItemId, date, fromDate, toDate, quantity } = options.data
        const now = new Date()

        const result = await sql`
          UPDATE provision_usage SET
            "provisionItemId" = ${provisionItemId},
            date = ${date},
            "fromDate" = ${fromDate || null},
            "toDate" = ${toDate || null},
            quantity = ${quantity},
            "updatedAt" = ${now}
          WHERE id = ${id}
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error updating provision usage:", error)
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


  outsider: {
    findMany: async (options?: any) => {
      try {
        let query = sql`SELECT * FROM outsiders`
        const whereConditions = []

        if (options?.where) {
          if (options.where.OR) {
            const orConditions = options.where.OR.map((condition: any) => {
              if (condition.name?.contains) {
                return sql`LOWER(name) LIKE LOWER(${`%${condition.name.contains}%`})`
              } else if (condition.phone?.contains) {
                return sql`LOWER(phone) LIKE LOWER(${`%${condition.phone.contains}%`})`
              } else if (condition.company?.contains) {
                return sql`LOWER(company) LIKE LOWER(${`%${condition.company.contains}%`})`
              }
              return null
            }).filter(Boolean)

            if (orConditions.length > 0) {
              whereConditions.push(sql`(${orConditions[0]})`)
              for (let i = 1; i < orConditions.length; i++) {
                whereConditions.push(sql`OR ${orConditions[i]}`)
              }
            }
          }
        }

        if (whereConditions.length > 0) {
          query = sql`${query} WHERE ${whereConditions[0]}`
          for (let i = 1; i < whereConditions.length; i++) {
            query = sql`${query} AND ${whereConditions[i]}`
          }
        }

        query = sql`${query} ORDER BY name ASC`

        const result = await query

        // Add meals if include is specified
        if (options?.include?.meals) {
          for (const outsider of result) {
            const meals = await sql`
              SELECT * FROM outsider_meal_records
              WHERE "outsiderId" = ${outsider.id}
              ORDER BY date DESC
              ${options.include.meals.take ? sql`LIMIT ${options.include.meals.take}` : sql``}
            `
            outsider.meals = meals
          }
        }

        return result
      } catch (error) {
        console.error("[v0] Error finding outsiders:", error)
        return []
      }
    },

    findUnique: async (options: any) => {
      try {
        const result = await sql`SELECT * FROM outsiders WHERE id = ${options.where.id}`
        if (result.length === 0) return null

        const outsider = result[0]

        // Add meals if include is specified
        if (options?.include?.meals) {
          const meals = await sql`
            SELECT * FROM outsider_meal_records
            WHERE "outsiderId" = ${outsider.id}
            ORDER BY date DESC
          `
          outsider.meals = meals
        }

        return outsider
      } catch (error) {
        console.error("[v0] Error finding outsider:", error)
        return null
      }
    },

    create: async (options: any) => {
      try {
        const { name, phone, company, designation, description } = options.data
        const now = new Date()
        const result = await sql`
          INSERT INTO outsiders (name, phone, company, designation, description, "createdAt")
          VALUES (${name}, ${phone || null}, ${company || null}, ${designation || null}, ${description || null}, ${now})
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating outsider:", error)
        throw error
      }
    },

    update: async (options: any) => {
      try {
        const { name, phone, company, designation, description } = options.data
        const now = new Date()
        const result = await sql`
          UPDATE outsiders SET
            name = ${name},
            phone = ${phone || null},
            company = ${company || null},
            designation = ${designation || null},
            description = ${description || null},
            "updatedAt" = ${now}
          WHERE id = ${options.where.id}
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error updating outsider:", error)
        throw error
      }
    },

    delete: async (options: any) => {
      try {
        await sql`DELETE FROM outsiders WHERE id = ${options.where.id}`
        return { id: options.where.id }
      } catch (error) {
        console.error("[v0] Error deleting outsider:", error)
        throw error
      }
    },
  },

  mealRecord: {
    findMany: async (options?: any) => {
      try {
        let query = sql`SELECT * FROM meal_records`
        const whereConditions = []

        if (options?.where) {
          if (options.where.studentId) {
            whereConditions.push(sql`"studentId" = ${options.where.studentId}`)
          }
          if (options.where.date?.gte) {
            whereConditions.push(sql`date >= ${options.where.date.gte}`)
          }
          if (options.where.date?.lte) {
            whereConditions.push(sql`date <= ${options.where.date.lte}`)
          }
        }

        if (whereConditions.length > 0) {
          query = sql`${query} WHERE ${whereConditions[0]}`
          for (let i = 1; i < whereConditions.length; i++) {
            query = sql`${query} AND ${whereConditions[i]}`
          }
        }

        query = sql`${query} ORDER BY date ASC`

        const result = await query

        // Add student relation if include is specified
        if (options?.include?.student) {
          for (const record of result) {
            const student = await sql`SELECT * FROM students WHERE id = ${record.studentId}`
            record.student = student[0] || null
          }
        }

        return result
      } catch (error) {
        console.error("[v0] Error finding meal records:", error)
        return []
      }
    },

    create: async (options: any) => {
      try {
        const { studentId, date, breakfast, lunch, dinner, mealRate } = options.data
        const result = await sql`
          INSERT INTO meal_records ("studentId", date, breakfast, lunch, dinner, "mealRate")
          VALUES (${studentId}, ${date}, ${breakfast || false}, ${lunch || false}, ${dinner || false}, ${mealRate || 50})
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating meal record:", error)
        throw error
      }
    },

    update: async (options: any) => {
      try {
        const { id } = options.where
        const setParts = []
        const params = []

        if (options.data.breakfast !== undefined) {
          setParts.push('breakfast = ?')
          params.push(options.data.breakfast)
        }
        if (options.data.lunch !== undefined) {
          setParts.push('lunch = ?')
          params.push(options.data.lunch)
        }
        if (options.data.dinner !== undefined) {
          setParts.push('dinner = ?')
          params.push(options.data.dinner)
        }

        if (setParts.length === 0) return null

        const query = `UPDATE meal_records SET ${setParts.join(", ")} WHERE id = '${id}' RETURNING *`

        const result = await sql.unsafe(query)
        return (result as any)[0]
      } catch (error) {
        console.error("[v0] Error updating meal record:", error)
        throw error
      }
    },

    upsert: async (options: any) => {
      try {
        const { studentId, date } = options.where.studentId_date || options.where
        const createData = options.create
        const updateData = options.update

        // First try to find existing record
        const existing = await sql`SELECT * FROM meal_records WHERE "studentId" = ${studentId} AND date = ${date}`

        if (existing.length > 0) {
          // Update existing
          const result = await sql`
            UPDATE meal_records SET
              breakfast = ${updateData.breakfast !== undefined ? updateData.breakfast : existing[0].breakfast},
              lunch = ${updateData.lunch !== undefined ? updateData.lunch : existing[0].lunch},
              dinner = ${updateData.dinner !== undefined ? updateData.dinner : existing[0].dinner}
            WHERE "studentId" = ${studentId} AND date = ${date}
            RETURNING *
          `
          return result[0]
        } else {
          // Create new
          const result = await sql`
            INSERT INTO meal_records ("studentId", date, breakfast, lunch, dinner, "mealRate")
            VALUES (${studentId}, ${date}, ${createData.breakfast || false}, ${createData.lunch || false}, ${createData.dinner || false}, ${createData.mealRate || 50})
            RETURNING *
          `
          return result[0]
        }
      } catch (error) {
        console.error("[v0] Error upserting meal record:", error)
        throw error
      }
    },
  },

  outsiderMealRecord: {
    findMany: async (options?: any) => {
      try {
        let query = sql`SELECT * FROM outsider_meal_records`
        const whereConditions = []

        if (options?.where) {
          if (options.where.outsiderId) {
            whereConditions.push(sql`"outsiderId" = ${options.where.outsiderId}`)
          }
          if (options.where.date?.gte) {
            whereConditions.push(sql`date >= ${options.where.date.gte}`)
          }
          if (options.where.date?.lte) {
            whereConditions.push(sql`date <= ${options.where.date.lte}`)
          }
        }

        if (whereConditions.length > 0) {
          query = sql`${query} WHERE ${whereConditions[0]}`
          for (let i = 1; i < whereConditions.length; i++) {
            query = sql`${query} AND ${whereConditions[i]}`
          }
        }

        query = sql`${query} ORDER BY date DESC`

        const result = await query

        // Add outsider relation if include is specified
        if (options?.include?.outsider) {
          for (const record of result) {
            const outsider = await sql`SELECT * FROM outsiders WHERE id = ${record.outsiderId}`
            record.outsider = outsider[0] || null
          }
        }

        return result
      } catch (error) {
        console.error("[v0] Error finding outsider meal records:", error)
        return []
      }
    },

    upsert: async (options: any) => {
      try {
        const { outsiderId, date } = options.where.outsiderId_date || options.where
        const createData = options.create
        const updateData = options.update

        // First try to find existing record
        const existing = await sql`SELECT * FROM outsider_meal_records WHERE "outsiderId" = ${outsiderId} AND date = ${date}`

        if (existing.length > 0) {
          // Update existing
          const result = await sql`
            UPDATE outsider_meal_records SET
              breakfast = ${updateData.breakfast !== undefined ? updateData.breakfast : existing[0].breakfast},
              lunch = ${updateData.lunch !== undefined ? updateData.lunch : existing[0].lunch},
              dinner = ${updateData.dinner !== undefined ? updateData.dinner : existing[0].dinner}
            WHERE "outsiderId" = ${outsiderId} AND date = ${date}
            RETURNING *
          `
          return result[0]
        } else {
          // Create new
          const result = await sql`
            INSERT INTO outsider_meal_records ("outsiderId", date, breakfast, lunch, dinner, "mealRate")
            VALUES (${outsiderId}, ${date}, ${createData.breakfast || false}, ${createData.lunch || false}, ${createData.dinner || false}, ${createData.mealRate || 50})
            RETURNING *
          `
          return result[0]
        }
      } catch (error) {
        console.error("[v0] Error upserting outsider meal record:", error)
        throw error
      }
    },
  },

  mandoSettings: {
    findFirst: async (options?: any) => {
      try {
        console.log('[v0] Finding mando settings with options:', options)

        let query = sql`SELECT * FROM mando_settings`
        const whereConditions = []

        // Handle id filter
        if (options?.where?.id) {
          console.log('[v0] Filtering by id:', options.where.id)
          whereConditions.push(sql`id = ${options.where.id}`)
        }

        // Handle isActive filter
        if (options?.where?.isActive !== undefined) {
          console.log('[v0] Filtering by isActive:', options.where.isActive)
          whereConditions.push(sql`"isActive" = ${options.where.isActive}`)
        }

        if (whereConditions.length > 0) {
          query = sql`${query} WHERE ${whereConditions[0]}`
          for (let i = 1; i < whereConditions.length; i++) {
            query = sql`${query} AND ${whereConditions[i]}`
          }
        }

        query = sql`${query} ORDER BY "createdAt" DESC LIMIT 1`

        const result = await query
        console.log('[v0] Query result:', result)
        console.log('[v0] Returning:', result[0] || null)
        return result[0] || null
      } catch (error) {
        console.error("[v0] Error finding mando settings:", error)
        return null
      }
    },

    upsert: async (options: any) => {
      try {
        const { id } = options.where
        const createData = options.create
        const updateData = options.update

        // First try to find existing record
        const existing = await sql`SELECT * FROM mando_settings WHERE id = ${id}`

        if (existing.length > 0) {
          // Update existing
          const result = await sql`
            UPDATE mando_settings SET
              "perMealRate" = ${updateData.perMealRate || createData.perMealRate},
              "outsiderMealRate" = ${updateData.outsiderMealRate || createData.outsiderMealRate},
              "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
          `
          return result[0]
        } else {
          // Create new
          const result = await sql`
            INSERT INTO mando_settings (id, "perMealRate", "outsiderMealRate", "createdAt", "updatedAt")
            VALUES (${id}, ${createData.perMealRate}, ${createData.outsiderMealRate}, NOW(), NOW())
            RETURNING *
          `
          return result[0]
        }
      } catch (error) {
        console.error("[v0] Error upserting mando settings:", error)
        throw error
      }
    },

    update: async (options: any) => {
      try {
        const { id } = options.where
        const data = options.data

        console.log('[v0] Updating mando settings with id:', id, 'data:', data)

        const result = await sql`
          UPDATE mando_settings SET
            "perMealRate" = ${data.perMealRate},
            "outsiderMealRate" = ${data.outsiderMealRate},
            "updatedAt" = NOW()
          WHERE id = ${id}
          RETURNING *
        `
        
        console.log('[v0] Update result:', result)
        return result[0]
      } catch (error) {
        console.error("[v0] Error updating mando settings:", error)
        throw error
      }
    },

    create: async (options: any) => {
      try {
        const data = options.data

        const result = await sql`
          INSERT INTO mando_settings (id, "perMealRate", "outsiderMealRate", "createdAt", "updatedAt")
          VALUES (${data.id}, ${data.perMealRate}, ${data.outsiderMealRate}, NOW(), NOW())
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating mando settings:", error)
        throw error
      }
    },
  },

  semester: {
    findMany: async (options?: any) => {
      try {
        let query = sql`SELECT * FROM semesters`
        const whereConditions: any[] = []

        if (options?.where) {
          // Add where conditions as needed
        }

        if (whereConditions.length > 0) {
          query = sql`${query} WHERE ${whereConditions[0]}`
          for (let i = 1; i < whereConditions.length; i++) {
            query = sql`${query} AND ${whereConditions[i]}`
          }
        }

        query = sql`${query} ORDER BY "startDate" DESC`

        const result = await query

        // Include related data if requested
        if (options?.include?.feeStructures) {
          for (const semester of result) {
            const feeStructures = await sql`SELECT * FROM fee_structures WHERE "semesterId" = ${semester.id}`
            semester.feeStructures = feeStructures
          }
        }

        if (options?.include?.feeRecords) {
          for (const semester of result) {
            const feeRecords = await sql`SELECT COUNT(*) as count FROM fee_records WHERE "semesterId" = ${semester.id}`
            semester._count = { feeRecords: Number(feeRecords[0].count) }
          }
        }

        return result
      } catch (error) {
        console.error("[v0] Error finding semesters:", error)
        return []
      }
    },

    create: async (options: any) => {
      try {
        const { name, startDate, endDate } = options.data
        const now = new Date()
        const result = await sql`
          INSERT INTO semesters (name, "startDate", "endDate", "createdAt", "updatedAt")
          VALUES (${name}, ${startDate}, ${endDate}, ${now}, ${now})
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating semester:", error)
        throw error
      }
    },

    update: async (options: any) => {
      try {
        const { id } = options.where
        const { name, startDate, endDate } = options.data
        const now = new Date()

        const result = await sql`
          UPDATE semesters SET
            name = ${name},
            "startDate" = ${startDate},
            "endDate" = ${endDate},
            "updatedAt" = ${now}
          WHERE id = ${id}
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error updating semester:", error)
        throw error
      }
    },

    delete: async (options: any) => {
      try {
        const { id } = options.where
        const result = await sql`
          DELETE FROM semesters
          WHERE id = ${id}
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error deleting semester:", error)
        throw error
      }
    },
  },

  feeStructure: {
    findFirst: async (options?: any) => {
      try {
        let query = sql`SELECT * FROM fee_structures`
        const whereConditions = []

        if (options?.where?.semesterId) {
          whereConditions.push(sql`"semesterId" = ${options.where.semesterId}`)
        }

        if (whereConditions.length > 0) {
          query = sql`${query} WHERE ${whereConditions[0]}`
          for (let i = 1; i < whereConditions.length; i++) {
            query = sql`${query} AND ${whereConditions[i]}`
          }
        }

        query = sql`${query} ORDER BY "createdAt" DESC LIMIT 1`

        const result = await query

        // Include semester relation if requested
        if (options?.include?.semester && result.length > 0) {
          const semester = await sql`SELECT * FROM semesters WHERE id = ${result[0].semesterId}`
          result[0].semester = semester[0] || null
        }

        return result[0] || null
      } catch (error) {
        console.error("[v0] Error finding fee structure:", error)
        return null
      }
    },

    create: async (options: any) => {
      try {
        const { semesterId, baseAmount, adjustment, finalAmount } = options.data
        const now = new Date()
        const result = await sql`
          INSERT INTO fee_structures ("semesterId", "baseAmount", adjustment, "finalAmount", "createdAt")
          VALUES (${semesterId}, ${baseAmount}, ${adjustment || 0}, ${finalAmount}, ${now})
          RETURNING *
        `
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating fee structure:", error)
        throw error
      }
    },

    updateMany: async (options: any) => {
      try {
        const { semesterId } = options.where
        const data = options.data
        const now = new Date()

        const result = await sql`
          UPDATE fee_structures SET
            "baseAmount" = ${data.baseAmount},
            adjustment = ${data.adjustment || 0},
            "finalAmount" = ${data.finalAmount}
          WHERE "semesterId" = ${semesterId}
          RETURNING *
        `
        return result
      } catch (error) {
        console.error("[v0] Error updating fee structures:", error)
        throw error
      }
    },

    deleteMany: async (options: any) => {
      try {
        const { semesterId } = options.where
        const result = await sql`
          DELETE FROM fee_structures
          WHERE "semesterId" = ${semesterId}
          RETURNING *
        `
        return result
      } catch (error) {
        console.error("[v0] Error deleting fee structures:", error)
        throw error
      }
    },
  },

  feeRecord: {
    findMany: async (options?: any) => {
      try {
        let query = sql`
          SELECT fr.*, s.name as student_name, s."rollNo", s.dept, s.year, h.name as hostel_name,
            sem.name as semester_name
          FROM fee_records fr
          LEFT JOIN students s ON fr."studentId" = s.id
          LEFT JOIN hostels h ON s."hostelId" = h.id
          LEFT JOIN semesters sem ON fr."semesterId" = sem.id
        `
        const whereConditions = []

        if (options?.where?.studentId) {
          whereConditions.push(sql`fr."studentId" = ${options.where.studentId}`)
        }

        if (options?.where?.semesterId) {
          whereConditions.push(sql`fr."semesterId" = ${options.where.semesterId}`)
        }

        if (whereConditions.length > 0) {
          query = sql`${query} WHERE ${whereConditions[0]}`
          for (let i = 1; i < whereConditions.length; i++) {
            query = sql`${query} AND ${whereConditions[i]}`
          }
        }

        query = sql`${query} ORDER BY s.name ASC`

        const result = await query

        // Transform to include nested objects
        return result.map((row: any) => ({
          ...row,
          student: {
            id: row.studentId,
            name: row.student_name,
            rollNo: row.rollNo,
            dept: row.dept,
            year: row.year,
            hostel: row.hostel_name ? { name: row.hostel_name } : null,
          },
          semester: {
            id: row.semesterId,
            name: row.semester_name,
          },
        }))
      } catch (error) {
        console.error("[v0] Error finding fee records:", error)
        return []
      }
    },

    findUnique: async (options: any) => {
      try {
        const result = await sql`
          SELECT fr.*, s.name as student_name, s."rollNo", s.dept, s.year, h.name as hostel_name,
                 sem.name as semester_name, sem."startDate", sem."endDate"
          FROM fee_records fr
          LEFT JOIN students s ON fr."studentId" = s.id
          LEFT JOIN hostels h ON s."hostelId" = h.id
          LEFT JOIN semesters sem ON fr."semesterId" = sem.id
          WHERE fr."studentId" = ${options.where.studentId} AND fr."semesterId" = ${options.where.semesterId}
        `

        if (result.length === 0) return null

        const row = result[0]
        return {
          ...row,
          student: {
            id: row.studentId,
            name: row.student_name,
            rollNo: row.rollNo,
            dept: row.dept,
            year: row.year,
            hostel: row.hostel_name ? { name: row.hostel_name } : null,
          },
          semester: {
            id: row.semesterId,
            name: row.semester_name,
            startDate: row.startDate,
            endDate: row.endDate,
          },
        }
      } catch (error) {
        console.error("[v0] Error finding fee record:", error)
        return null
      }
    },

    create: async (options: any) => {
      try {
        const { studentId, semesterId, totalDue, amountPaid, balance, paymentMode } = options.data
        const now = new Date()
        console.log("[v0] Creating fee record with data:", { studentId, semesterId, totalDue, amountPaid, balance, paymentMode })

        const result = await sql`
          INSERT INTO fee_records ("studentId", "semesterId", "totalDue", "amountPaid", balance, "paymentMode", "paymentDate", "createdAt", "updatedAt")
          VALUES (${studentId}, ${semesterId}, ${totalDue}, ${amountPaid || 0}, ${balance}, ${paymentMode || null}, ${now}, ${now}, ${now})
          RETURNING *
        `

        console.log("[v0] Fee record create result:", result)

        if (!result || result.length === 0) {
          throw new Error("Failed to create fee record - no data returned")
        }

        console.log("[v0] Returning fee record:", result[0])
        return result[0]
      } catch (error) {
        console.error("[v0] Error creating fee record:", error)
        throw error
      }
    },

    update: async (options: any) => {
      try {
        const { amountPaid, balance, paymentMode } = options.data
        const now = new Date()

        let result

        if (options.where.id) {
          // Update by ID
          result = await sql`
            UPDATE fee_records SET
              "amountPaid" = ${amountPaid},
              balance = ${balance},
              "paymentMode" = ${paymentMode || null},
              "paymentDate" = ${now}
            WHERE id = ${options.where.id}
            RETURNING *
          `
        } else if (options.where.studentId_semesterId) {
          // Update by Prisma composite key format
          const { studentId, semesterId } = options.where.studentId_semesterId
          result = await sql`
            UPDATE fee_records SET
              "amountPaid" = ${amountPaid},
              balance = ${balance},
              "paymentMode" = ${paymentMode || null},
              "paymentDate" = ${now}
            WHERE "studentId" = ${studentId} AND "semesterId" = ${semesterId}
            RETURNING *
          `
        } else if (options.where.studentId && options.where.semesterId) {
          // Update by direct composite key
          result = await sql`
            UPDATE fee_records SET
              "amountPaid" = ${amountPaid},
              balance = ${balance},
              "paymentMode" = ${paymentMode || null},
              "paymentDate" = ${now}
            WHERE "studentId" = ${options.where.studentId} AND "semesterId" = ${options.where.semesterId}
            RETURNING *
          `
        } else {
          throw new Error("Invalid where clause for fee record update")
        }

        return result[0]
      } catch (error) {
        console.error("[v0] Error updating fee record:", error)
        throw error
      }
    },

    deleteMany: async (options: any) => {
      try {
        const { semesterId } = options.where
        const result = await sql`
          DELETE FROM fee_records
          WHERE "semesterId" = ${semesterId}
          RETURNING *
        `
        return result
      } catch (error) {
        console.error("[v0] Error deleting fee records:", error)
        throw error
      }
    },
  },

  // Raw query support
  $queryRawUnsafe: async (query: string, ...params: any[]) => {
    // For Neon, we need to use template literals, so we'll interpolate the query
    // This is a simplified implementation - in production you'd want proper parameter binding
    let interpolatedQuery = query
    params.forEach((param, index) => {
      interpolatedQuery = interpolatedQuery.replace(new RegExp(`\\$${index + 1}`, 'g'), typeof param === 'string' ? `'${param}'` : param)
    })
    const result = await sql.unsafe(interpolatedQuery)
    return result
  },
}
