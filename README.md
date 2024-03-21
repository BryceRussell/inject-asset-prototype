# Prototypes for injecting static assets into Astro bundle

**Basic Idea**

```ts
"astro:config:setup": (params) => {
  // Should inject an asset into the build and return the path that it is available at client side
  asset = injectAsset({
    entrypoint: "C:/.../styles.css",
  });
},
```

### Why?

- Inject static assets from anywhere
- Include assets inside the Astro bundle
- Access the bundled/hashed path of an asset inside an integration

### Strategies

Explore different strategies in the list below. Each strategy is a branch that includes explainations, limitations, examples, playground, etc

- [Static Analysis](https://github.com/BryceRussell/inject-asset-prototype/tree/static-analysis)
- [Getter Function](https://github.com/BryceRussell/inject-asset-prototype/tree/getter-function)