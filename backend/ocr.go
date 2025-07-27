package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
)

func RunTesseract(imagePath, lang string) (string, error) {
	dir := filepath.Dir(imagePath)
	base := strings.TrimSuffix(filepath.Base(imagePath), filepath.Ext(imagePath))
	preprocessedPath := filepath.Join(dir, base+"_preprocessed.png")

	cmdPre := exec.Command("python3", "preprocess.py", imagePath)
	var preOut bytes.Buffer
	var preErr bytes.Buffer
	cmdPre.Stdout = &preOut
	cmdPre.Stderr = &preErr
	if err := cmdPre.Run(); err != nil {
		return "", fmt.Errorf("Preprocessing error: %s\n%s", err, preErr.String())
	}

	cmd := exec.Command("tesseract", preprocessedPath, "stdout", "-l", lang)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("Tesseract error: %s\n%s", err, stderr.String())
	}

	return out.String(), nil
}
