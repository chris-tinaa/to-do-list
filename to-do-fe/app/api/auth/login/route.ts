import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

// Mock database - in production, use a real database
const users: any[] = [
  {
    id: "user_default_123",
    email: "chris-tinaa@example.com",
    firstName: "Chris",
    lastName: "Tinaa",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G", // SecurePass123!
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ status: "error", message: "Email and password are required" }, { status: 400 })
    }

    // Find user
    const user = users.find((u) => u.email === email)
    if (!user) {
      return NextResponse.json({ status: "error", message: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ status: "error", message: "Invalid credentials" }, { status: 401 })
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" })

    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" })

    // Remove password from response
    const { password: _, ...userResponse } = user

    return NextResponse.json({
      status: "success",
      message: "Login successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 })
  }
}
