// next.config.ts
import type { NextConfig } from "next";
import path from "node:path";

/**
 * Part 4b fix — resolves:
 *   Module not found: Can't resolve 'monaco-editor/esm/vs/editor/editor.api.js'
 *   (thrown from node_modules/y-monaco/src/y-monaco.js)
 *
 * ROOT CAUSE: monaco-editor's own package.json "exports" map (present
 * since ~0.44+) defines a self-referencing wildcard:
 *
 *   "./*.js": "./esm/vs/*.js"
 *
 * The resolver substitutes the ENTIRE requested subpath into that
 * wildcard. y-monaco imports "monaco-editor/esm/vs/editor/editor.api.js",
 * so the requested subpath is "esm/vs/editor/editor.api.js" — which
 * gets substituted in as "./esm/vs/esm/vs/editor/editor.api.js" (the
 * "esm/vs" prefix doubles), a path that doesn't exist on disk. This
 * is a genuine bug in that version of monaco-editor's exports map,
 * not a misconfiguration on KODEO's side.
 *
 * WHY A PLAIN WEBPACK ALIAS DOESN'T FIX IT: this specifier is
 * package-shaped ("monaco-editor/..."), so Next.js's webpack pipeline
 * resolves it through monaco-editor's (broken) exports map before
 * ever consulting `resolve.alias` or `NormalModuleReplacementPlugin`
 * for that specifier — verified directly: both approaches leave the
 * plugin/alias entirely unconsulted, the build fails identically
 * either way. This holds regardless of App Router vs Pages Router,
 * so it isn't an RSC-specific quirk either.
 *
 * THE ACTUAL FIX (two parts, both required):
 *   1. patches/y-monaco+0.1.6.patch (applied via patch-package on
 *      `npm install`, see package.json's "postinstall" script)
 *      changes y-monaco's one broken import line to a NON-package-
 *      shaped placeholder specifier ("__kodeo_monaco_shim__") — since
 *      it no longer looks like a package import, it never goes near
 *      monaco-editor's exports map at all.
 *   2. The webpack.resolve.alias below maps that placeholder to a
 *      local shim (src/shims/monaco-editor-api-shim.js) which reads
 *      monaco.Range / monaco.Selection / monaco.SelectionDirection —
 *      the only 3 things y-monaco needs at runtime — off
 *      `window.monaco`, the exact same live Monaco instance
 *      @monaco-editor/react's own loader already mounts there. This
 *      also avoids bundling a SECOND, separately-instantiated copy of
 *      all of monaco-editor into the client bundle, which would
 *      otherwise both bloat the bundle and risk subtle bugs from two
 *      non-identical `monaco` namespace objects existing at once.
 *
 * Verified end-to-end: fresh `npm install` (postinstall applies the
 * patch) → `next build` compiles cleanly with zero errors, both App
 * Router and Pages Router entry points, both dev and production
 * builds.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: ["192.168.0.109", "localhost", "127.0.0.1"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      __kodeo_monaco_shim__: path.resolve(__dirname, "src/shims/monaco-editor-api-shim.js"),
    };
    return config;
  },
};

export default nextConfig;
