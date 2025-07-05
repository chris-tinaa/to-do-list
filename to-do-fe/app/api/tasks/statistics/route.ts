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

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    const userTasks = tasks.filter((task) => task.userId === decoded.userId)

    const statistics = {
      totalTasks: userTasks.length,
      completedTasks: userTasks.filter((task) => task.isCompleted).length,
      pendingTasks: userTasks.filter((task) => !task.isCompleted).length,
      highPriorityTasks: userTasks.filter((task) => task.priority === "high").length,
      mediumPriorityTasks: userTasks.filter((task) => task.priority === "medium").length,
      lowPriorityTasks: userTasks.filter((task) => task.priority === "low").length,
      overdueTasks: userTasks.filter(
        (task) => task.deadline && new Date(task.deadline) < new Date() && !task.isCompleted,
      ).length,
    }

    return NextResponse.json({
      status: "success",
      data: statistics,
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}
