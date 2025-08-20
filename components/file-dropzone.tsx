"use client"

import React from "react"
import { useDropzone } from "react-dropzone"

type FileDropzoneProps = {
  onFilesSelected?: (files: File[]) => void
}

export default function FileDropzone({ onFilesSelected }: FileDropzoneProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (onFilesSelected) onFilesSelected(acceptedFiles)
    },
    [onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "text/markdown": [".md"],
    },
    multiple: true,
  })

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragActive ? "border-white bg-white/10" : "border-white/40"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm">
          {isDragActive
            ? "Drop the files here..."
            : "Drag & drop PDF, TXT, MD, or CSV files here, or click to select"}
        </p>
      </div>
      {acceptedFiles.length > 0 && (
        <div className="text-xs">
          <div className="mb-1 font-semibold">Selected files:</div>
          <ul className="list-disc pl-5 space-y-1">
            {acceptedFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}


