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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await openDb();

    const { ipfsMetadataUri, txHash } = body;

    // Validate required fields
    if (!ipfsMetadataUri || !txHash) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields: ipfsMetadataUri and txHash are required",
        },
        { status: 400 }
      );
    }

    // Update the proof record with the transaction hash
    const result = await db.run(
      `UPDATE proofs SET txHash = ? WHERE ipfsMetadataUri = ?`,
      [txHash, ipfsMetadataUri]
    );

    if (result.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No proof found with the provided IPFS metadata URI",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Proof updated successfully with transaction hash",
    });
  } catch (error: unknown) {
    console.error("Error updating proof:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update proof",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
