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

					injectAsset(params, {
						entrypoint: resolveAsset("red.png"),
					});

					injectAsset(params, {
						entrypoint: resolveAsset("blue.png"),
					});

					injectAsset(params, {
						entrypoint: resolveAsset("green.png"),
					});

					// {
					// 	id: null,
					// 	entrypoint: 'C:/Users/Bryce/Desktop/Projects/Tests/inject-asset/static/cat.png',
					// 	pathname: '/static/cat.png'
					// }
					console.log("astro:config:setup", asset());

					initStaticAssets(params);
				},

				// {
				// 	entrypoint: 'C:/Users/Bryce/Desktop/Projects/Tests/inject-asset/static/cat.png',
				// 	id: 'DeV46TUP',
				// 	pathname: '/_astro/cat.BXRYhKOC.png'
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
