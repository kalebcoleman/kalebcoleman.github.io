# Free Builder

Free Builder is a free, browser-based NBA 2K build planning project. Its tools run without sign-in or a subscription. Builds saved to the library stay in the browser on the device where they were created; use **Export library** and **Import build library** to back them up or move them to another device.

The site is a static distribution. To run it locally from the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. A local web server is needed for browser features such as modules and workers. No build step is required for the current distribution. The test suite covers finder constraints, recovered reference builds, animation classifications, takeovers, and the motion style table:

```sh
node --test tests/*.mjs
```

GitHub Actions runs the same suite on pushes and pull requests. The cap-breaker finder can prefill a frame and target in the build finder; result cards show base and post-breaker values. Opening a result in the builder imports its base allocation, so breaker allocations still need to be applied separately.

The current app includes a build editor, a dedicated reference-finder page, recovered GOAT/GOATED/preset builds, the reference cap-breaker finder table, badge and takeover catalogs, an animation catalog, archetype and player comparisons, the game-arithmetic Jumpshot Lab trainer plus a browser-local practice lab, a Mechanics Lab with a searchable 368-style motion catalog, and browser-local build storage. Some features are still being rebuilt; see [the feature research](docs/goated-build-lab-research.md) for the comparison with the earlier site, and [the free-feature parity check](docs/parity-check-2026-11-01.md) for the signed-out browser comparison and remaining visual gaps.

The repository currently contains compiled/minified JavaScript and a WebAssembly engine. The original unminified source for every shipped component has not yet been recovered. [REA setup](REA-SETUP.md) documents the project-local reverse-engineering configuration.

The project's own code is licensed under the [MIT License](LICENSE). Bundled third-party materials have separate terms; see [third-party notices](THIRD_PARTY_NOTICES.md). Free Builder is an unofficial fan project and is not affiliated with NBA 2K, Visual Concepts, 2K Sports, Take-Two Interactive, or the NBA.
