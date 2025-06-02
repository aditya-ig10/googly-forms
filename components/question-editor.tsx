"use client"

import { useEffect, useRef, useState } from "react"
import type { FormQuestion } from "@/types/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2 } from "lucide-react"

interface QuestionEditorProps {
  question: FormQuestion
  onUpdate: (question: FormQuestion) => void
  onDelete: () => void
  isTest: boolean
  renderMath: (text: string, elementId: string, useKatex: boolean) => void
}

export function QuestionEditor({ question, onUpdate, onDelete, isTest, renderMath }: QuestionEditorProps) {
  const [katexToggles, setKatexToggles] = useState({ title: false, description: false })
  const mathPreviews = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    renderMath(question.title, `question-title-${question.id}`, katexToggles.title)
    renderMath(question.description || "", `question-description-${question.id}`, katexToggles.description)
  }, [question.title, question.description, katexToggles, renderMath])

  const updateQuestion = (updates: Partial<FormQuestion>) => {
    onUpdate({ ...question, ...updates })
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`question-title-${question.id}`} className="text-sm font-medium text-gray-700">
            Question Title
          </Label>
          <div className="flex items-center gap-2">
            <Switch
              id={`question-title-katex-${question.id}`}
              checked={katexToggles.title}
              onCheckedChange={(checked) => setKatexToggles((prev) => ({ ...prev, title: checked }))}
              className="data-[state=checked]:bg-purple-600"
            />
            <Label htmlFor={`question-title-katex-${question.id}`} className="text-sm text-gray-600">
              Math Mode
            </Label>
          </div>
        </div>
        <Input
          id={`question-title-${question.id}`}
          value={question.title}
          onChange={(e) => {
            updateQuestion({ title: e.target.value })
            renderMath(e.target.value, `question-title-${question.id}`, katexToggles.title)
          }}
          className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
          placeholder={katexToggles.title ? "Enter question (e.g., What is 3^2?)" : "Enter question"}
        />
        {katexToggles.title && (
          <div
            ref={(el) => {
              if (el) mathPreviews.current.set(`question-title-${question.id}`, el)
            }}
            className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`question-description-${question.id}`} className="text-sm font-medium text-gray-700">
            Description (Optional)
          </Label>
          <div className="flex items-center gap-2">
            <Switch
              id={`question-description-katex-${question.id}`}
              checked={katexToggles.description}
              onCheckedChange={(checked) => setKatexToggles((prev) => ({ ...prev, description: checked }))}
              className="data-[state=checked]:bg-purple-600"
            />
            <Label htmlFor={`question-description-katex-${question.id}`} className="text-sm text-gray-600">
              Math Mode
            </Label>
          </div>
        </div>
        <Textarea
          id={`question-description-${question.id}`}
          value={question.description || ""}
          onChange={(e) => {
            updateQuestion({ description: e.target.value })
            renderMath(e.target.value, `question-description-${question.id}`, katexToggles.description)
          }}
          className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
          rows={2}
          placeholder={katexToggles.description ? "Enter description (e.g., Use \\sqrt{x})" : "Enter description"}
        />
        {katexToggles.description && (
          <div
            ref={(el) => {
              if (el) mathPreviews.current.set(`question-description-${question.id}`, el)
            }}
            className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
          />
        )}
      </div>

      <div>
        <Label htmlFor={`question-type-${question.id}`} className="text-sm font-medium text-gray-700">
          Question Type
        </Label>
        <Select
          value={question.type}
          onValueChange={(type: FormQuestion["type"]) => updateQuestion({ type })}
        >
          <SelectTrigger
            id={`question-type-${question.id}`}
            className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Short Answer</SelectItem>
            <SelectItem value="textarea">Paragraph</SelectItem>
            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
            <SelectItem value="checkbox">Checkboxes</SelectItem>
            <SelectItem value="dropdown">Dropdown</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="number">Number</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {["multiple-choice", "checkbox", "dropdown"].includes(question.type) && (
        <div>
          <Label className="text-sm font-medium text-gray-700">Options</Label>
          {(question.options || []).map((option, index) => (
            <div key={index} className="flex items-center gap-2 mt-2">
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...(question.options || [])]
                  newOptions[index] = e.target.value
                  updateQuestion({ options: newOptions })
                }}
                className="border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                placeholder={`Option ${index + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newOptions = (question.options || []).filter((_, i) => i !== index)
                  updateQuestion({ options: newOptions })
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateQuestion({ options: [...(question.options || []), ""] })}
            className="mt-2 border-2 border-gray-300 hover:bg-purple-50 hover:border-purple-300 rounded-lg"
          >
            Add Option
          </Button>
        </div>
      )}

      {isTest && ["multiple-choice", "checkbox"].includes(question.type) && (
        <div>
          <Label className="text-sm font-medium text-gray-700">Correct Answer</Label>
          <Input
            value={Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer || ""}
            onChange={(e) => {
              const value = e.target.value
              updateQuestion({
                correctAnswer: question.type === "checkbox" ? value.split(", ") : value,
              })
            }}
            className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
            placeholder="Enter correct answer"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Switch
          id={`required-${question.id}`}
          checked={question.required}
          onCheckedChange={(checked) => updateQuestion({ required: checked })}
          className="data-[state=checked]:bg-purple-600"
        />
        <Label htmlFor={`required-${question.id}`} className="text-sm font-medium text-gray-700">
          Required
        </Label>
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        className="mt-4 rounded-full"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Question
      </Button>
    </div>
  )
}