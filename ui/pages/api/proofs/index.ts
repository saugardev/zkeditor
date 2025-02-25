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

// Ensure the table exists
async function initializeDb(): Promise<Database> {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imageName TEXT NOT NULL,
      originalImageHash TEXT,
      transformedImageHash TEXT,
      proof TEXT NOT NULL,
      publicValues TEXT NOT NULL,
      ipfsImageUri TEXT,
      ipfsMetadataUri TEXT NOT NULL UNIQUE,
      txHash TEXT,
      timestamp TEXT NOT NULL
    )
  `);
  return db;
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
    const db = await initializeDb();

    const {
      imageName,
      originalImageHash,
      transformedImageHash,
      proof,
      publicValues,
      ipfsImageUri,
      ipfsMetadataUri,
      txHash,
    } = req.body;

    // Validate required fields
    if (!proof || !publicValues || !ipfsMetadataUri || !imageName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Insert the proof record
    const timestamp = new Date().toISOString();

    await db.run(
      `INSERT INTO proofs (
        imageName, originalImageHash, transformedImageHash, proof, 
        publicValues, ipfsImageUri, ipfsMetadataUri, txHash, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        imageName,
        originalImageHash || null,
        transformedImageHash || null,
        proof,
        publicValues,
        ipfsImageUri || null,
        ipfsMetadataUri,
        txHash || null,
        timestamp,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Proof saved successfully",
    });
  } catch (error: unknown) {
    console.error("Error saving proof:", error);

    // Handle unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return res.status(409).json({
        success: false,
        message: "A proof with this IPFS metadata URI already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save proof",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
