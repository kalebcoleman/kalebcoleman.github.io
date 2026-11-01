# Premium gates in the reference bundle

Research note, 2026-11-01. This records what is client-side in the public Goated Build Lab bundle and what stays on its servers.

## What the gate actually checks

The reference maps each gated surface to a tier in a small client table:

| Surface | Required tier |
| --- | --- |
| Badge/token planner, Optimize, Max badge tokens, Tokens tab | Mid |
| Min-max, Find a better frame, Build an archetype name, Build toward an NBA player, Build for a set of badges, Cap-breaker row-to-build, full animation list, Build toward an animation, Numbers worth hitting | Premium |
| Posted jumpshot grades/heights and the full recommended list | Mid |

The check is `tier >= required`, where `tier` comes from the signed-in profile: `tier`, `granted_tier`, `play_tier`, or `apple_tier` with expiry. Those fields arrive from the Supabase profile / billing API. The public bundle contains the client-side solvers, the badge/VC tables and the UI copy, but it does not contain a paid profile, an entitlement token, or the community/league database.

## What running a local clone can and cannot do

Serving the public bundle locally can execute the client-side algorithms, and a developer can change a local flag in devtools or a local copy. That only changes a UI check in that copy. It does not create a paid account, grant server-side entitlements, decrypt server-only data, or make the hosted community/league APIs accept requests. It would also be circumventing the reference's paid gates, which this project does not do.

What this rebuild does instead is reimplement the client-side surfaces from recovered evidence as free, local tools:

- the builder's Min-max, frame, name, shade, badge, animation and threshold tools;
- the cap-breaker row-to-build link;
- the badge/token and Optimize planners already present in the builder;
- the Upgrade Planner's VC ladder, overall cap, badge needs and badge-first plan;
- the full animation and badge catalogs.

The remaining server-dependent surfaces are accounts, cloud saves, posted community builds, league uploads/standings and hosted jump-shot community data. They need a backend and moderation surface; this static GitHub Pages rebuild keeps those features local-only.
