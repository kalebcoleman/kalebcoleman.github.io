# Free Builder

Free Builder is a free, browser-based NBA 2K build planning project. Its tools run without sign-in or a subscription. Builds saved to the library stay in the browser on the device where they were created; use **Export library** and **Import build library** to back them up or move them to another device.

The site is a static distribution. To run it locally from the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. A local web server is needed for browser features such as modules and workers. No build step is required for the current distribution. The test suite covers finder constraints, recovered reference builds, animation classifications, takeovers, the motion style table, and the upgrade planner:

```sh
node --test tests/*.mjs
```

GitHub Actions runs the same suite on pushes and pull requests. The cap-breaker finder can prefill a frame and target in the build finder; result cards show base and post-breaker values. Build this row rebuilds a legal row at the requested landing through the builder's fitted path and stores the breaker level. Opening a finder result in the builder still imports its base allocation, so breaker allocations need the row action.

The builder enforces legal frame limits, linked attributes, and the 99 overall wall using the reference engine. Some special reference cards cannot be made exactly in the normal builder; **Fit to builder** adjusts them to a legal frame and allocation and shows a notice. Invalid imported builds are rejected instead of silently saved.

The current app includes a build editor, a dedicated reference-finder page with sorting and multi-build comparison, recovered GOAT/GOATED/preset builds, the recovered highest-overalls board, the reference cap-breaker finder table, badge and takeover catalogs, an animation catalog, archetype and player comparisons, a 3D Jumpshot Lab with its game-arithmetic timing plus a browser-local Practice Lab, a photo-to-head Facescan Lab, screenshot import for 2K HQ/Attribute Editor images, tier-coded badge icons and a full Fuse planner (Best fit / My picks, slots, +2 slots, reactions, tier pins, flex and group caps), an Upgrade Planner that estimates what VC buys and orders badge upgrades, a Mechanics Lab with a searchable 368-style motion catalog, and browser-local build storage, with optional free Supabase accounts/cloud saves when configured. Some features are still being rebuilt; see [the feature research](docs/goated-build-lab-research.md) for the comparison with the earlier site, [the free-feature parity check](docs/parity-check-2026-11-01.md) for the signed-out browser comparison, and [the premium-gate research](docs/premium-gates.md) for what is client-side versus server-side.

The repository currently contains compiled/minified JavaScript and a WebAssembly engine. The original unminified source for every shipped component has not yet been recovered. [REA setup](REA-SETUP.md) documents the project-local reverse-engineering configuration.

The project's own code is licensed under the [MIT License](LICENSE). Bundled third-party materials have separate terms; see [third-party notices](THIRD_PARTY_NOTICES.md). Free Builder is an unofficial fan project and is not affiliated with NBA 2K, Visual Concepts, 2K Sports, Take-Two Interactive, or the NBA.
