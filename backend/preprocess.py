import cv2
import sys
import os

def preprocess_image(image_path):
    # Load the image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Could not read image: {image_path}")
        return

    # Rotate if height > width
    h, w = image.shape[:2]
    if h > w:
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian Blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)

    # Apply adaptive thresholding for better contrast
    thresh = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        15,
        10
    )

    # Output path
    base = os.path.splitext(image_path)[0]
    output_path = f"{base}_preprocessed.png"

    # Save result
    cv2.imwrite(output_path, thresh)
    print(f"Saved preprocessed image to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python preprocess.py image_path")
        sys.exit(1)

    preprocess_image(sys.argv[1])
