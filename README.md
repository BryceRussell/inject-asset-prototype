# Static Analysis

### How?

Works similar to a `?url` import

- **Dev**: Returns an absolute path relative to the root of your project
- **Build**: Uses a Vite plugin to:
    - Inject imports into build (`.../cat.png?static`)
    - Intercept the injected imports and use [`emitFile`](https://rollupjs.org/plugin-development/#this-emitfile) to add the asset to the bundle
    - Use static analysis to find injected asset paths and replace them

### Limitations

- Similar to `?url` import
- During build, returned value is an intermidate value used for static analysis and users may assume that it is always a path and do some dynamic stuff with it

### Example

```ts
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { initStaticAssets, injectAsset } from "./static-asset-controller";

let styles: string
let image: string;

function resolveAsset(path: string) {
  return resolve(fileURLToPath(import.meta.url), "../static", path);
}

export default defineConfig({
  integrations: [
    {
      name: "inject-assets",
      hooks: {
        "astro:config:setup": (params) => {
          styles = injectAsset(params, {
            entrypoint: resolveAsset("styles.css"),
          });

          image = injectAsset(params, {
            entrypoint: resolveAsset("cat.png"),
          });

          // dev:    '/static/cat.png'
          // build:  '__ASTRO_STATIC_ASSET__C:/.../static/cat.png?__' 
          //         ^^^ intermidate value replace with bundled path during build (/_astro/cat.BXRYhKOC.png)
          console.log("astro:config:setup", image);

          initStaticAssets(params);
        },
      },
    },
  ],
});
```
