import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Form, FormResponse } from "@/types/form"

export const formsCollection = collection(db, "forms")
export const responsesCollection = collection(db, "responses")

export async function createForm(form: Omit<Form, "id">) {
  const docRef = await addDoc(formsCollection, {
    ...form,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return docRef.id
}

export async function updateForm(id: string, updates: Partial<Form>) {
  const formRef = doc(db, "forms", id)
  await updateDoc(formRef, {
    ...updates,
    updatedAt: new Date(),
  })
}

export async function deleteForm(id: string) {
  const formRef = doc(db, "forms", id)
  await deleteDoc(formRef)
}

export async function getForm(id: string): Promise<Form | null> {
  const formRef = doc(db, "forms", id)
  const formSnap = await getDoc(formRef)

  if (formSnap.exists()) {
    return { id: formSnap.id, ...formSnap.data() } as Form
  }
  return null
}

export async function getUserForms(userId: string): Promise<Form[]> {
  const q = query(formsCollection, where("userId", "==", userId), orderBy("updatedAt", "desc"))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Form[]
}

export async function submitResponse(response: Omit<FormResponse, "id">) {
  const docRef = await addDoc(responsesCollection, {
    ...response,
    submittedAt: new Date(),
  })
  return docRef.id
}

export async function getFormResponses(formId: string): Promise<FormResponse[]> {
  const q = query(responsesCollection, where("formId", "==", formId), orderBy("submittedAt", "desc"))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FormResponse[]
}
