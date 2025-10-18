import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAuditLog, getCurrentUserId } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, role, password, permissions } = body

    console.log("Updating user with data:", { name, email, role, permissions: permissions || 'none' })

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = { name, email, role }

    // Include permissions if provided
    if (permissions !== undefined) {
      updateData.permissions = permissions
    }

    // Hash password if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    console.log("Final update data:", updateData)

    // Get the old user data for audit logging
    const oldUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData
    })

    console.log("User updated successfully:", user.name, "with permissions:", user.permissions)

    // Log the update
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "UPDATE",
      "user",
      user.id,
      oldUser ? { name: oldUser.name, email: oldUser.email, role: oldUser.role, permissions: oldUser.permissions } : null,
      { name: user.name, email: user.email, role: user.role, permissions: user.permissions }
    )

    // Remove password from response
    const { password: _, ...userResponse } = user
    return NextResponse.json(userResponse)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user data before deletion for audit logging
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id }
    })

    await prisma.user.delete({
      where: { id: params.id }
    })

    // Log the deletion
    const currentUserId = await getCurrentUserId()
    await createAuditLog(
      currentUserId,
      "DELETE",
      "user",
      params.id,
      userToDelete ? { name: userToDelete.name, email: userToDelete.email, role: userToDelete.role, permissions: userToDelete.permissions } : null,
      null
    )

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}