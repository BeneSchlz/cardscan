# CardScan
CardScan is a simple web app that extracts text from handwritten images using Tesseract OCR. It converts handwritten note cards (e.g., index cards) into editable text that can be downloaded as Markdown files.

**OCR results are still inconsistent and often inaccurate, especially with poor image quality or cursive writing**

The Live Demo is found on (https://cardscan-three.vercel.app/)

## What It Does
- Upload one or multiple handwritten images
- Select OCR language from a list (Tesseract-supported)
- Extract text using Go backend + Tesseract + Python preprocessing
- Allow real-time preview or correction of OCR output before saving output in Markdown format

## Stack
- **Frontend**: Next.js (App Router), TailwindCSS, shadcn/ui
- **Backend**: Go server with `net/http`, Tesseract OCR, Python (OpenCV preprocessing)
- **Deployment**:
  - Frontend: [Vercel](https://vercel.com/)
  - Backend: [Railway](https://railway.app/)

## Current Status

- Upload, OCR, and Markdown export work end-to-end
- Language selection is passed from the frontend and used by Tesseract
- Dockerized backend (Go + Tesseract + Python)
- Frontend works both locally and via Vercel deployment
- Backend is deployed and accessible over public URL (e.g. `https://cardscan-production.up.railway.app`)

## Optimizing Output Quality

To improve the text recognition accuracy:

1. Use high-resolution, well-lit images
2. Ensure high contrast between text and background
3. Write in clearly legible block letters (avoid cursive or messy handwriting)
4. Match the selected OCR language with the actual language used on the note (e.g. use "deu" for German notes)

## Next Steps
- Improve the preprocessing logic in `preprocess.py` to achieve better results
- Add feedback when OCR fails or is clearly low-confidence
- Optional: Dockerize the frontend for easier local development and deployment

## Tesseract License

Tesseract is licensed under the Apache License 2.0.  
You can read more here: https://github.com/tesseract-ocr/tesseract/blob/main/LICENSE

If you use this project in production or commercially, ensure compliance with that license.

## Setup

### Clone the repository

```bash
git clone https://github.com/BeneSchlz/cardscan.git
cd cardscan
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
docker build -t ocr-backend .
docker run -p 8080:8080 ocr-backend
```
