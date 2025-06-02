import { FormBuilder } from "@/components/form-builder"

export default function CreateFormPage() {
  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <div className="animate-pop-in">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Create New Form
        </h1>
        <FormBuilder />
      </div>
    </div>
  )
}
