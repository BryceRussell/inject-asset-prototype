# Prototype for injecting static assets into Astro bundle

Main code is in [`static-asset-controller.ts`](static-asset-controller.ts) and [`astro.config.ts`](astro.config.ts). To test, run the `dev` or `build` commands and watch the console

### Why?

- Inject static assets from anywhere
- Include assets inside the Astro bundle
- Access the bundled/hashed path of an asset inside an integration

### How?

- **Build**: Uses a Vite plugin to:
    - Inject imports into build (`.../cat.png?static`)
    - Intercept the injected imports and use [`emitFile`](https://rollupjs.org/plugin-development/#this-emitfile) to add the asset to the bundle
    - Update a global `Map` with bundled/hashed pathname (`/_astro/styles.DEh1v8hz.css`) when generating the build

### Limitations

- The bundled/hashed path (`/_astro/styles.DEh1v8hz.css`) can only be accessed inside:
    - Vite plugin [`generateBundle()`](https://rollupjs.org/plugin-development/#generatebundle) hook or any hook after it
    - `astro:build:ssr` hook
    - `astro:build:generated` hook
    - `astro:build:done` hook

### What would this look like in Astro?

```ts
export default function() {
  let asset;
  return {
    name: "my-integration",
    hooks: {
      "astro:config:setup": ({ injectAsset }) => {
        asset = injectAsset({
          entrypoint: ".../static/cat.png",
        });
        // {
        //   id: null,
        //   entrypoint: 'C:/Users/Bryce/Desktop/Projects/Tests/inject-asset/static/cat.png',
        //   pathname: '/static/cat.png'
        // }
        console.log(asset())
      },
      "astro:build:done": () => {
        // {
        //   entrypoint: 'C:/Users/Bryce/Desktop/Projects/Tests/inject-asset/static/cat.png',
        //   id: 'DeV46TUP',
        //   pathname: '/_astro/cat.BXRYhKOC.png'
        // }
        console.log(asset());
      },
    }
  }
}
```

### Example

```ts
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { initStaticAssets, injectAsset } from "./static-asset-controller";

let asset: ReturnType<typeof injectAsset>;

function resolveAsset(path: string) {
  return resolve(fileURLToPath(import.meta.url), "../static", path);
}

export default defineConfig({
  integrations: [
    {
      name: "inject-assets",
      hooks: {
        "astro:config:setup": (params) => {
          asset = injectAsset(params, {
            entrypoint: resolveAsset("cat.png"),
          });

          // {
          //   id: null,
          //   entrypoint: 'C:/Users/Bryce/Desktop/Projects/Tests/inject-asset/static/cat.png',
          //   pathname: '/static/cat.png'
          // }
          console.log("astro:config:setup", asset());

          initStaticAssets(params);
        },

        // {
        //   entrypoint: 'C:/Users/Bryce/Desktop/Projects/Tests/inject-asset/static/cat.png',
        //   id: 'DeV46TUP',
        //   pathname: '/_astro/cat.BXRYhKOC.png'
        // }
        "astro:build:ssr": () => {
          console.log("astro:build:ssr", asset());
        },
        "astro:build:generated": () => {
          console.log("astro:build:generated", asset());
        },
        "astro:build:done": () => {
          console.log("astro:build:done", asset());
        },
      },
    },
  ],
});

```
