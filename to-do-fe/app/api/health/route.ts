import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "success",
    message: "Task Management API is healthy",
    data: {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    },
  })
}
