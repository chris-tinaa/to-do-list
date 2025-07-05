"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, CheckCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface TaskList {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  _count: { tasks: number }
}

interface Task {
  id: string
  title: string
  description: string
  isCompleted: boolean
  priority: "low" | "medium" | "high"
  deadline: string | null
  createdAt: string
  updatedAt: string
  listId: string
  list: { name: string }
}

export default function DashboardPage() {
  const [lists, setLists] = useState<TaskList[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [statistics, setStatistics] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [newListOpen, setNewListOpen] = useState(false)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [selectedListId, setSelectedListId] = useState("")
  const router = useRouter()

  const [newList, setNewList] = useState({ name: "", description: "" })
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    deadline: "",
    listId: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/auth/login")
      return
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const headers = { Authorization: `Bearer ${token}` }

      const [listsRes, tasksRes, statsRes] = await Promise.all([
        fetch("/api/lists", { headers }),
        fetch("/api/tasks", { headers }),
        fetch("/api/tasks/statistics", { headers }),
      ])

      if (listsRes.ok) {
        const listsData = await listsRes.json()
        setLists(listsData.data)
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData.data)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStatistics(statsData.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createList = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newList),
      })

      if (response.ok) {
        setNewListOpen(false)
        setNewList({ name: "", description: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Error creating list:", error)
    }
  }

  const createTask = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const taskData = {
        ...newTask,
        deadline: newTask.deadline ? new Date(newTask.deadline).toISOString() : null,
      }

      const response = await fetch(`/api/lists/${newTask.listId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      })

      if (response.ok) {
        setNewTaskOpen(false)
        setNewTask({ title: "", description: "", priority: "medium", deadline: "", listId: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const toggleTaskComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const token = localStorage.getItem("accessToken")
      const endpoint = isCompleted ? "incomplete" : "complete"

      const response = await fetch(`/api/tasks/${taskId}/${endpoint}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error toggling task:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Management Dashboard</h1>
          <Button
            onClick={() => {
              localStorage.removeItem("accessToken")
              localStorage.removeItem("refreshToken")
              router.push("/")
            }}
          >
            Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lists</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lists.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalTasks || tasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.completedTasks || tasks.filter((t) => t.isCompleted).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.pendingTasks || tasks.filter((t) => !t.isCompleted).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="lists" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lists">Lists</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="lists" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Lists</h2>
              <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New List
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New List</DialogTitle>
                    <DialogDescription>Create a new list to organize your tasks.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="listName">Name</Label>
                      <Input
                        id="listName"
                        value={newList.name}
                        onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                        placeholder="Enter list name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="listDescription">Description</Label>
                      <Textarea
                        id="listDescription"
                        value={newList.description}
                        onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                        placeholder="Enter list description"
                      />
                    </div>
                    <Button onClick={createList} className="w-full">
                      Create List
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => (
                <Card key={list.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {list.name}
                      <Badge variant="secondary">{list._count?.tasks || 0} tasks</Badge>
                    </CardTitle>
                    <CardDescription>{list.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">Created: {new Date(list.createdAt).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Tasks</h2>
              <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a new task to one of your lists.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="taskList">List</Label>
                      <Select
                        value={newTask.listId}
                        onValueChange={(value) => setNewTask({ ...newTask, listId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a list" />
                        </SelectTrigger>
                        <SelectContent>
                          {lists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="taskTitle">Title</Label>
                      <Input
                        id="taskTitle"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskDescription">Description</Label>
                      <Textarea
                        id="taskDescription"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Enter task description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="taskPriority">Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value: "low" | "medium" | "high") =>
                            setNewTask({ ...newTask, priority: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="taskDeadline">Deadline</Label>
                        <Input
                          id="taskDeadline"
                          type="datetime-local"
                          value={newTask.deadline}
                          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={createTask} className="w-full" disabled={!newTask.listId}>
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskComplete(task.id, task.isCompleted)}
                          className="mt-1"
                        >
                          <CheckCircle className={`h-5 w-5 ${task.isCompleted ? "text-green-600" : "text-gray-400"}`} />
                        </Button>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${task.isCompleted ? "line-through text-gray-500" : ""}`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            <span className="text-sm text-gray-500">List: {task.list?.name}</span>
                            {task.deadline && (
                              <span className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(task.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
