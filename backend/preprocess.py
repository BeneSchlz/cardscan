import cv2
import numpy as np
import sys
import os

def preprocess_image(input_path):
    # Load image
    img = cv2.imread(input_path)
    if img is None:
        print("ERROR: Cannot read image:", input_path)
        return None

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Blur to reduce noise
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # Binarize using Otsu’s thresholding
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Optional: Sharpen
    kernel = np.array([[0, -1, 0],
                       [-1, 5, -1],
                       [0, -1, 0]])
    sharpened = cv2.filter2D(thresh, -1, kernel)

    # Optional: Denoise
    denoised = cv2.medianBlur(sharpened, 3)

    # Save as .png
    base_name = os.path.splitext(input_path)[0]
    output_path = base_name + "_preprocessed.png"
    cv2.imwrite(output_path, denoised)

    print(output_path)  # You can read this in Go
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python preprocess.py input.jpg")
    else:
        preprocess_image(sys.argv[1])
