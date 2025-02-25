import { NextApiRequest, NextApiResponse } from "next";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

// Initialize database connection
async function openDb(): Promise<Database> {
  return open({
    filename: path.join(process.cwd(), "proofs.db"),
    driver: sqlite3.Database,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const db = await openDb();

    const { ipfsMetadataUri, txHash } = req.body;

    // Validate required fields
    if (!ipfsMetadataUri || !txHash) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: ipfsMetadataUri and txHash are required",
      });
    }

    // Update the proof record with the transaction hash
    const result = await db.run(
      `UPDATE proofs SET txHash = ? WHERE ipfsMetadataUri = ?`,
      [txHash, ipfsMetadataUri]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "No proof found with the provided IPFS metadata URI",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Proof updated successfully with transaction hash",
    });
  } catch (error: unknown) {
    console.error("Error updating proof:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update proof",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
