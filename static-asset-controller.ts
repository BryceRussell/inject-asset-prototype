import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { HookParameters } from "astro";
import { AstroError } from "astro/errors";
import fg from "fast-glob";
import type { Plugin } from "vite";

export function staticAssetController() {
	const assets = new Map<
		string,
		{ referenceId: string | null; filepath: string; pathname: string | null }
	>();

	const components = new Set();
	let chunks = 0;
	let chunkSize = 0;

	const pluginCount = 1;

	function initStaticAssets(
		{
			command,
			config,
			logger,
			updateConfig,
		}: HookParameters<"astro:config:setup">,
		{ dir, cwd }: { dir: string; cwd: string },
	) {
		const rootDir = fileURLToPath(config.root.toString());
		const base = stringToDir(stringToDir(rootDir, cwd), dir).replace(
			/\\+|\/+/g,
			"/",
		);
		const files = fg.sync("**/*", { cwd: base, absolute: true });
		const imports = files.map(
			(filepath) => `import ${JSON.stringify(filepath + "?injectAsset")};\n`,
		);
		const numOfImports = imports.length;

		for (const filepath of files) {
			const pathname = filepath.slice(base.length);
			assets.set(pathname, { referenceId: null, filepath, pathname });
		}

		const plugin: Plugin = {
			name: `vite-plugin-inject-static-assets-${pluginCount}`,
			enforce: "pre",
			resolveId(id) {
				if (command === "build" && id.endsWith(".astro")) {
					components.add(id);
					chunks = components.size;
					chunkSize = Math.round(numOfImports / chunks);
				}
			},
			transform(code, id) {
				if (command === "build" && chunks > 0 && id.endsWith(".astro")) {
					const index = (components.size - chunks) * chunkSize;
					const chunk = imports.slice(index, index + chunkSize).join("");
					console.log(numOfImports, chunkSize, index, chunks, "CHUNK: \n", chunk);
					chunks--;
					return { code: chunk + code };
				}
			},
			async load(id) {
				if (
					command === "build" &&
					id.endsWith("?injectAsset") &&
					id.startsWith(base)
				) {
					const filepath = id.slice(0, id.indexOf("?"));
					const pathname = filepath.slice(base.length);
					const referenceId = this.emitFile({
						name: basename(filepath),
						source: await readFile(filepath),
						type: "asset",
					});
					assets.set(pathname, {
						referenceId,
						filepath,
						pathname,
					});
				}
			},
			configureServer(server) {
				server.middlewares.use("/", (req, res, next) => {
					const path = req.url?.replace(/\?[^]*$/, "");
					if (path && extname(path) && !path.startsWith("/@")) {
						const asset = assets.get(path);
						if (asset) {
							try {
								createReadStream(asset.filepath).pipe(res);
							} catch {
								logger.warn(`Failed to serve static asset:\t${path}\t${asset}`);
								next();
							}
						} else next();
					} else next();
				});
			},
			generateBundle() {
				for (const [path, asset] of assets.entries()) {
					if (!asset.referenceId) continue;
					asset.pathname = `/${this.getFileName(asset.referenceId)}`;
					assets.set(path, asset);
				}
			},
		};

		updateConfig({ vite: { plugins: [plugin] } });
	}

	return {
		assets,
		initStaticAssets,
	};
}

function stringToDir(base: string, path?: string): string {
	path ||= "./";

	if (path.startsWith("file:/")) {
		path = fileURLToPath(path);
	}

	if (!isAbsolute(path)) {
		path = resolve(base, path);
	}

	if (extname(path)) {
		path = dirname(path);
	}

	if (!existsSync(path)) {
		throw new AstroError(`Directory does not exist!`, `"${path}"`);
	}

	return path;
}
