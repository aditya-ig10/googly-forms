"use client"

import { useState, useEffect, useRef } from "react"
import type { Form, FormQuestion, FormSection } from "@/types/form"
import { QuestionEditor } from "./question-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, Save, Eye, Copy, Layout } from "lucide-react"
import { createForm, updateForm } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import katex from "katex"
import "katex/dist/katex.min.css"

interface FormBuilderProps {
  initialForm?: Form
}

export function FormBuilder({ initialForm }: FormBuilderProps) {
  const { user } = useAuth()
  const [form, setForm] = useState<Omit<Form, "id" | "createdAt" | "updatedAt">>({
    title: initialForm?.title || "Untitled Form",
    description: initialForm?.description || "",
    sections: initialForm?.sections || [
      {
        id: Date.now().toString(),
        title: "Section 1",
        description: "",
        questions: initialForm?.questions || [],
      },
    ],
    questions: initialForm?.questions || [],
    isPublished: initialForm?.isPublished || false,
    isTest: initialForm?.isTest || false,
    userId: user?.uid || "",
    userEmail: user?.email || "",
  })
  const [saving, setSaving] = useState(false)
  const [katexToggles, setKatexToggles] = useState({
    formTitle: false,
    formDescription: false,
    sections: form.sections.map(() => ({ title: false, description: false })),
  })
  const mathPreviews = useRef<Map<string, HTMLDivElement>>(new Map())
  const { toast } = useToast()
  const router = useRouter()

  // Update toggles when sections change
  useEffect(() => {
    setKatexToggles((prev) => ({
      ...prev,
      sections: form.sections.map((_, i) =>
        prev.sections[i] || { title: false, description: false }
      ),
    }))
  }, [form.sections.length])

  // Function to render math expressions or plain text
  const renderMath = (text: string, elementId: string, useKatex: boolean) => {
    const element = mathPreviews.current.get(elementId)
    if (element) {
      if (useKatex) {
        try {
          katex.render(text, element, {
            throwOnError: false,
            displayMode: false,
          })
        } catch (error) {
          element.innerHTML = `<span class="text-red-500 text-sm">Invalid math expression</span>`
        }
      } else {
        element.innerText = text || ""
      }
    }
  }

  // Render previews for form title, description, and sections
  useEffect(() => {
    renderMath(form.title, "form-title-preview", katexToggles.formTitle)
    renderMath(form.description, "form-description-preview", katexToggles.formDescription)
    form.sections.forEach((section, index) => {
      renderMath(section.title, `section-title-${index}`, katexToggles.sections[index]?.title || false)
      renderMath(
        section.description || "",
        `section-description-${index}`,
        katexToggles.sections[index]?.description || false
      )
    })
  }, [form.title, form.description, form.sections, katexToggles])

  const addSection = () => {
    const newSection: FormSection = {
      id: Date.now().toString(),
      title: `Section ${form.sections.length + 1}`,
      description: "",
      questions: [],
    }
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }))
  }

  const updateSection = (sectionIndex: number, updates: Partial<FormSection>) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex ? { ...section, ...updates } : section
      ),
    }))
  }

  const addQuestion = (sectionIndex: number) => {
    const newQuestion: FormQuestion = {
      id: Date.now().toString(),
      type: "text",
      title: "Untitled Question",
      required: false,
    }
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      ),
    }))
  }

  const updateQuestion = (sectionIndex: number, questionIndex: number, question: FormQuestion) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((q, j) =>
                j === questionIndex ? question : q
              ),
            }
          : section
      ),
    }))
  }

  const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, questions: section.questions.filter((_, j) => j !== questionIndex) }
          : section
      ),
    }))
  }

  const deleteSection = (sectionIndex: number) => {
    if (form.sections.length === 1) {
      toast({
        title: "Error",
        description: "Form must have at least one section",
        variant: "destructive",
      })
      return
    }
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== sectionIndex),
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
            if (data.sections && Array.isArray(data.sections)) {
              setForm((prev) => ({
                ...prev,
                title: data.title || prev.title,
                description: data.description || prev.description,
                sections: data.sections.map((s: any, sIndex: number) => ({
                  ...s,
                  id: s.id || Date.now().toString() + sIndex,
                  questions: (s.questions || []).map((q: any, qIndex: number) => ({
                    ...q,
                    id: q.id || Date.now().toString() + sIndex + qIndex,
                    type: q.type || "text",
                  })),
                })),
                questions: [],
              }))
            } else if (data.questions && Array.isArray(data.questions)) {
              setForm((prev) => ({
                ...prev,
                title: data.title || prev.title,
                description: data.description || prev.description,
                sections: [
                  {
                    id: Date.now().toString(),
                    title: "Section 1",
                    description: "",
                    questions: data.questions.map((q: any, index: number) => ({
                      ...q,
                      id: q.id || Date.now().toString() + index,
                      type: q.type || "text",
                    })),
                  },
                ],
                questions: data.questions,
              }))
            } else {
              throw new Error("Invalid JSON format")
            }
            toast({
              title: "Success",
              description: "Form imported successfully!",
            })
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
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: form.sections.flatMap((section) => section.questions),
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Form Settings */}
      <Card className="border-0 shadow-lg rounded-2xl bg-white">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-2xl">
          <CardTitle className="text-2xl font-bold text-gray-900">Form Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="form-title" className="text-sm font-medium text-gray-700">Form Title</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="form-title-katex"
                  checked={katexToggles.formTitle}
                  onCheckedChange={(checked) =>
                    setKatexToggles((prev) => ({ ...prev, formTitle: checked }))
                  }
                  className="data-[state=checked]:bg-purple-600"
                />
                <Label htmlFor="form-title-katex" className="text-sm text-gray-600">Math Mode</Label>
              </div>
            </div>
            <Input
              id="form-title"
              value={form.title}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, title: e.target.value }))
                renderMath(e.target.value, "form-title-preview", katexToggles.formTitle)
              }}
              className="mt-1 text-lg font-medium border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
              placeholder={katexToggles.formTitle ? "Enter title (e.g., Solve 3^2)" : "Enter form title"}
            />
            {katexToggles.formTitle && (
              <div
                ref={(el) => {
                  if (el) mathPreviews.current.set("form-title-preview", el)
                }}
                className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="form-description" className="text-sm font-medium text-gray-700">Form Description</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="form-description-katex"
                  checked={katexToggles.formDescription}
                  onCheckedChange={(checked) =>
                    setKatexToggles((prev) => ({ ...prev, formDescription: checked }))
                  }
                  className="data-[state=checked]:bg-purple-600"
                />
                <Label htmlFor="form-description-katex" className="text-sm text-gray-600">Math Mode</Label>
              </div>
            </div>
            <Textarea
              id="form-description"
              value={form.description}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }))
                renderMath(e.target.value, "form-description-preview", katexToggles.formDescription)
              }}
              className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
              rows={4}
              placeholder={katexToggles.formDescription ? "Enter description (e.g., \\frac{1}{2})" : "Enter form description"}
            />
            {katexToggles.formDescription && (
              <div
                ref={(el) => {
                  if (el) mathPreviews.current.set("form-description-preview", el)
                }}
                className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id="is-test"
                checked={form.isTest}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isTest: checked }))}
                className="data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="is-test" className="text-sm font-medium text-gray-700">MCQ Test Mode</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is-published"
                checked={form.isPublished}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
                className="data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="is-published" className="text-sm font-medium text-gray-700">Published</Label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={importFromJSON}
              variant="outline"
              className="flex-1 min-w-[120px] border-2 border-gray-300 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 rounded-full py-2 transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import JSON
            </Button>

            <Button
              onClick={saveForm}
              disabled={saving}
              className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white rounded-full py-2 transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Form"}
            </Button>

            {initialForm?.id && (
              <Button
                onClick={previewForm}
                variant="outline"
                className="flex-1 min-w-[120px] border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 rounded-full py-2 transition-all duration-200"
              >
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
                className="flex-1 min-w-[120px] border-2 border-gray-300 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 rounded-full py-2 transition-all duration-200"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections and Questions */}
      <div className="space-y-6">
        {form.sections.map((section, sectionIndex) => (
          <Card key={section.id} className="border-0 shadow-lg rounded-2xl bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl flex flex-row items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`section-title-${sectionIndex}`} className="text-sm font-medium text-gray-700">
                    Section Title
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`section-title-katex-${sectionIndex}`}
                      checked={katexToggles.sections[sectionIndex]?.title || false}
                      onCheckedChange={(checked) =>
                        setKatexToggles((prev) => ({
                          ...prev,
                          sections: prev.sections.map((s, i) =>
                            i === sectionIndex ? { ...s, title: checked } : s
                          ),
                        }))
                      }
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Label htmlFor={`section-title-katex-${sectionIndex}`} className="text-sm text-gray-600">
                      Math Mode
                    </Label>
                  </div>
                </div>
                <Input
                  id={`section-title-${sectionIndex}`}
                  value={section.title}
                  onChange={(e) => {
                    updateSection(sectionIndex, { title: e.target.value })
                    renderMath(
                      e.target.value,
                      `section-title-${sectionIndex}`,
                      katexToggles.sections[sectionIndex]?.title || false
                    )
                  }}
                  className="text-lg font-semibold border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                  placeholder={katexToggles.sections[sectionIndex]?.title ? "Enter title (e.g., Solve x^2)" : "Section Title"}
                />
                {katexToggles.sections[sectionIndex]?.title && (
                  <div
                    ref={(el) => {
                      if (el) mathPreviews.current.set(`section-title-${sectionIndex}`, el)
                    }}
                    className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
                  />
                )}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`section-description-${sectionIndex}`} className="text-sm font-medium text-gray-700">
                    Section Description
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`section-description-katex-${sectionIndex}`}
                      checked={katexToggles.sections[sectionIndex]?.description || false}
                      onCheckedChange={(checked) =>
                        setKatexToggles((prev) => ({
                          ...prev,
                          sections: prev.sections.map((s, i) =>
                            i === sectionIndex ? { ...s, description: checked } : s
                          ),
                        }))
                      }
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <Label htmlFor={`section-description-katex-${sectionIndex}`} className="text-sm text-gray-600">
                      Math Mode
                    </Label>
                  </div>
                </div>
                <Textarea
                  id={`section-description-${sectionIndex}`}
                  value={section.description}
                  onChange={(e) => {
                    updateSection(sectionIndex, { description: e.target.value })
                    renderMath(
                      e.target.value,
                      `section-description-${sectionIndex}`,
                      katexToggles.sections[sectionIndex]?.description || false
                    )
                  }}
                  className="border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                  rows={2}
                  placeholder={katexToggles.sections[sectionIndex]?.description ? "Enter description (e.g., \\frac{1}{2})" : "Section Description (optional)"}
                />
                {katexToggles.sections[sectionIndex]?.description && (
                  <div
                    ref={(el) => {
                      if (el) mathPreviews.current.set(`section-description-${sectionIndex}`, el)
                    }}
                    className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
                  />
                )}
              </div>
              {form.sections.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSection(sectionIndex)}
                  className="ml-4 rounded-full"
                >
                  Delete Section
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {section.questions.map((question, questionIndex) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  onUpdate={(updatedQuestion) =>
                    updateQuestion(sectionIndex, questionIndex, updatedQuestion)
                  }
                  onDelete={() => deleteQuestion(sectionIndex, questionIndex)}
                  isTest={form.isTest}
                  renderMath={renderMath}
                />
              ))}
              <Button
                onClick={() => addQuestion(sectionIndex)}
                variant="outline"
                className="w-full border-2 border-gray-300 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 rounded-full py-2 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        ))}
        <Button
          onClick={addSection}
          variant="outline"
          className="w-full border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 rounded-full py-2 transition-all duration-200"
        >
          <Layout className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>
    </div>
  )
}