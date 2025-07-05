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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)
    const list = lists.find((l) => l.id === params.id && l.userId === decoded.userId)

    if (!list) {
      return NextResponse.json({ status: "error", message: "List not found" }, { status: 404 })
    }

    return NextResponse.json({
      status: "success",
      data: list,
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)
    const { name, description } = await request.json()

    const listIndex = lists.findIndex((l) => l.id === params.id && l.userId === decoded.userId)
    if (listIndex === -1) {
      return NextResponse.json({ status: "error", message: "List not found" }, { status: 404 })
    }

    lists[listIndex] = {
      ...lists[listIndex],
      name: name || lists[listIndex].name,
      description: description !== undefined ? description : lists[listIndex].description,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      status: "success",
      message: "List updated successfully",
      data: lists[listIndex],
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decoded = verifyToken(request)
    const listIndex = lists.findIndex((l) => l.id === params.id && l.userId === decoded.userId)

    if (listIndex === -1) {
      return NextResponse.json({ status: "error", message: "List not found" }, { status: 404 })
    }

    lists.splice(listIndex, 1)

    return NextResponse.json({
      status: "success",
      message: "List deleted successfully",
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 })
  }
}
