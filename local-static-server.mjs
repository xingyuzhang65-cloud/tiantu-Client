import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname);
const port = Number(process.env.PORT || 4175);
const host = "127.0.0.1";
const basePath = "/tiantu-Client";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".pdf", "application/pdf"],
]);

function resolveRequestPath(url) {
  const parsed = new URL(url, `http://${host}:${port}`);
  let pathname = decodeURIComponent(parsed.pathname);

  if (pathname === basePath) {
    pathname = "/";
  } else if (pathname.startsWith(`${basePath}/`)) {
    pathname = pathname.slice(basePath.length);
  }

  let requested = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  if (requested === "/" || requested === "\\") {
    requested = "index.html";
  }

  let filePath = resolve(join(root, requested));
  if (!filePath.startsWith(root)) {
    return null;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  return filePath;
}

createServer((req, res) => {
  const filePath = resolveRequestPath(req.url || "/");
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "content-type": mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}).listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/tiantu-Client/`);
});
