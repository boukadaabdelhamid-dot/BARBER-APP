import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be set to a valid port.");
}

const publicDirectory = resolve(fileURLToPath(new URL("./dist/public/", import.meta.url)));
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  const requestedPath = resolve(publicDirectory, `.${pathname}`);
  if (
    requestedPath !== publicDirectory &&
    !requestedPath.startsWith(`${publicDirectory}${sep}`)
  ) {
    response.writeHead(400).end();
    return;
  }

  let filePath = requestedPath;
  try {
    const requestedStat = await stat(filePath);
    if (requestedStat.isDirectory()) filePath = resolve(filePath, "index.html");
    else if (!requestedStat.isFile()) throw new Error("Not a file");
  } catch {
    filePath = resolve(publicDirectory, "index.html");
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");

    const isHashedAsset = filePath.includes(`${sep}assets${sep}`);
    response.writeHead(200, {
      "Content-Length": fileStat.size,
      "Content-Type": contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": isHashedAsset ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(port, "0.0.0.0");
