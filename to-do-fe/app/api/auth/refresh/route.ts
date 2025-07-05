import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret"

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json({ status: "error", message: "Refresh token is required" }, { status: 400 })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any

    // Generate new access token
    const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: "1h" })

    return NextResponse.json({
      status: "success",
      message: "Token refreshed successfully",
      data: { accessToken },
    })
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Invalid refresh token" }, { status: 401 })
  }
}
