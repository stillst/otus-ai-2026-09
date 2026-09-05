export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Reads a text file. Rejects with a message meant for the user when the file is too large. */
export async function loadTextFile(file: File, maxBytes = MAX_FILE_BYTES): Promise<string> {
  if (file.size > maxBytes) {
    throw new Error(`${file.name} is ${formatBytes(file.size)}. Files up to ${formatBytes(maxBytes)} are supported.`);
  }
  return file.text();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
