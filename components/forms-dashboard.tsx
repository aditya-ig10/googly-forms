"use client"

import { useState, useEffect } from "react"
import type { Form } from "@/types/form"
import { getUserForms, deleteForm } from "@/lib/firestore"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  BarChart3,
  Copy,
  Share,
  FileText,
  Plus,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// Generate consistent gradient for each form based on its ID
const getFormGradient = (formId: string) => {
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-teal-500 to-green-500",
    "from-yellow-500 to-orange-500",
    "from-violet-500 to-purple-500",
  ]

  // Use form ID to consistently select the same gradient
  const hash = formId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  return gradients[Math.abs(hash) % gradients.length]
}

export function FormsDashboard() {
  const { user } = useAuth()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadForms()
    }
  }, [user])

  const loadForms = async () => {
    if (!user) return

    try {
      const formsData = await getUserForms(user.uid)
      setForms(formsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load forms",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (formId: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      try {
        await deleteForm(formId)
        setForms(forms.filter((form) => form.id !== formId))
        toast({
          title: "Success",
          description: "Form deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete form",
          variant: "destructive",
        })
      }
    }
  }

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copied! 📋",
      description: "Form link has been copied to clipboard",
    })
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A"
    const parsedDate = typeof date === "string" ? new Date(date) : date
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-bounce rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-purple-400 opacity-20"></div>
        </div>
      </div>
    )
  }

  const totalResponses = forms.reduce((acc, form) => acc + (form.questions?.length || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-10">
        <div className="space-y-4">
          <h1 className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            My Forms
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Create, manage, and analyze your forms with powerful insights. Build engaging surveys, quizzes, and
            feedback forms effortlessly.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/create">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold"
            >
              <Plus className="h-6 w-6 mr-2" />
              Create New Form
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-semibold border-2 border-gray-300 hover:bg-gray-100 transition-all duration-300"
          >
            <FileText className="h-6 w-6 mr-2" />
            Browse Templates
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Forms</p>
                <p className="text-4xl font-extrabold">{forms.length}</p>
                <p className="text-purple-200 text-xs mt-1">+12% from last month</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Published</p>
                <p className="text-4xl font-extrabold">{forms.filter((f) => f.isPublished).length}</p>
                <p className="text-blue-200 text-xs mt-1">Ready to collect responses</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Eye className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Test Forms</p>
                <p className="text-4xl font-extrabold">{forms.filter((f) => f.isTest).length}</p>
                <p className="text-green-200 text-xs mt-1">Interactive assessments</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Questions</p>
                <p className="text-4xl font-extrabold">{totalResponses}</p>
                <p className="text-orange-200 text-xs mt-1">Across all forms</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-50 transition-all duration-300 rounded-2xl shadow-lg">
          <CardContent className="text-center py-20">
            <div className="space-y-6 animate-pop-in">
              <div className="mx-auto h-20 w-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">No forms yet</h3>
                <p className="text-gray-600 max-w-md mx-auto text-lg leading-relaxed">
                  Get started by creating your first form. It only takes a few minutes to build something amazing!
                </p>
              </div>
              <div className="space-y-4">
                <Link href="/create">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-6 text-lg font-semibold"
                  >
                    <Plus className="h-6 w-6 mr-2" />
                    Create Form
                  </Button>
                </Link>
                <p className="text-sm text-gray-500">Or explore our templates to get started quickly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form, index) => {
            const gradient = getFormGradient(form.id)
            return (
              <Card
                key={form.id}
                className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white rounded-2xl overflow-hidden hover-lift hover-glow animate-pop-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient header */}
                <div className={`h-36 bg-gradient-to-r ${gradient} rounded-t-2xl relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                        <DropdownMenuItem asChild>
                          <Link href={`/form/${form.id}/edit`} className="flex items-center">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Form
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/form/${form.id}`} target="_blank" className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyFormLink(form.id)} className="flex items-center">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/form/${form.id}/responses`} className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(form.id)} className="flex items-center text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{form.questions.length} questions</span>
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-3 px-6 pt-4">
                  <div className="space-y-2">
                    <CardTitle className="text-xl font-semibold group-hover:text-purple-600 transition-colors line-clamp-1">
                      {form.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2 h-10 leading-relaxed">
                      {form.description || "No description provided"}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant={form.isPublished ? "default" : "secondary"}
                        className={form.isPublished ? "bg-green-100 text-green-800 hover:bg-green-200 rounded-full px-3 py-1" : "rounded-full px-3 py-1"}
                      >
                        {form.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {form.isTest && (
                        <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 rounded-full px-3 py-1">
                          Test
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Updated {formatDate(form.updatedAt)}</span>
                  </div>

                  {form.isPublished && (
                    <div className="flex gap-3 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyFormLink(form.id)}
                        className="flex-1 text-sm font-medium border-2 border-gray-300 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200 rounded-full py-2"
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Link href={`/form/${form.id}/responses`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-sm font-medium border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 rounded-full py-2"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}