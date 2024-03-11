# Prototype for injecting static assets into Astro bundle

Main code is in [`static-asset-controller.ts`](static-asset-controller.ts) and [`astro.config.ts`](astro.config.ts). To test, run the `dev` or `build` commands and watch the console

### Why?

- Inject static assets from any folder
- Include asset inside Astro bundle
- Access the bundled/hashed path of an asset inside an integration

### How?

- **Dev**: Uses middleware to serve static assets (`/styles.css`)
- **Build**: Uses a Vite plugin to:
    - Inject imports into build (`.../styles.css?injectAsset`)
    - Intercept injected imports and inject the asset into the build using [`emitFile` from rollup
](https://rollupjs.org/plugin-development/#this-emitfile)
    - Update an external `Map` with bundled/hashed pathname (`/_astro/styles.DEh1v8hz.css`)
    - Integration authors can then `.get` the map for the bundled/hashed path

### Limitations

- The bundled/hashed path (`/_astro/styles.DEh1v8hz.css`) can only be accessed inside:
    - Vite plugin [`generateBundle()`](https://rollupjs.org/plugin-development/#generatebundle) hook
    - `astro:build:ssr` hook
    - `astro:build:generated` hook
    - `astro:build:done` hook


### Example

```ts
import { defineConfig } from "astro/config";
import { staticAssetController } from "./static-asset-controller";

const { assets, initStaticAssets } = staticAssetController();

export default defineConfig({
  integrations: [
    {
      name: "inject-assets",
      hooks: {
        "astro:config:setup": (params) => {
          initStaticAssets(params, { dir: "static", cwd: import.meta.url });

          // { resourceId: null, filepath: ".../styles.css", pathname: "/styles.css" }
          console.log("astro:config:setup", assets);
        },

        // { resourceId: "BIMVZw5i", filepath: ".../styles.css", pathname: "/_astro/styles.DEh1v8hz.css" }
        "astro:build:ssr": () => {
          console.log("astro:build:ssr", assets);
        },
        "astro:build:generated": () => {
          console.log("astro:build:generated", assets);
        },
        "astro:build:done": () => {
          console.log("astro:build:done", assets);
        },
      },
    },
  ],
});
```
