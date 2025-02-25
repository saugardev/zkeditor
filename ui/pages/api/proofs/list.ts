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
  // Only allow GET requests
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const db = await openDb();

    // Get all proofs, ordered by most recent first
    const proofs = await db.all(`
      SELECT * FROM proofs 
      ORDER BY timestamp DESC
    `);

    return res.status(200).json({
      success: true,
      data: proofs,
    });
  } catch (error: unknown) {
    console.error("Error retrieving proofs:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve proofs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
