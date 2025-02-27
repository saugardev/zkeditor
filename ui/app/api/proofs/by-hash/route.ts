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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const hash = url.searchParams.get("hash");

    if (!hash) {
      return NextResponse.json(
        {
          success: false,
          message: "Hash parameter is required",
        },
        { status: 400 }
      );
    }

    const db = await openDb();

    // Find proofs where the hash matches either originalImageHash or transformedImageHash
    const proofs = await db.all(
      `
      SELECT * FROM proofs 
      WHERE originalImageHash = ? OR transformedImageHash = ?
      ORDER BY timestamp DESC
    `,
      [hash, hash]
    );

    return NextResponse.json({
      success: true,
      data: proofs,
    });
  } catch (error: unknown) {
    console.error("Error retrieving proofs by hash:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve proofs by hash",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
