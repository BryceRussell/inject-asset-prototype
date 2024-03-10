import { defineConfig } from "astro/config";
import { staticAssetController } from "./static-asset-controller";

const { getStaticAsset, staticAssetMiddleware, addStaticAssetDir } =
	staticAssetController();

export default defineConfig({
	integrations: [
		{
			name: "inject-assets",
			hooks: {
				"astro:config:setup": (params) => {
					addStaticAssetDir(params, { dir: "static" });

					console.log(
						"astro:config:setup",
						"Static asset: ",
						getStaticAsset("/styles.css"),
					);

					if (params.command !== "dev") return;

					setInterval(() => {
						const asset = getStaticAsset("/styles.css");
						if (asset) console.log("Static asset: ", asset);
					}, 5000);
				},

				"astro:server:setup": (params) => {
					staticAssetMiddleware(params);

					console.log(
						"astro:server:setup",
						"Static asset: ",
						getStaticAsset("/styles.css"),
					);
				},

				//  Build

				// getStaticAsset() returns 'undefined', Paths have not been generated
				"astro:build:start": () => {
					console.log(
						"astro:build:start",
						"Static asset: ",
						getStaticAsset("/styles.css"),
					);
				},
				"astro:build:setup": () => {
					console.log(
						"astro:build:setup",
						"Static asset: ",
						getStaticAsset("/styles.css"),
					);
				},

				// getStaticAsset() returns final asset path with hash
				"astro:build:ssr": () => {
					console.log(
						"astro:build:ssr",
						"Static asset: ",
						getStaticAsset("/styles.css"),
					);
				},
				"astro:build:generated": () => {
					console.log(
						"astro:build:generated",
						"Static asset: ",
						getStaticAsset("/styles.css"),
					);
				},
				"astro:build:done": () => {
					console.log(
						"astro:build:done",
						"Static asset: ",
						getStaticAsset("/styles.css"),
					);
				},
			},
		},
	],
});
