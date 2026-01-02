
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


