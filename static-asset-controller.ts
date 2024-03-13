import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import type { HookParameters } from "astro";
import { type Plugin, normalizePath } from "vite";
import { addRollupInput } from "./internal";

export interface InjectAsset {
	entrypoint: string;
}

export interface InjectedAsset extends InjectAsset {
	id: string | null;
	pathname: string;
}

const assets = new Map<string, InjectedAsset>();

export function injectAsset(
	{ config }: HookParameters<"astro:config:setup">,
	asset: InjectAsset,
) {
	const rootDir = normalizePath(fileURLToPath(config.root.toString()));
	const entrypoint = normalizePath(asset.entrypoint);
	const pathname = entrypoint.slice(rootDir.length - 1);

	if (!entrypoint.startsWith(rootDir))
		throw Error("Asset must be inside root directory!");

	assets.set(entrypoint, {
		id: null,
		entrypoint,
		pathname,
	});

	return (): InjectedAsset | null => assets.get(entrypoint) || null;
}

export function initStaticAssets(params: HookParameters<"astro:config:setup">) {
	const { command, config, updateConfig } = params;

	if (command !== "build" || !assets) return;

	const rootDir = normalizePath(fileURLToPath(config.root.toString()));
	const imports = Array.from(assets.keys()).map(
		(entrypoint) => entrypoint + "?static",
	);

	const plugin: Plugin = {
		name: `vite-plugin-inject-static-assets`,
		enforce: "pre",
		options(opts) {
			return addRollupInput(opts, imports);
		},
		async load(moduleId) {
			console.log(moduleId);
			if (moduleId.endsWith("?static") && moduleId.startsWith(rootDir)) {
				const entrypoint = moduleId.slice(0, moduleId.indexOf("?"));
				const asset = assets.get(entrypoint);
				if (asset) {
					asset.id = this.emitFile({
						name: basename(entrypoint),
						source: await readFile(entrypoint),
						type: "asset",
					});
					assets.set(entrypoint, asset);
				}
			}
		},
		generateBundle() {
			for (const [entrypoint, asset] of assets.entries()) {
				if (!asset.id) continue;
				asset.pathname = `/${this.getFileName(asset.id)}`;
				assets.set(entrypoint, asset);
			}
		},
	};

	updateConfig({ vite: { plugins: [plugin] } });
}
