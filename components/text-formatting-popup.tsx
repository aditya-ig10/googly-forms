"use client"

import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, SquareDot } from "lucide-react"

interface TextFormattingPopupProps {
  onFormat: (type: "katex" | "bold" | "italic" | "underline") => void
}

export function TextFormattingPopup({ onFormat }: TextFormattingPopupProps) {
  return (
    <div className="absolute z-10 mt-1 bg-white border border-gray-300 shadow-lg rounded-md p-1 flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("bold")}
        className="p-1 hover:bg-purple-50"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("italic")}
        className="p-1 hover:bg-purple-50"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("underline")}
        className="p-1 hover:bg-purple-50"
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFormat("katex")}
        className="p-1 hover:bg-purple-50"
        title="Math Expression"
      >
        <SquareDot className="h-4 w-4" />
      </Button>
    </div>
  )
}