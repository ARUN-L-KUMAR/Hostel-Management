import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, password, permissions } = body

    console.log("Received user creation request:", { name, email, role, permissions: permissions || 'none' })

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: "Name, email, role, and password are required" },
        { status: 400 }
      )
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    const finalPermissions = permissions || (role === "ADMIN"
      ? ["dashboard", "attendance", "students", "mando-students", "outsiders", "provisions", "billing", "expenses", "reports", "admin"]
      : [] // No default permissions for managers - admin must select manually
    )

    console.log("Final permissions to save:", finalPermissions)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password: hashedPassword,
        permissions: finalPermissions
      }
    })

    console.log("User created successfully with permissions:", user.permissions)

    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}