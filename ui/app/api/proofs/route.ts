import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    } = body;

    // Validate required fields
    if (!proof || !publicValues || !ipfsMetadataUri || !imageName) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
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

    return NextResponse.json(
      {
        success: true,
        message: "Proof saved successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error saving proof:", error);

    // Handle unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A proof with this IPFS metadata URI already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save proof",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await openDb();

    // Get all proofs, ordered by most recent first
    const proofs = await db.all(`
      SELECT * FROM proofs 
      ORDER BY timestamp DESC
    `);

    return NextResponse.json({
      success: true,
      data: proofs,
    });
  } catch (error: unknown) {
    console.error("Error retrieving proofs:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve proofs",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
