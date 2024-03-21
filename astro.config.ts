import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { initStaticAssets, injectAsset } from "./static-asset-controller";

function resolveAsset(path: string) {
	return resolve(fileURLToPath(import.meta.url), "../static", path);
}

export default defineConfig({
	integrations: [
		{
			name: "inject-assets",
			hooks: {
				"astro:config:setup": (params) => {
					globalThis._static_styles = injectAsset(params, {
						entrypoint: resolveAsset("styles.css"),
					});

					globalThis._static_image = injectAsset(params, {
						entrypoint: resolveAsset("cat.png"),
					});

					// dev:		'/static/cat.png'
					// build: '__ASTRO_STATIC_ASSET__C:/.../static/cat.png?__'
					console.log("astro:config:setup", globalThis._static_image);

					initStaticAssets(params);
				},
			},
		},
	],
});