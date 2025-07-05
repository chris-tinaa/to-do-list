import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Mock database
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

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request)

    const userLists = lists.filter((list) => list.userId === decoded.userId)

    return NextResponse.json({
      status: "success",
      data: userLists,
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request)
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ status: "error", message: "Name is required" }, { status: 400 })
    }

    const list = {
      id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: description || "",
      userId: decoded.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { tasks: 0 },
    }

    lists.push(list)

    return NextResponse.json(
      {
        status: "success",
        message: "List created successfully",
        data: list,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}
