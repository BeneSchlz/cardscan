package main

import (
	"encoding/json"
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
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "Only POST allowed")
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		respondWithError(w, http.StatusBadRequest, "Error parsing form")
		return
	}

	lang := r.FormValue("lang")
	if lang == "" {
		lang = "eng"
	}
	format := r.FormValue("format")
	if format == "" {
		format = "md"
	}

	var responses []OCRResponse

	// First try single file field: "image"
	if file, handler, err := r.FormFile("image"); err == nil {
		defer file.Close()
		resp, err := processFile(file, handler.Filename, lang, format)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, err.Error())
			return
		}
		responses = append(responses, resp)
	} else {
		// Fallback to multiple files under "images"
		files := r.MultipartForm.File["images"]
		if len(files) == 0 {
			respondWithError(w, http.StatusBadRequest, "No image or images field provided")
			return
		}
		for _, fileHeader := range files {
			f, err := fileHeader.Open()
			if err != nil {
				respondWithError(w, http.StatusInternalServerError, "Failed to open uploaded file")
				return
			}
			defer f.Close()

			resp, err := processFile(f, fileHeader.Filename, lang, format)
			if err != nil {
				respondWithError(w, http.StatusInternalServerError, err.Error())
				return
			}
			responses = append(responses, resp)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}
