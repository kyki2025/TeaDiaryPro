var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var u = { async fetch(o, e, p) {
  let l = new URL(o.url);
  try {
    if (l.pathname.startsWith("/api/"))
      return h(o, e);
    let t = l.pathname;
    t === "/" && (t = "/index.html");
    let r = t.startsWith("/") ? t.slice(1) : t;
    try {
      let s = await e.__STATIC_CONTENT.get(r, { type: "arrayBuffer" });
      if (s) {
        let a = f(r);
        return new Response(s, { headers: { "Content-Type": a, "Cache-Control": "public, max-age=86400" } });
      }
      let n = (await e.__STATIC_CONTENT.list()).keys.find((a) => {
        let c = r.split(".")[0], m = r.split(".").pop();
        return a.name.startsWith(c + ".") && a.name.endsWith("." + m);
      });
      if (n) {
        let a = await e.__STATIC_CONTENT.get(n.name, { type: "arrayBuffer" });
        if (a) {
          let c = f(r);
          return new Response(a, { headers: { "Content-Type": c, "Cache-Control": "public, max-age=86400" } });
        }
      }
    } catch (s) {
      console.error("KV error:", s);
    }
    if (!t.includes("."))
      try {
        let i = (await e.__STATIC_CONTENT.list()).keys.find((n) => n.name.startsWith("index.") && n.name.endsWith(".html"));
        if (i) {
          let n = await e.__STATIC_CONTENT.get(i.name, { type: "arrayBuffer" });
          if (n)
            return new Response(n, { headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=86400" } });
        }
      } catch (s) {
        console.error("Index error:", s);
      }
    return new Response("Not Found", { status: 404 });
  } catch (t) {
    return console.error("Worker error:", t), new Response(`Internal Server Error: ${t.message}`, { status: 500 });
  }
} };
async function h(o, e) {
  return new URL(o.url).pathname === "/api/health" ? new Response(JSON.stringify({ status: "ok", version: e.API_VERSION || "1.0.0", timestamp: (/* @__PURE__ */ new Date()).toISOString(), kvNamespace: e.__STATIC_CONTENT ? "available" : "not available" }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }) : new Response("API Not Found", { status: 404 });
}
__name(h, "h");
function f(o) {
  let e = o.split(".").pop()?.toLowerCase();
  return { html: "text/html", css: "text/css", js: "application/javascript", json: "application/json", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", ico: "image/x-icon", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", eot: "application/vnd.ms-fontobject" }[e] || "application/octet-stream";
}
__name(f, "f");
export {
  u as default
};
//# sourceMappingURL=worker.js.map
