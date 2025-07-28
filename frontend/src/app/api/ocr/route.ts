
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const language = formData.get("language") as string

    // Mock OCR processing - replace with actual OCR service
    const results = await Promise.all(
      files.map(async (file) => {
        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock OCR result based on filename
        const mockTexts = [
          "This is a sample OCR result for your uploaded image. The text recognition has been processed successfully.",
          "Here is another example of extracted text from your image. You can edit this text as needed.",
          "Sample extracted text content. This would normally contain the actual text detected from your image file.",
        ]

        return {
          fileName: file.name,
          text: mockTexts[Math.floor(Math.random() * mockTexts.length)] + ` (Language: ${language})`,
        }
      }),
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error("OCR processing error:", error)
    return NextResponse.json({ error: "Failed to process OCR request" }, { status: 500 })
  }
}
