package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

type OCRResponse struct {
	Content  string `json:"content"`
	FileName string `json:"filename"`
	Format   string `json:"format"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func respondWithError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

func OCRHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "Only POST allowed")
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		log.Printf("Failed to parse form: %v", err)
		respondWithError(w, http.StatusBadRequest, "Error parsing form")
		return
	}

	file, handler, err := r.FormFile("image")
	if err != nil {
		log.Printf("Failed to read uploaded file: %v", err)
		respondWithError(w, http.StatusBadRequest, "Image required")
		return
	}
	defer file.Close()

	lang := r.FormValue("lang")
	if lang == "" {
		lang = "eng"
	}
	format := r.FormValue("format")
	if format == "" {
		format = "md"
	}

	tempPath := filepath.Join(os.TempDir(), handler.Filename)
	tempFile, err := os.Create(tempPath)
	if err != nil {
		log.Printf("Failed to create temp file: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to save image")
		return
	}
	defer tempFile.Close()
	io.Copy(tempFile, file)

	text, err := RunTesseract(tempPath, lang)
	if err != nil {
		log.Printf("OCR failed: %v", err)
		respondWithError(w, http.StatusInternalServerError, "OCR failed")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(OCRResponse{
		Content:  text,
		FileName: handler.Filename,
		Format:   format,
	})
}
