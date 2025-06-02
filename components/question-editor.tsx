"use client"

import { useRef } from "react"
import type { FormQuestion } from "@/types/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2, Bold, Italic, Underline } from "lucide-react"
import { TextFormattingPopup } from "./text-formatting-popup"

interface QuestionEditorProps {
  question: FormQuestion
  onUpdate: (question: FormQuestion) => void
  onDelete: () => void
  isTest: boolean
  onSelectInput: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>, id: string) => void
  selectedInput: { id: string; selection: { start: number; end: number } } | null
  renderMath: (text: string, elementId: string) => void
  applyFormatting: (id: string, type: "katex" | "bold" | "italic" | "underline", value: string) => string
}

export function QuestionEditor({ question, onUpdate, onDelete, isTest, onSelectInput, selectedInput, renderMath, applyFormatting }: QuestionEditorProps) {
  const mathPreviews = useRef<Map<string, HTMLDivElement>>(new Map())

  const updateQuestion = (updates: Partial<FormQuestion>) => {
    onUpdate({ ...question, ...updates })
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 space-y-4">
      <div className="relative">
        <Label htmlFor={`question-title-${question.id}`} className="text-sm font-medium text-gray-700">
          Question Title
        </Label>
        <Input
          id={`question-title-${question.id}`}
          value={question.title}
          onChange={(e) => {
            updateQuestion({ title: e.target.value })
            renderMath(e.target.value, `question-title-${question.id}`)
          }}
          onSelect={(e) => onSelectInput(e, `question-title-${question.id}`)}
          className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
          placeholder="Enter question"
        />
        {selectedInput?.id === `question-title-${question.id}` && (
          <TextFormattingPopup
            onFormat={(type) => {
              const newTitle = applyFormatting(`question-title-${question.id}`, type, question.title)
              updateQuestion({ title: newTitle })
              renderMath(newTitle, `question-title-${question.id}`)
            }}
          />
        )}
        <div
          ref={(el) => {
            if (el) mathPreviews.current.set(`question-title-${question.id}`, el)
          }}
          className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
        />
      </div>

      <div className="relative">
        <Label htmlFor={`question-description-${question.id}`} className="text-sm font-medium text-gray-700">
          Description (Optional)
        </Label>
        <Textarea
          id={`question-description-${question.id}`}
          value={question.description || ""}
          onChange={(e) => {
            updateQuestion({ description: e.target.value })
            renderMath(e.target.value, `question-description-${question.id}`)
          }}
          onSelect={(e) => onSelectInput(e, `question-description-${question.id}`)}
          className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
          rows={2}
          placeholder="Enter description"
        />
        {selectedInput?.id === `question-description-${question.id}` && (
          <TextFormattingPopup
            onFormat={(type) => {
              const newDesc = applyFormatting(`question-description-${question.id}`, type, question.description || "")
              updateQuestion({ description: newDesc })
              renderMath(newDesc, `question-description-${question.id}`)
            }}
          />
        )}
        <div
          ref={(el) => {
            if (el) mathPreviews.current.set(`question-description-${question.id}`, el)
          }}
          className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
        />
      </div>

      {["multiple-choice", "checkbox", "dropdown"].includes(question.type) && (
        <div>
          <Label className="text-sm font-medium text-gray-700">Options</Label>
          {(question.options || []).map((option, index) => (
            <div key={index} className="flex items-center gap-2 mt-2 relative">
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...(question.options || [])]
                  newOptions[index] = e.target.value
                  updateQuestion({ options: newOptions })
                  renderMath(e.target.value, `option-${question.id}-${index}`)
                }}
                onSelect={(e) => onSelectInput(e, `option-${question.id}-${index}`)}
                className="border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                placeholder={`Option ${index + 1}`}
              />
              {selectedInput?.id === `option-${question.id}-${index}` && (
                <TextFormattingPopup
                  onFormat={(type) => {
                    const newOptions = [...(question.options || [])]
                    newOptions[index] = applyFormatting(`option-${question.id}-${index}`, type, option)
                    updateQuestion({ options: newOptions })
                    renderMath(newOptions[index], `option-${question.id}-${index}`)
                  }}
                />
              )}
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
              <div
                ref={(el) => {
                  if (el) mathPreviews.current.set(`option-${question.id}-${index}`, el)
                }}
                className="absolute left-0 top-full mt-1 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em] w-full"
              />
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
        <div className="relative">
          <Label className="text-sm font-medium text-gray-700">Correct Answer</Label>
          <Input
            value={Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer || ""}
            onChange={(e) => {
              const value = e.target.value
              updateQuestion({
                correctAnswer: question.type === "checkbox" ? value.split(", ") : value,
              })
              renderMath(value, `correct-answer-${question.id}`)
            }}
            onSelect={(e) => onSelectInput(e, `correct-answer-${question.id}`)}
            className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
            placeholder="Enter correct answer"
          />
          {selectedInput?.id === `correct-answer-${question.id}` && (
            <TextFormattingPopup
              onFormat={(type) => {
                const newAnswer = applyFormatting(
                  `correct-answer-${question.id}`,
                  type,
                  Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer || ""
                )
                updateQuestion({
                  correctAnswer: question.type === "checkbox" ? newAnswer.split(", ") : newAnswer,
                })
                renderMath(newAnswer, `correct-answer-${question.id}`)
              }}
            />
          )}
          <div
            ref={(el) => {
              if (el) mathPreviews.current.set(`correct-answer-${question.id}`, el)
            }}
            className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
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