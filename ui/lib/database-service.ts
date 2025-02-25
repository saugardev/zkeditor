/**
 * Database Service for storing proof information
 */

/**
 * Interface for the proof record to be stored in the database
 */
export interface ProofRecord {
  id?: number;
  imageName: string;
  originalImageHash?: string;
  transformedImageHash?: string;
  proof: string;
  publicValues: string;
  ipfsImageUri?: string;
  ipfsMetadataUri: string;
  txHash?: string;
  timestamp: string;
}

/**
 * Save proof information to the database
 * @param proofData The proof data to save
 * @returns The response from the server
 */
export async function saveProofToDatabase(
  proofData: ProofRecord
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/proofs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proofData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save proof: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving proof to database:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Update an existing proof record with transaction hash
 * @param ipfsMetadataUri The IPFS metadata URI of the proof to update
 * @param txHash The transaction hash to add
 * @returns The response from the server
 */
export async function updateProofWithTxHash(
  ipfsMetadataUri: string,
  txHash: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/proofs/update-tx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ipfsMetadataUri, txHash }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update proof: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating proof in database:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
