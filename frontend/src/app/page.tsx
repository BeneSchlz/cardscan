"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface UploadedFile {
  file: File
  id: string
  name: string
}

interface OCRResult {
  fileId: string
  fileName: string
  text: string
  isEdited: boolean
}

const SUPPORTED_LANGUAGES = [
  { value: "deu", label: "German (Deutsch)" },
  { value: "eng", label: "English" },
  { value: "spa", label: "Spanish (Español)" },
  { value: "fra", label: "French (Français)" },
  { value: "ita", label: "Italian (Italiano)" },
  { value: "por", label: "Portuguese (Português)" },
  { value: "jpn", label: "Japanese (日本語)" },
  { value: "chi_sim", label: "Chinese (Simplified)" },
  { value: "rus", label: "Russian (Русский)" },
  { value: "pol", label: "Polish (Polski)" },
  { value: "nld", label: "Dutch (Nederlands)" },
  { value: "tur", label: "Turkish (Türkçe)" },
  { value: "hin", label: "Hindi (हिंदी)" },
  { value: "kor", label: "Korean (한국어)" },
  { value: "ara", label: "Arabic (العربية)" },
  { value: "heb", label: "Hebrew (עברית)" },
  { value: "ukr", label: "Ukrainian (Українська)" },
  { value: "ces", label: "Czech (Čeština)" },
  { value: "ron", label: "Romanian (Română)" },
  { value: "swe", label: "Swedish (Svenska)" },
  { value: "fin", label: "Finnish (Suomi)" },
  { value: "dan", label: "Danish (Dansk)" },
  { value: "nor", label: "Norwegian (Norsk)" },
  { value: "ell", label: "Greek (Ελληνικά)" },
  { value: "hun", label: "Hungarian (Magyar)" },
 ]

export default function OCRConverter() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState("eng")
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = []
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const id = Math.random().toString(36).substr(2, 9)
        newFiles.push({
          file,
          id,
          name: file.name,
        })
      }
    })

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
    setOcrResults((prev) => prev.filter((result) => result.fileId !== fileId))
  }

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) return

    setIsProcessing(true)
    const formData = new FormData()

    uploadedFiles.forEach((uploadedFile) => {
      formData.append("files", uploadedFile.file)
    })
    formData.append("language", selectedLanguage)

    try {
      const response = await fetch("http://localhost:8080/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("OCR processing failed")
      }

      const results = await response.json()

      // Transform results to match our interface
      const newResults: OCRResult[] = uploadedFiles.map((file, index) => ({
        fileId: file.id,
        fileName: file.name,
        text: results[index]?.text || "No text detected",
        isEdited: false,
      }))

      setOcrResults(newResults)
    } catch (error) {
      console.error("Error processing OCR:", error)
      // Show error results
      const errorResults: OCRResult[] = uploadedFiles.map((file) => ({
        fileId: file.id,
        fileName: file.name,
        text: "Error processing image. Please try again.",
        isEdited: false,
      }))
      setOcrResults(errorResults)
    } finally {
      setIsProcessing(false)
    }
  }

  const updateOCRText = (fileId: string, newText: string) => {
    setOcrResults((prev) =>
      prev.map((result) => (result.fileId === fileId ? { ...result, text: newText, isEdited: true } : result)),
    )
  }

  const downloadAsText = (result: OCRResult) => {
    const blob = new Blob([result.text], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url

    // Create filename by replacing the extension with .txt
    const fileName = result.fileName.replace(/\.[^/.]+$/, ".md")
    link.download = fileName

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">OCR Note Converter</h1>
          <p className="mt-2 text-lg text-gray-600">Upload images and convert them to editable text</p>
        </div>

        {/* File Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Drag and drop images here</p>
              <p className="text-sm text-gray-500 mb-4">or click to select files (JPEG, PNG)</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                Upload Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files ({uploadedFiles.length})</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Input Language</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="mb-8">
          <Button
            onClick={handleSubmit}
            disabled={uploadedFiles.length === 0 || isProcessing}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Convert to Text"
            )}
          </Button>
        </div>

        {/* Results Display */}
        {ocrResults.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">OCR Results</h2>
            {ocrResults.map((result) => (
              <Card key={result.fileId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {result.fileName}
                    </span>
                    {result.isEdited && <span className="text-sm text-blue-600 font-normal">Edited</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={result.text}
                    onChange={(e) => updateOCRText(result.fileId, e.target.value)}
                    className="min-h-32 mb-4"
                    placeholder="OCR text will appear here..."
                  />
                  <Button onClick={() => downloadAsText(result)} variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Save as .md
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

