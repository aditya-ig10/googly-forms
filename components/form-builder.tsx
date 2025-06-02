"use client"

import { useState, useRef } from "react"
import type { Form, FormQuestion, FormSection } from "@/types/form"
import { QuestionEditor } from "./question-editor"
import { TextFormattingPopup } from "./text-formatting-popup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, Save, Eye, Copy, Layout, Type, Text, CheckSquare, SquareCheck, List, Mail, Hash, LucideIcon } from "lucide-react"
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
    theme: initialForm?.theme || {
      primaryColor: "#6B46C1",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      accentColor: "#9333EA"
    }
  })
  const [saving, setSaving] = useState(false)
  const [selectedInput, setSelectedInput] = useState<{ id: string; selection: { start: number; end: number } } | null>(null)
  const mathPreviews = useRef<Map<string, HTMLDivElement>>(new Map())
  const { toast } = useToast()
  const router = useRouter()

  const questionTypes: { type: FormQuestion["type"]; label: string; icon: LucideIcon }[] = [
    { type: "text", label: "Short Answer", icon: Type },
    { type: "textarea", label: "Paragraph", icon: Text },
    { type: "multiple-choice", label: "Multiple Choice", icon: CheckSquare },
    { type: "checkbox", label: "Checkboxes", icon: SquareCheck },
    { type: "dropdown", label: "Dropdown", icon: List },
    { type: "email", label: "Email", icon: Mail },
    { type: "number", label: "Number", icon: Hash },
  ]

  const renderMath = (text: string, elementId: string) => {
    const element = mathPreviews.current.get(elementId)
    if (element) {
      const katexRegex = /\\\(.*?\\\)/g
      let lastIndex = 0
      let html = ""
      let match

      while ((match = katexRegex.exec(text)) !== null) {
        const plainText = text.slice(lastIndex, match.index)
        const mathText = match[0].slice(2, -2)
        html += plainText.replace(/</g, "&lt;").replace(/>/g, "&gt;")
        try {
          const mathHtml = katex.renderToString(mathText, {
            throwOnError: false,
            displayMode: false,
          })
          html += mathHtml
        } catch {
          html += `<span class="text-red-500">[Invalid math]</span>`
        }
        lastIndex = match.index + match[0].length
      }
      html += text.slice(lastIndex).replace(/</g, "&lt;").replace(/>/g, "&gt;")
      html = html.replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
        .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
        .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      element.innerHTML = html
    }
  }

  const handleInputSelection = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>, id: string) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    const start = target.selectionStart ?? 0
    const end = target.selectionEnd ?? 0
    if (start !== end) {
      setSelectedInput({ id, selection: { start, end } })
    } else {
      setSelectedInput(null)
    }
  }

  const applyFormatting = (id: string, type: "katex" | "bold" | "italic" | "underline", value: string) => {
    if (!selectedInput || selectedInput.id !== id) return value
    const { start, end } = selectedInput.selection
    const selectedText = value.slice(start, end)
    let newText = value
    if (type === "katex") {
      newText = `${value.slice(0, start)}\\(${selectedText}\\)${value.slice(end)}`
    } else {
      const tags = {
        bold: ["<b>", "</b>"],
        italic: ["<i>", "</i>"],
        underline: ["<u>", "</u>"],
      }[type]
      newText = `${value.slice(0, start)}${tags[0]}${selectedText}${tags[1]}${value.slice(end)}`
    }
    setSelectedInput(null)
    return newText
  }

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

  const addQuestion = (sectionIndex: number, type: FormQuestion["type"]) => {
    const newQuestion: FormQuestion = {
      id: Date.now().toString(),
      type,
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex gap-6">
      <div className="flex-1 space-y-8">
        {/* Form Settings */}
        <Card className="border-0 shadow-lg rounded-2xl bg-white">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-2xl">
            <CardTitle className="text-2xl font-bold text-gray-900">Form Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="relative">
              <Label htmlFor="form-title" className="text-sm font-medium text-gray-700">Form Title</Label>
              <Input
                id="form-title"
                value={form.title}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                  renderMath(e.target.value, "form-title-preview")
                }}
                onSelect={(e) => handleInputSelection(e, "form-title")}
                className="mt-1 text-lg font-medium border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                placeholder="Enter form title"
              />
              {selectedInput?.id === "form-title" && (
                <TextFormattingPopup
                  onFormat={(type) => {
                    const newTitle = applyFormatting("form-title", type, form.title)
                    setForm((prev) => ({ ...prev, title: newTitle }))
                    renderMath(newTitle, "form-title-preview")
                  }}
                />
              )}
              <div
                ref={(el) => {
                  if (el) mathPreviews.current.set("form-title-preview", el)
                }}
                className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
              />
            </div>

            <div className="relative">
              <Label htmlFor="form-description" className="text-sm font-medium text-gray-700">Form Description</Label>
              <Textarea
                id="form-description"
                value={form.description}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                  renderMath(e.target.value, "form-description-preview")
                }}
                onSelect={(e) => handleInputSelection(e, "form-description")}
                className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                rows={4}
                placeholder="Enter form description"
              />
              {selectedInput?.id === "form-description" && (
                <TextFormattingPopup
                  onFormat={(type) => {
                    const newDesc = applyFormatting("form-description", type, form.description)
                    setForm((prev) => ({ ...prev, description: newDesc }))
                    renderMath(newDesc, "form-description-preview")
                  }}
                />
              )}
              <div
                ref={(el) => {
                  if (el) mathPreviews.current.set("form-description-preview", el)
                }}
                className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
              />
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
                  <div className="relative">
                    <Label htmlFor={`section-title-${sectionIndex}`} className="text-sm font-medium text-gray-700">
                      Section Title
                    </Label>
                    <Input
                      id={`section-title-${sectionIndex}`}
                      value={section.title}
                      onChange={(e) => {
                        updateSection(sectionIndex, { title: e.target.value })
                        renderMath(e.target.value, `section-title-${sectionIndex}`)
                      }}
                      onSelect={(e) => handleInputSelection(e, `section-title-${sectionIndex}`)}
                      className="mt-1 text-lg font-semibold border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                      placeholder="Section Title"
                    />
                    {selectedInput?.id === `section-title-${sectionIndex}` && (
                      <TextFormattingPopup
                        onFormat={(type) => {
                          const newTitle = applyFormatting(`section-title-${sectionIndex}`, type, section.title)
                          updateSection(sectionIndex, { title: newTitle })
                          renderMath(newTitle, `section-title-${sectionIndex}`)
                        }}
                      />
                    )}
                    <div
                      ref={(el) => {
                        if (el) mathPreviews.current.set(`section-title-${sectionIndex}`, el)
                      }}
                      className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
                    />
                  </div>
                  <div className="relative">
                    <Label htmlFor={`section-description-${sectionIndex}`} className="text-sm font-medium text-gray-700">
                      Section Description
                    </Label>
                    <Textarea
                      id={`section-description-${sectionIndex}`}
                      value={section.description}
                      onChange={(e) => {
                        updateSection(sectionIndex, { description: e.target.value })
                        renderMath(e.target.value, `section-description-${sectionIndex}`)
                      }}
                      onSelect={(e) => handleInputSelection(e, `section-description-${sectionIndex}`)}
                      className="mt-1 border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                      rows={2}
                      placeholder="Section Description (optional)"
                    />
                    {selectedInput?.id === `section-description-${sectionIndex}` && (
                      <TextFormattingPopup
                        onFormat={(type) => {
                          const newDesc = applyFormatting(`section-description-${sectionIndex}`, type, section.description || "")
                          updateSection(sectionIndex, { description: newDesc })
                          renderMath(newDesc, `section-description-${sectionIndex}`)
                        }}
                      />
                    )}
                    <div
                      ref={(el) => {
                        if (el) mathPreviews.current.set(`section-description-${sectionIndex}`, el)
                      }}
                      className="mt-2 p-2 bg-gray-50 rounded-lg text-sm min-h-[1.5em]"
                    />
                  </div>
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
                    onSelectInput={handleInputSelection}
                    selectedInput={selectedInput}
                    renderMath={renderMath}
                    applyFormatting={applyFormatting}
                  />
                ))}
                <Button
                  onClick={() => addQuestion(sectionIndex, "text")}
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

      {/* Question Type Toolbar */}
      <div className="w-16 sticky top-20 self-start">
        <Card className="border-0 shadow-lg rounded-2xl bg-white">
          <CardContent className="p-2 space-y-2">
            {questionTypes.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="ghost"
                size="icon"
                title={label}
                onClick={() => addQuestion(form.sections.length - 1, type)}
                className="w-12 h-12 rounded-full hover:bg-purple-50 hover:text-purple-700"
              >
                <Icon className="h-5 w-5" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}