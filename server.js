import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";

const root = process.cwd();
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
};

function sendFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(res);
}

function notFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

function safeResolve(baseDir, requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const cleanPath = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const resolved = resolve(baseDir, `.${cleanPath}`);
  return resolved.startsWith(resolve(baseDir)) ? resolved : null;
}

function resolveStaticPath(urlPath) {
  if (urlPath === "/" || urlPath === "") {
    return join(root, "index.html");
  }

  if (urlPath.startsWith("/word-bloom-crossword")) {
    const subPath = urlPath.replace(/^\/word-bloom-crossword/, "") || "/";
    const distRoot = join(root, "word-bloom-crossword", "dist");
    const resolved = safeResolve(distRoot, subPath);
    if (!resolved) return null;
    if (existsSync(resolved) && statSync(resolved).isDirectory()) {
      return join(resolved, "index.html");
    }
    return existsSync(resolved) ? resolved : join(distRoot, "index.html");
  }

  const resolved = safeResolve(root, urlPath);
  if (!resolved) return null;
  if (existsSync(resolved) && statSync(resolved).isDirectory()) {
    return join(resolved, "index.html");
  }
  return resolved;
}

createServer((req, res) => {
  const filePath = resolveStaticPath(req.url || "/");
  if (!filePath || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    notFound(res);
    return;
  }

  sendFile(res, filePath);
}).listen(port, "0.0.0.0", () => {
  console.log(`Mia minigames available at http://0.0.0.0:${port}`);
});
