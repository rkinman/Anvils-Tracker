
/**
 * Fetches the schema.sql file content from the public directory
 */
export async function fetchSchemaContent(): Promise<string> {
  const response = await fetch("/schema.sql");
  if (!response.ok) {
    throw new Error("Failed to load schema file.");
  }
  return await response.text();
}

/**
 * Fetches the edge function code from the public directory
 */
export async function fetchEdgeFunctionCode(): Promise<string> {
  const response = await fetch("/edge-function.ts");
  if (!response.ok) {
    throw new Error("Failed to load edge function code.");
  }
  return await response.text();
}
