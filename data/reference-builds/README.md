# Reference builds

Static extraction of the three build datasets published by the reference site's engine:

- **GOAT builds** (`GBLE.GOATS`): 18 historical-player builds with ratings, ceilings, animations and unlocks.
- **GOATED builds** (`GBLE.GOATED`): 11 all-time player builds with base ratings, suggested cap breakers, cards, bios and photo credits.
- **Build presets** (`GBLE.META_BUILDS`): 15 user/community preset build codes with roles, minimums and attributes to avoid.

These are transcribed data, not a copy of the reference application. The local rebuild can consume the JSON without loading the reference bundle. No server, account, payment or network access is needed.

## Provenance

| Item | Value |
| --- | --- |
| Snapshot archive | `goated-reference-2026-11-01.zip` |
| Archive SHA-256 | `43da5d3c59fbb425ff74f61608303661de393b02be21e4ed19b53d98521099c3` |
| Engine path in archive | `public-bundle/engine.js` |
| Engine SHA-256 | `2171862d065f778eca9fb95e5772482d7ba0400310a29207f3cd38e7a197f74c` |
| Public engine URL | <https://www.goatedbuildlab.com/engine/engine.js?v=802b53b6fd> |
| Snapshot date | 2026-11-01 |
| Exported symbols | `window.GBLE.GOATS`, `window.GBLE.GOATED`, `window.GBLE.META_BUILDS` |
| Minified declarations | `Ne`, `ye`, `FY` |

`index.json` records the byte offsets, inclusive end offsets and SHA-256 digest of each extracted array literal, plus SHA-256 digests and byte sizes of the generated JSON files.

### Extraction method

The engine was treated as text; the application bundle was not executed.

1. Locate the exact top-level declarations `var Ne=[`, `var ye=[` and `var FY=[` in `public-bundle/engine.js`.
2. Scan forward from the opening `[` with a string-aware bracket counter (single quotes, double quotes, backticks and backslash escapes are handled) until the matching `]`.
3. Evaluate only that isolated array literal to turn it into a value.
4. Map the minified record fields to descriptive names, preserving source order and values. Attribute arrays were expanded with the engine's `ATTRS` order. `GOATED` cap-breaker indices were also counted per attribute.
5. Write JSON with two-space indentation and a trailing newline. There are no generated timestamps, so re-running the extraction over the same engine bytes produces the same files.

Only the three build arrays and a few small supporting constants (attribute names, attribute groups, position names/labels, unlock groups and the 26 cap-breaker maximum) were copied. Backend configuration, account state, secrets, endpoints and unrelated bundle contents were not extracted. `GOATED` photo attribution embedded in the source data was retained: `image.author`, `image.license` and `image.sourceUrl`.

## Files

| File | Records | Contents |
| --- | --- | --- |
| `index.json` | — | Provenance, extraction metadata, constants, counts, file digests |
| `goats.json` | 18 | `builds` |
| `goated.json` | 11 | `builds` |
| `meta-builds.json` | 15 | `presets` |

## Common conventions

- `attributeOrder` is the canonical 21-attribute order used by every numeric attribute array and every attribute-keyed object:

  `Close Shot`, `Driving Layup`, `Driving Dunk`, `Standing Dunk`, `Post Control`, `Mid-Range`, `Three-Point`, `Free Throw`, `Pass Accuracy`, `Ball Handle`, `Speed w/ Ball`, `Interior D`, `Perimeter D`, `Steal`, `Block`, `Off Rebound`, `Def Rebound`, `Speed`, `Agility`, `Strength`, `Vertical`.

- `positions` contains `{ index, abbreviation, label }`; `index` matches the source position field. Abbreviations are `PG`, `SG`, `SF`, `PF`, `C`.
- Heights and wingspans are integer inches. Weights are integer pounds.
- Every attribute value is an integer rating. Attribute objects always contain all 21 keys in `attributeOrder`.
- Cap-breaker entries are attribute indexes (0–20) in the same order as `attributeOrder`.

## `goats.json` fields

| Field | Source | Meaning |
| --- | --- | --- |
| `key` | `k` | Stable slug used in reference links |
| `name` | `n` | Player name |
| `positionIndex`, `position` | `p` | Position index and abbreviation |
| `heightInches` | `h` | Height |
| `weightLb` | `w` | Weight |
| `wingspanInches` | `ws` | Wingspan |
| `unlock.group` | `u` | Unlock group key (`now`, `pass`, `rep`, `chal`) |
| `unlock.groupLabel` | `GOGRP[u]` | Display label for the group |
| `unlock.label` | `ul` | Full availability text |
| `unlock.detail` | `us` | Short detail such as level or challenge count |
| `attributes` | `c` | GOAT build ratings before cap breakers |
| `normalCeilings` | `ce` | Normal body ceiling for a build at this height/weight/wingspan |
| `jumpshot.base`, `jumpshot.release`, `jumpshot.speed` | `j` | Locked jumpshot |
| `jersey.number` | `jn` | Jersey number as a string |
| `jersey.colors` | `jc` | Six renderer slots: primary, secondary, outline, number fill, number stroke, optional pattern |
| `animations` | `a` | `[{ group, items: [{ category, name }] }]` in source order |
| `dunks` | `d` | Dunk package names |
| `alleyOops` | `o` | Alley-oop package names |
| `badgeTierThresholds` | `tl` | `null`, or attribute-keyed ascending badge thresholds. Only Magic Johnson and Dirk Nowitzki carry custom tables; `null` means the engine's default tier table applies, which is not part of this export. |

## `goated.json` fields

| Field | Source | Meaning |
| --- | --- | --- |
| `key` | `k` | Stable slug used in reference links |
| `name` | `n` | Player name |
| `teamSeason` | `s` | Team and season label |
| `season` | `y` | Short season label |
| `positionIndex`, `position` | `p` | Position index and abbreviation |
| `heightInches`, `weightLb`, `wingspanInches` | `h`, `w`, `ws` | Body |
| `attributes` | `a` | Base GOATED build ratings before user cap breakers |
| `capBreakers.max` | `GDMAX` | Maximum breakers for a GOATED build (26) |
| `capBreakers.total` | derived from `o` | Number of suggested breakers |
| `capBreakers.order` | `o` | Suggested breaker order as attribute indexes |
| `capBreakers.byAttribute` | derived from `o` | Count of suggested breakers per attribute |
| `card.overall` | `co` | The player's 2K27 card overall |
| `card.attributes` | `c` | The player's 2K27 card ratings, used by the reference UI for build-minus-card deltas |
| `jersey.number`, `jersey.colors` | `jn`, `jc` | Jersey number and six color slots |
| `youtubeVideoId` | `yt` | Reference video id |
| `bio` | `bio` | Short player biography |
| `image` | `img` | `null` or `{ sourcePath, author, license, sourceUrl, edge? }`. Paths point at the reference site; image files are not included. |

The suggested breaker allocation is the engine's "Suggested cap breakers" data, not a user-saved allocation.

## `meta-builds.json` fields

| Field | Source | Meaning |
| --- | --- | --- |
| `id` | `id` | Stable preset id |
| `name` | `name` | Preset name |
| `positionIndex`, `position` | `pos` | Position index and abbreviation |
| `source` | `src` | `user` or `community` |
| `heightRangeInches.min`, `.max` | `hmin`, `hmax` | Allowed height range for the preset |
| `role` | `role` | Short description of the build's job |
| `why` | `why` | Notes on the trade-offs |
| `code` | `code` | Original build code, unchanged |
| `decodedCode` | parsed `code` | `positionIndex`, `position`, `heightInches`, `weightLb`, `wingspanInches`, `attributes`, and `capBreakers` |
| `floors` | `floors` | Attribute-keyed minimums |
| `avoid` | `avoid` | Attribute-keyed values the preset deliberately keeps low |

Build codes use query-style fields: `p` position, `h` height in inches, `w` weight, `s` wingspan in inches, `v` 21 dot-separated attributes in `attributeOrder`, and optional `o` dot-separated cap-breaker attribute indexes. `decodedCode.capBreakers` contains the same `total`/`order`/`byAttribute` shape as GOATED, without a maximum.

## Validation

Run:

```sh
node --test tests/reference-builds.test.mjs
```

The tests check:

- exact record counts (18 GOATS, 11 GOATED, 15 presets) and stable source order;
- unique GOAT keys, GOATED keys and preset ids;
- 21 attributes in the canonical order on every record;
- valid positions and unlock groups;
- GOATED breaker counts equal the order length and stay within the 26-breaker maximum;
- preset build codes re-decode to the stored `decodedCode` values;
- `floors` and `avoid` contain only known attributes;
- source provenance, literal digests and generated-file SHA-256 values;
- canonical formatting (two-space JSON, trailing newline, no CRLF).

## Limitations

- This is a static 2026-11-01 snapshot. Unlock availability, seasons and card ratings can change.
- Descriptive field names were inferred from the minified engine and its UI usage; the source names are listed above for traceability.
- No overall ratings are computed here. The only overall included is the source `card.overall` for GOATED players.
- The engine's fallback badge-tier tables and other lookup tables are not included.
- GOAT `tl` is present only where the source overrides the default tier table.
- Preset codes are copied verbatim. `x-curiosojorge704` carries six cap-breaker entries for Strength even though the GOATED dataset never exceeds five per attribute; no normalization or clamping was applied.
- Images, videos and the reference site itself are not bundled. Photo credits and source URLs are retained.
- The data has not been revalidated against a running copy of NBA 2K27 or the reference server.
- Only publicly delivered client data was used. No gated, account, backend or payment data is represented.

## Attribution

Build data is transcribed from the publicly delivered Goated Build Lab engine bundle. Free Builder is an unofficial fan project and is not affiliated with Goated Build Lab, NBA 2K, Visual Concepts, 2K Sports, Take-Two Interactive or the NBA. Player names, team names and related marks belong to their respective owners. Photo credits and licenses are recorded per GOATED build in `image`.
