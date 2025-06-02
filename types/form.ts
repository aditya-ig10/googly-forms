export interface FormQuestion {
  id: string
  type: "text" | "textarea" | "multiple-choice" | "checkbox" | "dropdown" | "email" | "number"
  title: string
  description?: string
  required: boolean
  options?: string[]
  correctAnswer?: string | string[] // For MCQ tests
}

export interface Form {
  id: string
  title: string
  description: string
  questions: FormQuestion[]
  isPublished: boolean
  isTest: boolean // For MCQ tests
  createdAt: Date
  updatedAt: Date
  userId: string // Add user ID
  userEmail: string // Add user email
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
