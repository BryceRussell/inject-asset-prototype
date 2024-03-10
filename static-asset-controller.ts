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
		{ referenceId: string | null; filePath: string; pathname: string | null }
	>();

	function addStaticAssetDir(
		{
			command,
			config,
			injectScript,
			updateConfig,
		}: HookParameters<"astro:config:setup">,
		{ dir }: { dir: string },
	) {
		const rootDir = fileURLToPath(config.root.toString());
		const cwd = stringToDir(rootDir, dir).replace(/\\+/g, "/");
		const files = fg.sync("**/*", { cwd, absolute: true });

		for (const filePath of files) {
			const pathname = filePath.slice(cwd.length);
			assets.set(pathname, { referenceId: null, filePath, pathname });
		}

		const plugin: Plugin = {
			name: "vite-plugin-find-injected-assets",
			enforce: "pre",
			async load(id) {
				if (id.startsWith(cwd) && command === "build") {
					const filePath = id.slice(0, id.indexOf("?"));
					const pathname = filePath.slice(cwd.length);
					const referenceId = this.emitFile({
						name: basename(filePath),
						source: await readFile(filePath),
						type: "asset",
					});
					assets.set(pathname, {
						referenceId,
						filePath,
						pathname,
					});
				}
			},
			generateBundle() {
				for (const [path, asset] of assets.entries()) {
					asset.pathname = `/${this.getFileName(asset.referenceId!)}`;
					assets.set(path, asset);
				}
			},
		};

		updateConfig({
			vite: { plugins: [plugin], build: { assetsInlineLimit: 0 } },
		});

		injectScript(
			"page-ssr",
			files
				.map((filepath) => `import ${JSON.stringify(filepath + "?url")};`)
				.join(""),
		);
	}

	function staticAssetMiddleware({
		logger,
		server,
	}: HookParameters<"astro:server:setup">) {
		server.middlewares.use("/", (req, res, next) => {
			const path = req.url?.replace(/\?[^]*$/, "");
			if (path && extname(path) && !path.startsWith("/@")) {
				const asset = assets.get(path);
				if (asset) {
					try {
						createReadStream(asset.filePath).pipe(res);
					} catch {
						logger.warn(`Failed to serve static asset:\t${path}\t${asset}`);
						next();
					}
				} else next();
			} else next();
		});
	}

	function getStaticAsset(path: string) {
		return assets.get(path);
	}

	return {
		getStaticAsset,
		staticAssetMiddleware,
		addStaticAssetDir,
	};
}

function stringToDir(base: string, path: string): string {
	if (!path) {
		throw new AstroError(`Invalid path!`, `"${path}"`);
	}

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
		throw new AstroError(`Path does not exist!`, `"${path}"`);
	}

	return path;
}
