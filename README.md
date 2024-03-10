# Prototype for injecting static assets into Astro bundle

Main code is in [`static-asset-controller.ts`](static-asset-controller.ts) and [`astro.config.ts`](astro.config.ts), run the `dev` and `build` script and watch the console

### Why?

- Inject static assets from any folder
- Access the bundled/hashed path of an asset inside an integration


### Limitations

- Can only access bundled/hashed paths (`/_astro/styles.DEh1v8hz.css`) inside build hooks:
  - `astro:build:ssr`
  - `astro:build:generated`
  - `astro:build:done`