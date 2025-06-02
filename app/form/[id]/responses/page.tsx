"use client"

import { useState, useEffect } from "react"
import { getForm, getFormResponses } from "@/lib/firestore"
import type { Form, FormResponse } from "@/types/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponseAnalytics } from "@/components/response-analytics"
import { notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, Share } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ResponsesPageProps {
  params: { id: string }
}

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      const [formData, responsesData] = await Promise.all([getForm(params.id), getFormResponses(params.id)])

      if (!formData) {
        notFound()
        return
      }

      setForm(formData)
      setResponses(responsesData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!form) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 space-y-4 animate-pop-in">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="hover-lift">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hover-lift">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" className="hover-lift">
              <Share className="h-4 w-4 mr-2" />
              Share Report
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {form.title}
          </h1>
          <p className="text-xl text-gray-600">
            {responses.length} response{responses.length !== 1 ? "s" : ""} collected
          </p>
          {form.description && <p className="text-gray-500 mt-2">{form.description}</p>}
        </div>
      </div>

      {responses.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 hover-lift">
          <CardContent className="text-center py-16">
            <div className="space-y-4 animate-pop-in">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover-glow">
                <Share className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No responses yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Share your form to start collecting responses. Once people submit, you'll see detailed analytics here.
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <Link href={`/form/${form.id}`} target="_blank">
                  <Button variant="outline" className="hover-lift">
                    Preview Form
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    const link = `${window.location.origin}/form/${form.id}`
                    navigator.clipboard.writeText(link)
                    toast({
                      title: "Link copied! 📋",
                      description: "Form link has been copied to clipboard",
                    })
                  }}
                  className="hover-lift"
                >
                  Copy Form Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Analytics Dashboard */}
          <div className="animate-pop-in">
            <ResponseAnalytics form={form} responses={responses} />
          </div>

          {/* Individual Responses */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Individual Responses</h2>
            {responses.map((response, index) => (
              <Card
                key={response.id}
                className="hover:shadow-lg transition-all duration-300 hover-lift animate-pop-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Response #{index + 1}</CardTitle>
                    <div className="flex gap-2 items-center">
                      {form.isTest && response.score !== undefined && (
                        <Badge
                          variant="outline"
                          className={`${
                            response.score >= 80
                              ? "border-green-200 text-green-800 bg-green-50"
                              : response.score >= 60
                                ? "border-yellow-200 text-yellow-800 bg-yellow-50"
                                : "border-red-200 text-red-800 bg-red-50"
                          }`}
                        >
                          Score: {response.score}%
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">{new Date(response.submittedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {form.questions.map((question) => (
                      <div
                        key={question.id}
                        className="border-l-4 border-purple-200 pl-6 py-2 hover:border-purple-400 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900 mb-2">{question.title}</h4>
                        <div className="text-gray-700 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                          {Array.isArray(response.answers[question.id])
                            ? response.answers[question.id].join(", ")
                            : response.answers[question.id] || (
                                <span className="text-gray-400 italic">No answer provided</span>
                              )}
                        </div>
                        {form.isTest && question.correctAnswer && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Correct answer: </span>
                            <span className="text-green-600 font-medium">
                              {Array.isArray(question.correctAnswer)
                                ? question.correctAnswer.join(", ")
                                : question.correctAnswer}
                            </span>
                            {response.answers[question.id] === question.correctAnswer ? (
                              <Badge className="ml-2 bg-green-100 text-green-800">Correct</Badge>
                            ) : (
                              <Badge variant="outline" className="ml-2 border-red-200 text-red-800 bg-red-50">
                                Incorrect
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
