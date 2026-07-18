export interface Cursor {
  sortValue: string;
  id: string;
}

export function encodeCursor(sortValue: string, id: string): string {
  return Buffer.from(`${sortValue}|${id}`, "utf-8").toString("base64url");
}

export function decodeCursor(cursor: string): Cursor {
  const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
  const [sortValue, id] = decoded.split("|");
  if (!sortValue || !id) {
    throw new Error("Malformed cursor");
  }
  return { sortValue, id };
}
