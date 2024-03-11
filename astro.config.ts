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

					// { resourceId: null, fileName: ".../styles.css", pathname: "/styles.css" }
					console.log("astro:config:setup", assets);
				},

				// { resourceId: "BIMVZw5i", fileName: ".../styles.css", pathname: "/_astro/styles.DEh1v8hz.css" }
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
