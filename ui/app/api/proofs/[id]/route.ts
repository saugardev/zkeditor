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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const awaitParams = await params;
    const id = awaitParams.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ID provided",
        },
        { status: 400 }
      );
    }

    const db = await openDb();

    // Get a single proof by ID
    const proof = await db.get(
      `
      SELECT * FROM proofs 
      WHERE id = ?
    `,
      parseInt(id)
    );

    if (!proof) {
      return NextResponse.json(
        {
          success: false,
          message: "Proof not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: proof,
    });
  } catch (error: unknown) {
    console.error("Error retrieving proof:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve proof",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
