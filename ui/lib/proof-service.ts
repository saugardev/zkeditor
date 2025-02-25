/**
 * Proof Service for generating ZK proofs of image transformations
 */
import { Transformation } from "@/types/transformations";

// Types for backend communication
export interface BackendTransformation {
  Crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  Grayscale?: {
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  Rotate90?: null;
  Rotate180?: null;
  Rotate270?: null;
  FlipVertical?: {
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  FlipHorizontal?: {
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  Brighten?: {
    value: number;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  Contrast?: {
    contrast: number;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  Blur?: {
    sigma: number;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  };
  TextOverlay?: {
    text: string;
    x: number;
    y: number;
    size: number;
    color: string;
  };
}

export interface ProofRequest {
  image_data: number[];
  id: string;
  transformations: BackendTransformation[];
}

export interface ProofResponse {
  success: boolean;
  message: string;
  final_image: number[];
  original_image_hash: string;
  transformed_image_hash: string;
  signer_public_key: string;
  has_signature: boolean;
  proof_data: {
    proof: string;
    verification_key: string;
    public_values: string;
  };
}

export interface ProofResult {
  proof: string;
  publicValues: string;
  finalImageUrl: string | null;
  message: string;
}

/**
 * Helper to convert frontend transformation to backend format
 */
export const mapTransformation = (t: Transformation): BackendTransformation => {
  const baseRegion = t.params?.region
    ? {
        region: {
          x: Math.round(t.params.region.x),
          y: Math.round(t.params.region.y),
          width: Math.round(t.params.region.width),
          height: Math.round(t.params.region.height),
        },
      }
    : { region: null };

  switch (t.type) {
    case "Crop":
      if (!t.params?.region) throw new Error("Crop requires region parameters");
      return {
        Crop: {
          x: Math.round(t.params.region.x),
          y: Math.round(t.params.region.y),
          width: Math.round(t.params.region.width),
          height: Math.round(t.params.region.height),
        },
      };
    case "Brighten":
      return {
        Brighten: {
          value: t.params?.value || 0,
          ...baseRegion,
        },
      };
    case "Contrast":
      return {
        Contrast: {
          contrast: t.params?.contrast || 1,
          ...baseRegion,
        },
      };
    case "Blur":
      return {
        Blur: {
          sigma: t.params?.sigma || 0,
          ...baseRegion,
        },
      };
    case "TextOverlay":
      if (!t.params?.text)
        throw new Error("TextOverlay requires text parameter");
      return {
        TextOverlay: {
          text: t.params.text,
          x: Math.round(t.params.region?.x || 0),
          y: Math.round(t.params.region?.y || 0),
          size: Math.round(t.params.size || 24),
          color: t.params.color || "#ffffff",
        },
      };
    case "Grayscale":
      return { Grayscale: baseRegion };
    case "FlipHorizontal":
      return { FlipHorizontal: baseRegion };
    case "FlipVertical":
      return { FlipVertical: baseRegion };
    case "Rotate90":
      return { Rotate90: null };
    case "Rotate180":
      return { Rotate180: null };
    case "Rotate270":
      return { Rotate270: null };
    default:
      throw new Error(`Unknown transformation type: ${t.type}`);
  }
};

/**
 * Load mock response for development
 */
export const loadMockResponse = async (): Promise<ProofResponse | null> => {
  try {
    const response = await fetch("/responseTemplate.json");
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn("Failed to load mock response:", err);
    return null;
  }
};

/**
 * Helper function to convert array of numbers to image URL
 */
export const arrayToImageUrl = (imageData: number[]): string => {
  const uint8Array = new Uint8Array(imageData);
  const blob = new Blob([uint8Array], { type: "image/jpeg" });
  return URL.createObjectURL(blob);
};

/**
 * Generate a ZK proof for image transformations
 */
export async function generateProof(
  imageUrl: string,
  id: string,
  transformations: Transformation[]
): Promise<ProofResult> {
  // Get raw image data
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const imageData = Array.from(uint8Array);

  // Map transformations to backend format
  const mappedTransformations = transformations
    .map(mapTransformation)
    .filter(Boolean);

  const request: ProofRequest = {
    image_data: imageData,
    id,
    transformations: mappedTransformations,
  };

  console.log("Sending request with transformations:", mappedTransformations);

  // Try to call the actual API first
  let data: ProofResponse;
  try {
    const proofResponse = await fetch("http://localhost:3001/prove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!proofResponse.ok) {
      throw new Error("Server returned an error");
    }

    data = await proofResponse.json();
  } catch (err) {
    console.warn("Failed to call actual API, falling back to mock:", err);
    // Load mock response as fallback
    const mockResponse = await loadMockResponse();
    if (!mockResponse) {
      throw new Error("Failed to load mock response");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
    data = mockResponse;
  }

  if (!data.success) {
    throw new Error(data.message || "Failed to generate proof");
  }

  if (!data.proof_data.proof) {
    throw new Error("No proof received from server");
  }

  // Convert final image data to URL
  const finalImageUrl = data.final_image
    ? arrayToImageUrl(data.final_image)
    : null;

  return {
    proof: data.proof_data.proof,
    publicValues: data.proof_data.public_values,
    finalImageUrl,
    message: data.message || "Proof generated successfully",
  };
}
