import { prisma } from "./db"

// Helper function to create audit logs
export async function createAuditLog(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  oldData?: any,
  newData?: any
) {
  try {
    console.log(`[v0] Creating audit log:`, { userId, action, entity, entityId })

    // Safely serialize data for storage
    const serializeData = (data: any) => {
      if (!data) return null
      try {
        // Remove any circular references and non-serializable properties
        const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
          // Handle Date objects
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() }
          }
          // Handle other special objects
          if (typeof value === 'object' && value !== null) {
            // Remove functions and other non-serializable properties
            const cleanedObj: any = {}
            for (const [k, v] of Object.entries(value)) {
              if (typeof v !== 'function' && k !== '_prisma') {
                cleanedObj[k] = v
              }
            }
            return cleanedObj
          }
          return value
        }))
        return cleaned
      } catch (error) {
        console.error('Error serializing audit data:', error)
        return { error: 'Failed to serialize data', originalType: typeof data }
      }
    }

    const result = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldData: serializeData(oldData),
        newData: serializeData(newData)
      }
    })
    console.log(`[v0] Audit log created successfully:`, result.id)
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Helper function to get current user from session
export async function getCurrentUserId(): Promise<string | null> {
  try {
    // Import NextAuth session handling
    const { getServerSession } = await import("next-auth")
    const { authOptions } = await import("@/lib/auth")

    const session = await getServerSession(authOptions)
    console.log("[v0] Session user data:", session?.user)
    console.log("[v0] Session user ID:", session?.user?.id)
    return session?.user?.id || null
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}