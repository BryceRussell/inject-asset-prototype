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
	pathname: string;
	id: string;
}

export function injectAsset(
	{ config }: HookParameters<"astro:config:setup">,
	asset: InjectAsset,
) {
	const rootDir = normalizePath(fileURLToPath(config.root.toString()));
	const entrypoint = normalizePath(asset.entrypoint);
	if (!entrypoint.startsWith(rootDir))
		throw Error("Asset must be inside root directory!");
	const pathname = entrypoint.slice(rootDir.length - 1);
	globalThis.astroStaticAssets ??= new Map<string, InjectedAsset>();
	globalThis.astroStaticAssets.set(entrypoint, {
		id: null,
		entrypoint,
		pathname,
	});
	return (): InjectedAsset => globalThis.astroStaticAssets.get(entrypoint);
}

export function initStaticAssets(params: HookParameters<"astro:config:setup">) {
	const { command, config, updateConfig } = params;

	if (command !== "build" || !globalThis.astroStaticAssets) return;

	const rootDir = normalizePath(fileURLToPath(config.root.toString()));

	const imports = Array.from(globalThis.astroStaticAssets.keys()).map(
		(entrypoint) => entrypoint + "?static",
	);

	const plugin: Plugin = {
		name: `vite-plugin-inject-static-assets`,
		enforce: "pre",
		options(opts) {
			return addRollupInput(opts, imports);
		},
		async load(moduleId) {
			if (moduleId.endsWith("?static") && moduleId.startsWith(rootDir)) {
				const entrypoint = moduleId.slice(0, moduleId.indexOf("?"));
				const asset = globalThis.astroStaticAssets.get(entrypoint);
				asset.id = this.emitFile({
					name: basename(entrypoint),
					source: await readFile(entrypoint),
					type: "asset",
				});
				globalThis.astroStaticAssets.set(entrypoint, asset);
			}
		},
		generateBundle() {
			for (const [
				entrypoint,
				asset,
			] of globalThis.astroStaticAssets.entries()) {
				if (!asset.id) continue;
				asset.pathname = `/${this.getFileName(asset.id)}`;
				globalThis.astroStaticAssets.set(entrypoint, asset);
			}
		},
	};

	updateConfig({ vite: { plugins: [plugin] } });
}
