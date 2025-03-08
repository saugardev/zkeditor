# Image Editor API

This document provides information about the Image Editor API, including how to run it, available endpoints, and example requests.

## Getting Started

### Running the API

To start the API server, use the following command:

```bash
cargo run --release
```

The server will start on `http://localhost:3001`.

## API Endpoints

### POST /prove

This endpoint processes an image with specified transformations and generates a cryptographic proof of the transformations.

#### Request Format

The request should be a `multipart/form-data` with the following parts:

- `image`: The image file to be processed
- `transformations`: JSON array of transformation operations
- `signature_data` (optional): JSON object containing signature and public key

#### Supported Transformations

Transformations are specified as a JSON array of operations. Each operation is an object with a single key representing the transformation type:

```json
[
  { "Rotate90": null },
  { "Crop": { "x": 10, "y": 10, "width": 100, "height": 100 } },
  { "Resize": { "width": 800, "height": 600 } }
  // Other transformations...
]
```

Supported transformations include:
- `Rotate90`: Rotates the image 90 degrees clockwise
- `Rotate180`: Rotates the image 180 degrees
- `Rotate270`: Rotates the image 270 degrees clockwise
- `FlipHorizontal`: Flips the image horizontally
- `FlipVertical`: Flips the image vertically
- `Crop`: Crops the image (requires x, y, width, height parameters)
- `Resize`: Resizes the image (requires width and height parameters)
- `Grayscale`: Converts the image to grayscale (optional region parameter)
- `Brighten`: Adjusts image brightness (requires value parameter, optional region)
- `Contrast`: Adjusts image contrast (requires contrast parameter, optional region)
- `Blur`: Applies gaussian blur (requires sigma parameter, optional region)
- `TextOverlay`: Adds text overlay to the image (requires text, position, font parameters)

#### Signature Data (Optional)

To verify the authenticity of the request, you can include signature data:

```json
{
  "signature": "0xe2e0ffb96c8629f1b9a840103025180d3442146f998e663701f7b153bdfcd7511f3474c9b9ee162b2cd7492db8d68af60e3f12ee06144681747dcbb6cd4916bf1b",
  "public_key": "0x6e8CdBE9CB9A90F75Fe4D5B2F08B9181b04f4Ea9"
}
```

### Example Request

Here's an example of a complete request to the `/prove` endpoint:

```bash
curl -X POST http://localhost:3001/prove \
  -F "image=@path/to/image.webp" \
  -F 'transformations=[{"Rotate90": null}]' \
  -F 'signature_data={"signature": "0xe2e0ffb96c8629f1b9a840103025180d3442146f998e663701f7b153bdfcd7511f3474c9b9ee162b2cd7492db8d68af60e3f12ee06144681747dcbb6cd4916bf1b", "public_key": "0x6e8CdBE9CB9A90F75Fe4D5B2F08B9181b04f4Ea9"}'
```

#### Example Response

The API returns a JSON response containing:

- The transformed image (base64 encoded)
- Proof data for verification
- Metadata about the transformation

```json
{
  "success": bool,
  "message": string,
  "final_iamge": number[],
  "original_image_hash": string,
  "transformed_image_hash": string,
  "has_signature": boolean,
  "proof_Data": {
    "proof": string,
    "verification_key": string,
    "public_values": string
  }
}
```

### Error Handling

The endpoint returns appropriate HTTP status codes and detailed error messages in the response body:

- `400 Bad Request`: Returned for most client-side errors, including:
  - Missing required fields (image or transformations)
  - Empty image data
  - Empty transformations list
  - Invalid JSON format for transformations
  - Invalid UTF-8 in transformations or signature data
  - Invalid hex format in signature or public key
  - Proof generation failures

- `500 Internal Server Error`: Unexpected server-side errors

Error responses follow the same JSON structure as successful responses, with `success: false` and an error message:

```json
{
  "success": false,
  "message": "Error message describing the issue",
  "final_image": [],
  "original_image_hash": "0x",
  "transformed_image_hash": "0x",
  "signer_public_key": "0x",
  "has_signature": false,
  "proof_data": null
}
```

## Supported Image Formats

The API supports the following image formats:
- JPEG
- PNG
- WebP
