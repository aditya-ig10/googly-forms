"use client"

import type React from "react"

import { useState } from "react"
import type { Form, FormQuestion, FormResponse } from "@/types/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { submitResponse } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"

interface FormRendererProps {
  form: Form
}

export function FormRenderer({ form }: FormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const { toast } = useToast()

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const calculateScore = () => {
    if (!form.isTest) return null

    let correct = 0
    let total = 0

    form.questions.forEach((question) => {
      if (question.correctAnswer) {
        total++
        const userAnswer = answers[question.id]
        if (question.type === "multiple-choice" && userAnswer === question.correctAnswer) {
          correct++
        } else if (question.type === "checkbox" && Array.isArray(question.correctAnswer)) {
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : []
          const correctAnswers = question.correctAnswer
          if (
            userAnswers.length === correctAnswers.length &&
            userAnswers.every((ans) => correctAnswers.includes(ans))
          ) {
            correct++
          }
        }
      }
    })

    return total > 0 ? Math.round((correct / total) * 100) : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const missingRequired = form.questions.filter((q) => q.required && (!answers[q.id] || answers[q.id] === ""))

    if (missingRequired.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const calculatedScore = calculateScore()

      const response: Omit<FormResponse, "id"> = {
        formId: form.id,
        answers,
        submittedAt: new Date(),
        ...(calculatedScore !== null && { score: calculatedScore }),
      }

      await submitResponse(response)
      setSubmitted(true)
      setScore(calculatedScore)

      toast({
        title: "Success",
        description: form.isTest ? `Form submitted! Your score: ${calculatedScore}%` : "Form submitted successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: FormQuestion) => {
    const value = answers[question.id]

    switch (question.type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            type={question.type === "email" ? "email" : question.type === "number" ? "number" : "text"}
            value={value || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            required={question.required}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            required={question.required}
            rows={4}
          />
        )

      case "multiple-choice":
        return (
          <RadioGroup
            value={value || ""}
            onValueChange={(val) => updateAnswer(question.id, val)}
            required={question.required}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = value || []
                    if (checked) {
                      updateAnswer(question.id, [...currentValues, option])
                    } else {
                      updateAnswer(
                        question.id,
                        currentValues.filter((v: string) => v !== option),
                      )
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case "dropdown":
        return (
          <Select
            value={value || ""}
            onValueChange={(val) => updateAnswer(question.id, val)}
            required={question.required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return null
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              {form.isTest ? "Test Completed!" : "Form Submitted!"}
            </h2>
            <p className="text-gray-600 mb-4">Thank you for your response.</p>
            {form.isTest && score !== null && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-lg font-semibold">Your Score: {score}%</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{form.title}</CardTitle>
          {form.description && <p className="text-gray-600">{form.description}</p>}
          {form.isTest && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">📝 This is a test. Your answers will be scored.</p>
            </div>
          )}
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {form.questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {index + 1}. {question.title}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {question.description && <p className="text-sm text-gray-600 mt-1">{question.description}</p>}
                </div>
                {renderQuestion(question)}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting..." : form.isTest ? "Submit Test" : "Submit Form"}
        </Button>
      </form>
    </div>
  )
}
