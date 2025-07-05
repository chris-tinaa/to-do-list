import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, List, Users, Clock } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Task Management API</h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete API collection for Task Management system with Lists and Tasks CRUD operations
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete authentication system with JWT tokens, user registration, login, and profile management.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <List className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <CardTitle>Lists Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, update, and organize your task lists with full CRUD operations and statistics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-purple-600 mb-2" />
              <CardTitle>Task Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive task management with priorities, deadlines, filtering, and sorting capabilities.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 mx-auto text-orange-600 mb-2" />
              <CardTitle>Advanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Due date tracking, task statistics, bulk operations, and comprehensive API documentation.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints Overview</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔐 Authentication</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• POST /api/auth/register - Register new user</li>
                <li>• POST /api/auth/login - User login</li>
                <li>• POST /api/auth/refresh - Refresh tokens</li>
                <li>• POST /api/auth/logout - User logout</li>
                <li>• PUT /api/auth/profile - Update profile</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Lists Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• GET /api/lists - Get all lists</li>
                <li>• POST /api/lists - Create new list</li>
                <li>• GET /api/lists/[id] - Get list by ID</li>
                <li>• PUT /api/lists/[id] - Update list</li>
                <li>• DELETE /api/lists/[id] - Delete list</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">✅ Tasks Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• GET /api/tasks - Get all user tasks</li>
                <li>• POST /api/lists/[id]/tasks - Create task</li>
                <li>• GET /api/tasks/[id] - Get task by ID</li>
                <li>• PUT /api/tasks/[id] - Update task</li>
                <li>• DELETE /api/tasks/[id] - Delete task</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🏠 Health & Info</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• GET /api/health - Health check</li>
                <li>• GET /api/tasks/statistics - Task stats</li>
                <li>• GET /api/lists/statistics - List stats</li>
                <li>• GET /api/tasks/due-this-week - Due tasks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
