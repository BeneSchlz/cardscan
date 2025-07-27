package main

import (
	"github.com/otiai10/gosseract/v2"
)

func RunTesseract(imagePath, lang string) (string, error) {
	client := gosseract.NewClient()
	defer client.Close()

	client.SetImage(imagePath)
	client.Languages = []string{lang}

	text, err := client.Text()
	if err != nil {
		return "", err
	}
	return text, nil
}
