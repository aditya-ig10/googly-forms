import { getForm } from "@/lib/firestore"
import { FormBuilder } from "@/components/form-builder"
import { notFound } from "next/navigation"

interface EditFormPageProps {
  params: { id: string }
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const form = await getForm(params.id)

  if (!form) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Edit Form</h1>
      <FormBuilder initialForm={form} />
    </div>
  )
}
