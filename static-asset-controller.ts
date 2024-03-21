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

const assetReferences = new Map<string, string | null>();

export function injectAsset(
	{ command, config }: HookParameters<"astro:config:setup">,
	asset: InjectAsset,
) {
	const rootDir = normalizePath(fileURLToPath(config.root.toString()));
	const entrypoint = normalizePath(asset.entrypoint);
	const pathname = command === "build"
		? `__ASTRO_STATIC_ASSET__${entrypoint}?__`
		: entrypoint.slice(rootDir.length - 1)

	if (!entrypoint.startsWith(rootDir))
		throw Error("Asset must be inside root directory!");

	assetReferences.set(entrypoint, null)

	return pathname;
}

export function initStaticAssets(params: HookParameters<"astro:config:setup">) {
	const { command, config, updateConfig } = params;

	if (command !== "build") return;

	const rootDir = normalizePath(fileURLToPath(config.root.toString()));
	const imports = Array.from(assetReferences.keys()).map(
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
				assetReferences.set(entrypoint, this.emitFile({
					name: basename(entrypoint),
					source: await readFile(entrypoint),
					type: "asset",
				}));
			}
		},
		renderChunk(code) {
			const matcher = /__ASTRO_STATIC_ASSET__([^?]+)\?__/g

			code = code.replace(matcher, (match, entrypoint) => {
				const id = assetReferences.get(entrypoint)!
				if (id) return `/${this.getFileName(id)}`
				return match
			})
			
			return { code }
		},
	};

	updateConfig({ vite: { plugins: [plugin] } });
}
