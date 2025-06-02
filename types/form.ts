export interface FormQuestion {
  id: string
  type: "text" | "textarea" | "multiple-choice" | "checkbox" | "dropdown" | "email" | "number"
  title: string
  description?: string
  required: boolean
  options?: string[]
  correctAnswer?: string | string[] // For MCQ tests
}

export interface FormSection {
  id: string
  title: string
  description?: string
  questions: FormQuestion[]
}

export interface Form {
  theme: { primaryColor: string; backgroundColor: string; textColor: string; accentColor: string }
  id: string
  title: string
  description: string
  sections: FormSection[]
  questions: FormQuestion[] // For backward compatibility
  isPublished: boolean
  isTest: boolean // For MCQ tests
  createdAt: Date
  updatedAt: Date
  userId: string
  userEmail: string
}

export interface FormResponse {
  id: string
  formId: string
  answers: Record<string, any>
  submittedAt: Date
  score?: number // For MCQ tests
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
}

export interface FormTheme {
  primaryColor: string // e.g., #673ab7
  backgroundColor: string // e.g., #f4f4f4
  textColor: string // e.g., #202124
  accentColor: string // e.g., #1a73e8
}