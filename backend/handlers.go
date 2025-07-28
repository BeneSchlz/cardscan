package main

import (
	"encoding/json"
	"fmt"
	"io"
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

func processFile(file io.Reader, filename, lang, format string) (OCRResponse, error) {
	tempPath := filepath.Join(os.TempDir(), filename)
	tempFile, err := os.Create(tempPath)
	if err != nil {
		return OCRResponse{}, err
	}
	defer tempFile.Close()

	if _, err := io.Copy(tempFile, file); err != nil {
		return OCRResponse{}, err
	}

	text, err := RunTesseract(tempPath, lang)
	if err != nil {
		return OCRResponse{}, err
	}

	return OCRResponse{
		Content:  text,
		FileName: filename,
		Format:   format,
	}, nil
}

func OCRHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is supported", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(32 << 20) // 32MB
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	lang := r.FormValue("language")
	files := r.MultipartForm.File["files"]

	type OCRResult struct {
		FileName string `json:"fileName"`
		Text     string `json:"text"`
	}

	var results []OCRResult

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			http.Error(w, "Could not open uploaded file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		tempDir := os.TempDir()
		tempPath := filepath.Join(tempDir, fileHeader.Filename)
		out, err := os.Create(tempPath)
		if err != nil {
			http.Error(w, "Could not create temp file", http.StatusInternalServerError)
			return
		}
		defer out.Close()
		io.Copy(out, file)

		text, err := RunTesseract(tempPath, lang)
		if err != nil {
			http.Error(w, fmt.Sprintf("OCR failed for %s: %v", fileHeader.Filename, err), http.StatusInternalServerError)
			return
		}

		results = append(results, OCRResult{
			FileName: fileHeader.Filename,
			Text:     text,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
