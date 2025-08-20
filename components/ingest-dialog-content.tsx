"use client"

import React from "react"
import FileDropzone from "@/components/file-dropzone"

type IngestDialogContentProps = {
  url: string
  onUrlChange: (url: string) => void
  files: File[]
  onFilesSelected: (files: File[]) => void
}

export default function IngestDialogContent({
  url,
  onUrlChange,
  files,
  onFilesSelected,
}: IngestDialogContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm">URL (optional)</label>
        <input
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="bg-transparent border border-white/40 rounded-md p-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm">Files (optional)</label>
        <FileDropzone onFilesSelected={onFilesSelected} />
      </div>
    </div>
  )
}
