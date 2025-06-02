"use client"

import { useState } from "react"
import type { FormQuestion } from "@/types/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Trash2, Plus, GripVertical } from "lucide-react"

interface QuestionEditorProps {
  question: FormQuestion
  onUpdate: (question: FormQuestion) => void
  onDelete: () => void
  isTest?: boolean
}

export function QuestionEditor({ question, onUpdate, onDelete, isTest = false }: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState(question)

  const updateQuestion = (updates: Partial<FormQuestion>) => {
    const updated = { ...localQuestion, ...updates }
    setLocalQuestion(updated)
    onUpdate(updated)
  }

  const addOption = () => {
    const options = [...(localQuestion.options || []), ""]
    updateQuestion({ options })
  }

  const updateOption = (index: number, value: string) => {
    const options = [...(localQuestion.options || [])]
    options[index] = value
    updateQuestion({ options })
  }

  const removeOption = (index: number) => {
    const options = localQuestion.options?.filter((_, i) => i !== index) || []
    updateQuestion({ options })
  }

  const needsOptions = ["multiple-choice", "checkbox", "dropdown"].includes(localQuestion.type)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
        <div className="flex-1 space-y-2">
          <Input
            placeholder="Question title"
            value={localQuestion.title}
            onChange={(e) => updateQuestion({ title: e.target.value })}
            className="text-lg font-medium"
          />
          <Textarea
            placeholder="Question description (optional)"
            value={localQuestion.description || ""}
            onChange={(e) => updateQuestion({ description: e.target.value })}
            className="text-sm"
            rows={2}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="question-type">Question Type</Label>
            <Select
              value={localQuestion.type}
              onValueChange={(value: FormQuestion["type"]) => updateQuestion({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Short Text</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="checkbox">Checkboxes</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="required"
              checked={localQuestion.required}
              onCheckedChange={(checked) => updateQuestion({ required: checked })}
            />
            <Label htmlFor="required">Required</Label>
          </div>
        </div>

        {needsOptions && (
          <div className="space-y-2">
            <Label>Options</Label>
            {localQuestion.options?.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1"
                />
                {isTest && localQuestion.type === "multiple-choice" && (
                  <Button
                    variant={localQuestion.correctAnswer === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateQuestion({ correctAnswer: option })}
                  >
                    Correct
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => removeOption(index)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
