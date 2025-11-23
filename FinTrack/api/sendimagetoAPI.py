import os
import sys
import base64
import argparse
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv
load_dotenv()

# For image format detection
try:
    from PIL import Image
except ImportError:
    print("Warning: PIL/Pillow not installed. For better image format detection, install with: pip install pillow")

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Extract text from an image using Anthropic Claude API')
    parser.add_argument('image_path', help='Path to the image file')
    parser.add_argument('--output', '-o', help='Output file path (default: extracted_text.txt)')
    parser.add_argument('--api-key', '-k', help='Anthropic API key (or set ANTHROPIC_API_KEY env variable)')
    parser.add_argument('--model', '-m', default='claude-3-7-sonnet-20250219', 
                        help='Anthropic model to use (default: claude-3-7-sonnet-20250219)')
    args = parser.parse_args()

    # Get API key from args or environment
    api_key = args.api_key or os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("Error: Anthropic API key is required. Provide it via --api-key or set ANTHROPIC_API_KEY environment variable.")
        sys.exit(1)

    # Check if image file exists
    image_path = Path(args.image_path)
    if not image_path.exists():
        print(f"Error: Image file not found: {image_path}")
        sys.exit(1)
    
    # Determine output file path
    output_path = args.output or "extracted_text.txt"
    
    try:
        # Extract text from image using Anthropic API
        text = extract_text_from_image(api_key, image_path, args.model)
        print(text)
        # Save to output file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f"Text successfully extracted and saved to {output_path}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

def extract_text_from_image(api_key, image_path, model):
    """Extract text from image using Anthropic Claude API"""
    # api_key = os.environ.get('anthropic_api')
    # print("api_key", api_key)
    # print("image_path", image_path)
    # print("model", model)
    # Initialize Anthropic client
    client = Anthropic(api_key=api_key)
    
    # Determine MIME type based on file content using PIL
    try:
        from PIL import Image
        
        # Map PIL format names to MIME types
        mime_map = {
            'JPEG': 'image/jpeg',
            'PNG': 'image/png',
            'GIF': 'image/gif',
            'BMP': 'image/bmp',
            'WEBP': 'image/webp',
            'TIFF': 'image/tiff'
        }
        
        # Detect image type from content
        with Image.open(image_path) as img:
            if img.format in mime_map:
                mime_type = mime_map[img.format]
            else:
                mime_type = 'image/jpeg'  # default
    except (ImportError, Exception) as e:
        # Fall back to extension-based detection if PIL fails or isn't installed
        print(f"Warning: PIL detection failed ({str(e)}), falling back to extension-based detection")
        ext = str(image_path).lower().split('.')[-1]
        if ext in ['jpg', 'jpeg']:
            mime_type = 'image/jpeg'
        elif ext == 'png':
            mime_type = 'image/png'
        elif ext == 'gif':
            mime_type = 'image/gif'
        elif ext == 'webp':
            mime_type = 'image/webp'
        elif ext == 'bmp':
            mime_type = 'image/bmp'
        elif ext in ['tif', 'tiff']:
            mime_type = 'image/tiff'
        else:
            mime_type = 'image/jpeg'  # default
            
    print(f"Detected image type: {mime_type}")
    
    # Read image file
    with open(image_path, "rb") as image_file:
        image_data = base64.b64encode(image_file.read()).decode("utf-8")

    print("Got here")
    
    # Create message with image
    message = client.messages.create(
        model=model,
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": "Please extract all the text from this image."
                    }
                ]
            }
        ]
    )
    
    # Return extracted text
    # print(message.content[0].text)
    return message.content[0].text

if __name__ == "__main__":
    main()