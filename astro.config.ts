import { defineConfig } from "astro/config";
import { injectStaticAssets } from "./static-asset-controller";

let assets: ReturnType<typeof injectStaticAssets>;

export default defineConfig({
	integrations: [
		{
			name: "inject-assets",
			hooks: {
				"astro:config:setup": (params) => {
					assets = injectStaticAssets(params, {
						dir: "static",
						cwd: import.meta.url,
					});

					// { resourceId: null, fileName: ".../styles.css", pathname: "/styles.css" }
					console.log(
						"astro:config:setup",
						Array.from(assets.values()).map((a) => a.pathname),
					);
				},

				// { resourceId: "BIMVZw5i", fileName: ".../styles.css", pathname: "/_astro/styles.DEh1v8hz.css" }
				"astro:build:ssr": () => {
					// console.log("astro:build:ssr", assets);
				},
				"astro:build:generated": () => {
					// console.log("astro:build:generated", assets);
				},
				"astro:build:done": () => {
					console.log(
						"astro:build:done",
						Array.from(assets.values()).map((a) => a.pathname),
					);
				},
			},
		},
	],
});
