# Prototype for injecting static assets into Astro bundle

Main code is in [`static-asset-controller.ts`](static-asset-controller.ts) and [`astro.config.ts`](astro.config.ts). To test, run the `dev` or `build` commands and watch the console

### Why?

- Inject static assets from any folder
- Include asset inside Astro bundle
- Access the bundled/hashed path of an asset inside an integration

### Limitations

- Can only access bundled/hashed paths (`/_astro/styles.DEh1v8hz.css`) inside build hooks:
  - `astro:build:ssr`
  - `astro:build:generated`
  - `astro:build:done`


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

          // { resourceId: null, filename: ".../styles.css", pathname: "/styles.css" }
          console.log("astro:config:setup", assets);
        },

        // { resourceId: "BIMVZw5i", filename: ".../styles.css", pathname: "/_astro/styles.DEh1v8hz.css" }
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