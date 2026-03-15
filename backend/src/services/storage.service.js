import fs from "fs/promises";
import path from "path";

const storageRoot = path.resolve("uploads");

export async function saveUserFile({ userId, filename, buffer }) {
  const userDir = path.join(storageRoot, userId);
  await fs.mkdir(userDir, { recursive: true });

  const safeName = `${Date.now()}-${filename}`;
  const fullPath = path.join(userDir, safeName);

  await fs.writeFile(fullPath, buffer);

  return {
    path: fullPath,
    filename: safeName
  };
}