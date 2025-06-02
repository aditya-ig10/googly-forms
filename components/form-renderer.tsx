"use client"

import { useState, useRef } from "react"
import type { Form, FormQuestion, FormResponse } from "@/types/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { submitResponse } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"
import katex from "katex"
import "katex/dist/katex.min.css"
import { CheckCircle2, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FormRendererProps {
  form: Form
}

export function FormRenderer({ form }: FormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const { toast } = useToast()

  const theme = form.theme || {
    primaryColor: "#673ab7",
    backgroundColor: "#f4f4f4",
    textColor: "#202124",
    accentColor: "#1a73e8",
  }

  const sectionProgress = form.sections.length > 0 ? ((currentSectionIndex + 1) / form.sections.length) * 100 : 0

  const renderText = (text: string) => {
    const katexRegex = /\\\(.*?\\\)/g
    let lastIndex = 0
    let html = ""
    let match

    while ((match = katexRegex.exec(text)) !== null) {
      const plainText = text.slice(lastIndex, match.index)
      const mathText = match[0].slice(2, -2)
      html += plainText.replace(/</g, "<").replace(/>/g, ">")
      try {
        html += katex.renderToString(mathText, { throwOnError: false, displayMode: false })
      } catch {
        html += `<span class="text-red-600">[Invalid math]</span>`
      }
      lastIndex = match.index + match[0].length
    }
    html += text.slice(lastIndex).replace(/</g, "<").replace(/>/g, ">")
    html = html
      .replace(/<b>(.*?)<\/b>/g, "<strong>$1</strong>")
      .replace(/<i>(.*?)<\/i>/g, "<em>$1</em>")
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="break-words"
        aria-label={text.replace(/\\\(.*?\\\)/g, "[math]").replace(/<.*?>/g, "")}
      />
    )
  }

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setErrors((prev) => ({ ...prev, [questionId]: "" }))
  }

  const validateInput = (question: FormQuestion, value: any) => {
    if (question.required && (!value || value === "" || (Array.isArray(value) && value.length === 0))) {
      return `${question.title.replace(/<.*?>/g, "")} is required`
    }
    if (question.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return "Enter a valid email address"
      }
    }
    if (question.type === "number" && value && isNaN(Number(value))) {
      return "Enter a valid number"
    }
    return ""
  }

  const validateSection = (sectionIndex: number) => {
    const newErrors: Record<string, string> = {}
    let hasErrors = false

    form.sections[sectionIndex].questions.forEach((question) => {
      const error = validateInput(question, answers[question.id])
      if (error) {
        newErrors[question.id] = error
        hasErrors = true
      }
    })

    setErrors(newErrors)
    return !hasErrors
  }

  const calculateScore = () => {
    if (!form.isTest) return null

    let correct = 0
    let total = 0

    form.sections.flatMap((section) => section.questions).forEach((question) => {
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

  const handleSubmit = async () => {
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
        title: "Response Recorded",
        description: form.isTest ? `Test submitted! Your score: ${calculatedScore}%` : "Your response has been recorded.",
      })
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit your form. Please try again.",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSubmitDialog(true)}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Retry
          </Button>
        ),
      })
    } finally {
      setSubmitting(false)
      setShowSubmitDialog(false)
    }
  }

  const handleClearForm = () => {
    setAnswers({})
    setErrors({})
    setCurrentSectionIndex(0)
    window.scrollTo({ top: 0, behavior: "auto" })
    toast({
      title: "Form Cleared",
      description: "All answers have been reset.",
    })
  }

  const handleStartOver = () => {
    setAnswers({})
    setErrors({})
    setSubmitted(false)
    setScore(null)
    setCurrentSectionIndex(0)
    window.scrollTo({ top: 0, behavior: "auto" })
  }

  const navigateSection = (index: number) => {
    if (index < 0 || index >= form.sections.length) return

    if (index > currentSectionIndex && !validateSection(currentSectionIndex)) {
      toast({
        title: "Complete Required Fields",
        description: "Please fill in all required fields in this section.",
        variant: "destructive",
      })
      return
    }

    setCurrentSectionIndex(index)
    sectionRefs.current[index]?.scrollIntoView({ behavior: "auto", block: "start" })
  }

  const renderQuestion = (question: FormQuestion, globalQuestionIndex: number) => {
    const value = answers[question.id]

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`space-y-3 p-4 rounded-lg transition-all duration-200 hover:shadow-md ${
          errors[question.id] ? "border-l-4 border-red-600" : "border-l-4 border-transparent"
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="text-base font-medium" style={{ color: theme.textColor }}>{globalQuestionIndex + 1}.</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium" style={{ color: theme.textColor }}>
                {renderText(question.title)}
              </Label>
              {question.required && (
                <span className="text-red-600 text-sm font-medium" aria-hidden="true">*</span>
              )}
            </div>
            {question.description && (
              <div className="text-sm mt-1" style={{ color: theme.textColor }}>{renderText(question.description)}</div>
            )}
            <div className="mt-2">
              {question.type === "text" || question.type === "email" || question.type === "number" ? (
                <Input
                  type={question.type === "email" ? "email" : question.type === "number" ? "number" : "text"}
                  value={value || ""}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  required={question.required}
                  className="border border-gray-300 focus:border-[color:--accent] focus:ring-[color:--accent] rounded text-base py-1.5 w-full max-w-[500px] transition-all duration-200"
                  style={{ "--accent": theme.accentColor } as React.CSSProperties}
                  aria-describedby={errors[question.id] ? `error-${question.id}` : undefined}
                />
              ) : question.type === "textarea" ? (
                <Textarea
                  value={value || ""}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  required={question.required}
                  rows={4}
                  className="border border-gray-300 focus:border-[color:--accent] focus:ring-[color:--accent] rounded text-base py-1.5 w-full max-w-[500px] transition-all duration-200"
                  style={{ "--accent": theme.accentColor } as React.CSSProperties}
                  aria-describedby={errors[question.id] ? `error-${question.id}` : undefined}
                />
              ) : question.type === "multiple-choice" ? (
                <RadioGroup
                  value={value || ""}
                  onValueChange={(val) => updateAnswer(question.id, val)}
                  required={question.required}
                  className="space-y-1.5"
                  aria-describedby={errors[question.id] ? `error-${question.id}` : undefined}
                >
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded transition-all duration-200">
                      <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                      <Label htmlFor={`${question.id}-${index}`} className="text-base" style={{ color: theme.textColor }}>{renderText(option)}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : question.type === "checkbox" ? (
                <div className="space-y-1.5" aria-describedby={errors[question.id] ? `error-${question.id}` : undefined}>
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded transition-all duration-200">
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
                      <Label htmlFor={`${question.id}-${index}`} className="text-base" style={{ color: theme.textColor }}>{renderText(option)}</Label>
                    </div>
                  ))}
                </div>
              ) : question.type === "dropdown" ? (
                <Select
                  value={value || ""}
                  onValueChange={(val) => updateAnswer(question.id, val)}
                  required={question.required}
                >
                  <SelectTrigger className="border border-gray-300 focus:border-[color:--accent] focus:ring-[color:--accent] rounded text-base py-1.5 w-full max-w-[500px] transition-all duration-200" style={{ "--accent": theme.accentColor } as React.CSSProperties}>
                    <SelectValue placeholder="Choose an answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options?.map((option, index) => (
                      <SelectItem key={index} value={option} className="text-base">
                        {renderText(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
            {errors[question.id] && (
              <p id={`error-${question.id}`} className="text-red-600 text-sm mt-1" role="alert">
                {errors[question.id]}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen px-2 py-6 sm:px-4 sm:py-8" style={{ backgroundColor: theme.backgroundColor }}>
        <Card className="max-w-[800px] mx-auto border border-gray-300 rounded-lg shadow-lg bg-white">
          <CardContent className="p-4 sm:p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h2 className="text-lg sm:text-xl font-medium mb-2" style={{ color: theme.textColor }}>
              Your response has been recorded.
            </h2>
            {form.isTest && score !== null && (
              <div className="bg-blue-50 p-3 rounded-lg inline-block mb-3">
                <p className="text-sm font-medium text-blue-800">Your Score: {score}%</p>
              </div>
            )}
            {form.isTest && (
              <div className="space-y-3 mt-3 text-left max-w-[500px] mx-auto">
                <h3 className="text-sm font-medium" style={{ color: theme.textColor }}>Your Answers</h3>
                {form.sections.flatMap((section) => section.questions).map((question, index) => (
                  <div key={question.id} className="border-t border-gray-200 pt-2">
                    <p className="text-sm font-medium" style={{ color: theme.textColor }}>{index + 1}. {renderText(question.title)}</p>
                    <p className="text-sm text-gray-600">
                      Your Answer: {Array.isArray(answers[question.id])
                        ? answers[question.id].join(", ")
                        : answers[question.id] || "Not answered"}
                    </p>
                    {question.correctAnswer && (
                      <p className="text-sm text-gray-600">
                        Correct Answer: {Array.isArray(question.correctAnswer)
                          ? question.correctAnswer.join(", ")
                          : question.correctAnswer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleStartOver}
              className="text-[color:--accent] text-sm font-medium hover:underline mt-3 inline-block"
              style={{ "--accent": theme.accentColor } as React.CSSProperties}
            >
              Submit another response
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  let globalQuestionIndex = 0

  return (
    <div className="min-h-screen px-2 py-6 sm:px-4 sm:py-8" style={{ backgroundColor: theme.backgroundColor }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        body, button, input, textarea, select {
          font-family: 'Roboto', sans-serif;
        }
      `}</style>
      <Card className="max-w-[800px] mx-auto border rounded-lg shadow-lg mb-4 bg-gradient-to-b from-white to-gray-50">
        <CardContent className="p-4 sm:p-6 border-l-4 border-[color:--primary]" style={{ "--primary": theme.primaryColor } as React.CSSProperties}>
          <Progress value={sectionProgress} className="h-1 mb-3 [&>div]:bg-[color:--primary] bg-gray-300" style={{ "--primary": theme.primaryColor } as React.CSSProperties} />
          <h1 className="text-lg sm:text-xl font-medium mb-2" style={{ color: theme.textColor }}>{renderText(form.title)}</h1>
          {form.description && (
            <div className="text-sm mb-2" style={{ color: theme.textColor }}>{renderText(form.description)}</div>
          )}
          {form.isTest && (
            <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
              <p className="text-xs text-yellow-800">This is a test. Your answers will be scored.</p>
            </div>
          )}
          <p className="text-xs text-red-600 mt-2">* Indicates required question</p>
        </CardContent>
      </Card>

      <form onSubmit={(e) => { e.preventDefault(); setShowSubmitDialog(true); }} className="space-y-4">
        <AnimatePresence>
          {form.sections.map((section, sectionIndex) => {
            if (sectionIndex !== currentSectionIndex) return null
            const sectionQuestions = section.questions.map((question) => {
              const currentIndex = globalQuestionIndex
              globalQuestionIndex++
              return { question, index: currentIndex }
            })
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                ref={(el: HTMLDivElement | null) => (sectionRefs.current[sectionIndex] = el)}
              >
                <Card className="max-w-[800px] mx-auto border border-gray-300 rounded-lg shadow-lg bg-white hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {section.title && (
                      <h2 className="text-base font-medium" style={{ color: theme.textColor }}>{renderText(section.title)}</h2>
                    )}
                    {section.description && (
                      <div className="text-sm" style={{ color: theme.textColor }}>{renderText(section.description)}</div>
                    )}
                    {sectionQuestions.map(({ question, index }) => (
                      <div key={question.id}>
                        {renderQuestion(question, index)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 sm:py-4 z-10">
        <div className="max-w-[800px] mx-auto px-2 sm:px-4 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-center">
          <button
            onClick={handleClearForm}
            className="text-[color:--accent] text-sm font-medium hover:underline order-2 sm:order-1"
            style={{ "--accent": theme.accentColor } as React.CSSProperties}
          >
            Clear form
          </button>
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto order-1 sm:order-2">
            <Button
              onClick={() => navigateSection(currentSectionIndex - 1)}
              disabled={currentSectionIndex === 0}
              variant="outline"
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-base py-1.5 px-4 shadow-sm hover:scale-105 transition-transform duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {currentSectionIndex < form.sections.length - 1 ? (
              <Button
                onClick={() => navigateSection(currentSectionIndex + 1)}
                className="w-full sm:w-auto bg-[color:--primary] hover:bg-[color:--primary-dark] text-white rounded text-base py-1.5 px-4 shadow-sm hover:scale-105 transition-transform duration-200"
                style={{ "--primary": theme.primaryColor, "--primary-dark": darkenColor(theme.primaryColor, 10) } as React.CSSProperties}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                disabled={submitting}
                className="w-full sm:w-auto bg-[color:--primary] hover:bg-[color:--primary-dark] text-white rounded text-base py-1.5 px-4 shadow-sm hover:scale-105 transition-transform duration-200"
                onClick={() => setShowSubmitDialog(true)}
                style={{ "--primary": theme.primaryColor, "--primary-dark": darkenColor(theme.primaryColor, 10) } as React.CSSProperties}
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="rounded-lg max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium" style={{ color: theme.textColor }}>Submit your response?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm" style={{ color: theme.textColor }}>
              Make sure you have answered all required questions. You cannot edit your response after submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel>
              <Button variant="outline" className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-sm py-1 px-3">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction>
              <Button
                onClick={handleSubmit}
                className="w-full sm:w-auto bg-[color:--primary] hover:bg-[color:--primary-dark] text-white rounded text-sm py-1 px-3"
                disabled={submitting}
                style={{ "--primary": theme.primaryColor, "--primary-dark": darkenColor(theme.primaryColor, 10) } as React.CSSProperties}
              >
                Submit
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Utility to darken a hex color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, (num >> 16) - amt)
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt)
  const B = Math.max(0, (num & 0x0000FF) - amt)
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}