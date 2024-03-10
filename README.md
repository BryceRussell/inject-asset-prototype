# Prototype for injecting static assets into Astro bundle

Main code is in [`static-asset-controller.ts`](static-asset-controller.ts) and [`astro.config.ts`](astro.config.ts), run the `dev` and `build` script and watch the console

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
import { staticAssetController } from "./static-asset-controller";

export default function () {

  const { 
    getStaticAsset,
    staticAssetMiddleware,
    addStaticAssetDir
  } = staticAssetController();

  return {
    name: "inject-assets",
    hooks: {
      "astro:config:setup": (params) => {
        addStaticAssetDir(params, { dir: "static" });

        // { resourceId: null, fileName: "..../cat.png", pathname: "/cat.png" }
        console.log(getStaticAsset("/cat.png"));
      },
      "astro:server:setup": (params) => {
        //  Handle static assets in dev mode
        staticAssetMiddleware(params);
      },


      // { resourceId: "BIMVZw5i", fileName: "..../cat.png", pathname: "/_astro/cat.DEh1v8hz.png" }
      "astro:build:ssr": () => {
        console.log(getStaticAsset("/cat.png"));
      },
      "astro:build:generated": () => {
        console.log(getStaticAsset("/cat.png"));
      },
      "astro:build:done": () => {
        console.log(getStaticAsset("/cat.png"));
      },
    },
  },
}
```