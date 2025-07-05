import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Mock database
const tasks: any[] = []
const lists: any[] = []

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided")
  }

  const token = authHeader.substring(7)
  return jwt.verify(token, JWT_SECRET) as any
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)
    const listTasks = tasks.filter((task) => task.listId === params.id && task.userId === decoded.userId)

    return NextResponse.json({
      status: "success",
      data: listTasks,
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)
    const { title, description, priority, deadline } = await request.json()

    if (!title) {
      return NextResponse.json({ status: "error", message: "Title is required" }, { status: 400 })
    }

    const task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: description || "",
      isCompleted: false,
      priority: priority || "medium",
      deadline: deadline || null,
      listId: params.id,
      userId: decoded.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      list: { name: "Default List" },
    }

    tasks.push(task)

    return NextResponse.json(
      {
        status: "success",
        message: "Task created successfully",
        data: task,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}
