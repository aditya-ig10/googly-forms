import { getForm } from "@/lib/firestore"
import { FormRenderer } from "@/components/form-renderer"
import { notFound } from "next/navigation"

interface FormPageProps {
  params: { id: string }
}

export default async function FormPage({ params }: FormPageProps) {
  const form = await getForm(params.id)

  if (!form || !form.isPublished) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <FormRenderer form={form} />
    </div>
  )
}
