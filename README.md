# Prototype for injecting static assets into Astro bundle

Main code is in [`static-asset-controller.ts`](static-asset-controller.ts) and [`astro.config.ts`](astro.config.ts). To test, run the `dev` or `build` commands and watch the console

### Why?

- Inject static assets from anywhere
- Include assets inside the Astro bundle
- Access the bundled/hashed path of an asset inside an integration

### How?

Works similar to a `?url` import

- **Dev**: Returns an absolute path relative to the root of your project
- **Build**: Uses a Vite plugin to:
    - Inject imports into build (`.../cat.png?static`)
    - Intercept the injected imports and use [`emitFile`](https://rollupjs.org/plugin-development/#this-emitfile) to add the asset to the bundle
    - Use static analysis to find injected asset paths and replace them

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

					// dev:		'/static/cat.png'
					// build: '__ASTRO_STATIC_ASSET__C:/.../static/cat.png?__'
					console.log("astro:config:setup", image);

					initStaticAssets(params);
				},
			},
		},
	],
});
```
