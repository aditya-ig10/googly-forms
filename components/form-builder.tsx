"use client"

import { useState } from "react"
import type { Form, FormQuestion } from "@/types/form"
import { QuestionEditor } from "./question-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, Save, Eye, Copy } from "lucide-react"
import { createForm, updateForm } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface FormBuilderProps {
  initialForm?: Form
}

export function FormBuilder({ initialForm }: FormBuilderProps) {
  const { user } = useAuth()
  const [form, setForm] = useState<Omit<Form, "id" | "createdAt" | "updatedAt">>({
    title: initialForm?.title || "Untitled Form",
    description: initialForm?.description || "",
    questions: initialForm?.questions || [],
    isPublished: initialForm?.isPublished || false,
    isTest: initialForm?.isTest || false,
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const addQuestion = () => {
    const newQuestion: FormQuestion = {
      id: Date.now().toString(),
      type: "text",
      title: "Untitled Question",
      required: false,
    }
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
  }

  const updateQuestion = (index: number, question: FormQuestion) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? question : q)),
    }))
  }

  const deleteQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  const importFromJSON = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            if (data.questions && Array.isArray(data.questions)) {
              setForm((prev) => ({
                ...prev,
                title: data.title || prev.title,
                description: data.description || prev.description,
                questions: data.questions.map((q: any, index: number) => ({
                  ...q,
                  id: q.id || Date.now().toString() + index,
                })),
              }))
              toast({
                title: "Success",
                description: "Questions imported successfully!",
              })
            } else {
              throw new Error("Invalid JSON format")
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Invalid JSON file format",
              variant: "destructive",
            })
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const saveForm = async () => {
    if (!user) return

    setSaving(true)
    try {
      const formData = {
        ...form,
        userId: user.uid,
        userEmail: user.email,
      }

      if (initialForm?.id) {
        await updateForm(initialForm.id, formData)
        toast({
          title: "Success",
          description: "Form updated successfully!",
        })
      } else {
        const formId = await createForm(formData)
        toast({
          title: "Success",
          description: "Form created successfully!",
        })
        router.push(`/form/${formId}/edit`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save form",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const previewForm = () => {
    if (initialForm?.id) {
      window.open(`/form/${initialForm.id}`, "_blank")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Form Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Form Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="form-title">Form Title</Label>
            <Input
              id="form-title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="text-lg font-medium"
            />
          </div>

          <div>
            <Label htmlFor="form-description">Form Description</Label>
            <Textarea
              id="form-description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="is-test"
                checked={form.isTest}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isTest: checked }))}
              />
              <Label htmlFor="is-test">MCQ Test Mode</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is-published"
                checked={form.isPublished}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
              />
              <Label htmlFor="is-published">Published</Label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={importFromJSON} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import JSON
            </Button>

            <Button onClick={saveForm} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Form"}
            </Button>

            {initialForm?.id && (
              <Button onClick={previewForm} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}

            {initialForm?.id && form.isPublished && (
              <Button
                onClick={() => {
                  const link = `${window.location.origin}/form/${initialForm.id}`
                  navigator.clipboard.writeText(link)
                  toast({
                    title: "Link copied! 📋",
                    description: "Form link has been copied to clipboard",
                  })
                }}
                variant="outline"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {form.questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
            onDelete={() => deleteQuestion(index)}
            isTest={form.isTest}
          />
        ))}

        <Button onClick={addQuestion} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
    </div>
  )
}
