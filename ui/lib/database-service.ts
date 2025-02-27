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
 * Get the base URL for API calls
 * @returns The base URL for API calls
 */
function getBaseUrl() {
  // Check if we're running in a browser environment
  if (typeof window !== "undefined") {
    // Use the current window location as the base
    return window.location.origin;
  }
  // For server-side rendering, use an empty string (relative URL)
  return "";
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
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/proofs`, {
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
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/proofs/update-tx`, {
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

/**
 * Get a single proof by ID from the database
 * @param id The ID of the proof to retrieve
 * @returns The proof record if found
 */
export async function getProofById(id: number | string): Promise<{
  success: boolean;
  data?: ProofRecord;
  message?: string;
}> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/proofs/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to retrieve proof: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error retrieving proof with ID ${id}:`, error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all proofs from the database
 * @returns The list of proofs
 */
export async function getAllProofs(): Promise<{
  success: boolean;
  data?: ProofRecord[];
  message?: string;
}> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/proofs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to retrieve proofs: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error retrieving proofs from database:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Find proofs by hash (either originalImageHash or transformedImageHash)
 * @param hash The hash to search for
 * @returns The proofs that match the hash
 */
export async function findProofsByHash(hash: string): Promise<{
  success: boolean;
  data?: ProofRecord[];
  message?: string;
}> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/proofs/by-hash?hash=${hash}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to retrieve proofs by hash: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error retrieving proofs by hash:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Find a single proof by hash (either originalImageHash or transformedImageHash)
 * @param hash The hash to search for
 * @param matchType Optional parameter to specify which hash field to match ('original' or 'transformed')
 * @returns The first proof that matches the hash
 */
export async function findProofByHash(
  hash: string,
  matchType?: "original" | "transformed"
): Promise<{
  success: boolean;
  data?: ProofRecord;
  message?: string;
}> {
  try {
    const { success, data, message } = await findProofsByHash(hash);

    if (!success || !data) {
      return { success, message, data: undefined };
    }

    // Filter based on matchType if specified
    let matchedProof: ProofRecord | undefined;

    if (matchType === "original") {
      matchedProof = data.find((p) => p.originalImageHash === hash);
    } else if (matchType === "transformed") {
      matchedProof = data.find((p) => p.transformedImageHash === hash);
    } else {
      // If no matchType specified, return the first match
      matchedProof = data[0];
    }

    if (matchedProof) {
      return { success: true, data: matchedProof };
    } else {
      return {
        success: false,
        message: `No proof found with ${matchType || ""} hash: ${hash}`,
      };
    }
  } catch (error) {
    console.error(`Error finding proof with hash ${hash}:`, error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
