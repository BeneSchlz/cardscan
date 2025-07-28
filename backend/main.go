package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/rs/cors"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/ocr", OCRHandler)

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000",
			"https://cardscan-three.vercel.app"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	fmt.Println("Server started at http://localhost:8080")
	err := http.ListenAndServe(":8080", handler)
	if err != nil {
		log.Fatal(err)
	}
}
