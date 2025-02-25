/**
 * IPFS Service for interacting with Pinata IPFS API
 */

// Types for IPFS responses
interface PinataFileResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

interface PinataJSONResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Upload a file to IPFS via Pinata
 * @param file The file to upload
 * @param name Optional name for the file metadata
 * @returns The IPFS URI (ipfs://CID)
 */
export async function uploadFileToIPFS(
  file: File,
  name?: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  // Add metadata if name is provided
  if (name) {
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name,
      })
    );
  }

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT || ""}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file to IPFS: ${errorText}`);
  }

  const data: PinataFileResponse = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Upload JSON data to IPFS via Pinata
 * @param content The JSON content to upload
 * @param name Optional name for the metadata
 * @returns The IPFS URI (ipfs://CID)
 */
export async function uploadJSONToIPFS(
  content: Record<string, any>,
  name?: string
): Promise<string> {
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT || ""}`,
      },
      body: JSON.stringify({
        pinataContent: content,
        pinataMetadata: name ? { name } : undefined,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload JSON to IPFS: ${errorText}`);
  }

  const data: PinataJSONResponse = await response.json();
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Convert an IPFS URI to a gateway URL for viewing
 * @param ipfsUri The IPFS URI (ipfs://CID)
 * @returns A gateway URL or undefined if the URI is invalid
 */
export function getIPFSGatewayURL(ipfsUri: string | null): string | undefined {
  if (!ipfsUri) return undefined;
  const cid = ipfsUri.replace("ipfs://", "");
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/**
 * Create and upload proof metadata to IPFS
 * @param params The parameters for creating the proof metadata
 * @returns The IPFS URI of the uploaded metadata
 */
export async function uploadProofMetadata({
  imageCID,
  proof,
  publicValues,
  name,
  transformations,
}: {
  imageCID: string;
  proof: string;
  publicValues: string;
  name?: string;
  transformations?: any[];
}): Promise<string> {
  const metadata = {
    name: name || "Transformed Image with ZK Proof",
    // description: "Image with verifiable ZK proof of transformations",
    image: imageCID,
    proof,
    publicValues,
    // transformations: transformations || [],
    // timestamp: new Date().toISOString(),
  };

  return uploadJSONToIPFS(metadata, `${name || "proof-metadata"}.json`);
}

/**
 * Upload a blob as a file to IPFS
 * @param blob The blob to upload
 * @param fileName The name to give the file
 * @returns The IPFS URI of the uploaded file
 */
export async function uploadBlobToIPFS(
  blob: Blob,
  fileName: string
): Promise<string> {
  const file = new File([blob], fileName, { type: blob.type });
  return uploadFileToIPFS(file, fileName);
}
