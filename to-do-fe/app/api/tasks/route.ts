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
    const url = new URL(request.url)

    // Get query parameters
    const isCompleted = url.searchParams.get("isCompleted")
    const priority = url.searchParams.get("priority")
    const sortBy = url.searchParams.get("sortBy") || "createdAt"
    const sortOrder = url.searchParams.get("sortOrder") || "desc"
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")

    let userTasks = tasks.filter((task) => task.userId === decoded.userId)

    // Apply filters
    if (isCompleted !== null) {
      userTasks = userTasks.filter((task) => task.isCompleted === (isCompleted === "true"))
    }

    if (priority) {
      userTasks = userTasks.filter((task) => task.priority === priority)
    }

    // Apply sorting
    userTasks.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === "deadline") {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const paginatedTasks = userTasks.slice(offset, offset + limit)

    return NextResponse.json({
      status: "success",
      data: paginatedTasks,
      pagination: {
        total: userTasks.length,
        limit,
        offset,
        hasMore: offset + limit < userTasks.length,
      },
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}
