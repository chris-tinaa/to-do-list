import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Mock database
const tasks: any[] = []

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided")
  }

  const token = authHeader.substring(7)
  return jwt.verify(token, JWT_SECRET) as any
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)
    const taskIndex = tasks.findIndex((t) => t.id === params.id && t.userId === decoded.userId)

    if (taskIndex === -1) {
      return NextResponse.json({ status: "error", message: "Task not found" }, { status: 404 })
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      isCompleted: true,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      status: "success",
      message: "Task marked as completed",
      data: tasks[taskIndex],
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}
