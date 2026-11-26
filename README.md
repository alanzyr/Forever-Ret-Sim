# Forever Ret-sim

A DPS simulator for Retribution Paladin in WoW Forever (level 60, phase 1). Unofficial hobby project.
The whole simulator is one HTML file that runs in the browser. There is no server and no dependencies.

## Files

| File | What it is |
|---|---|
| `ret-sim.html` | The working version. Interface, simulation engine, item and enchant data and icons, all in one file. This is the file to edit. |
| `public_presets.json` | Gear sets shown as fixed "Preset Gear Sets" buttons in the public version. |
| `build.js` | Builds the public site: `node build.js docs` writes `docs/index.html`. |
| `favicon.jpg` | The tab icon (Seal of Command). The build copies it next to the page and links it. |
| `docs/index.html` | The built public site. GitHub Pages serves this folder. Rebuild and commit it with every change. |
| `vercel.json` | Only used if the site is hosted on Vercel: runs the build and serves the `public` folder. |

`public/` (the Vercel build output) is not committed. `docs/` is.

## Build and run

```
node build.js docs
```

Open `docs/index.html` in a browser. Needs Node 18 or later, nothing to install.

The public version differs from `ret-sim.html` in two ways, both applied by `build.js`:

- The developer features are removed: the "Copy setup (for troubleshooting)" button and the Assumptions tab.
- The presets from `public_presets.json` are added.

Do not edit `docs/index.html` by hand. Change `ret-sim.html` or `public_presets.json`, run `node build.js docs` and commit both.

## Hosting

The site is served by GitHub Pages from the `docs` folder of the main branch (repository Settings > Pages > Deploy from a
branch > main, /docs). A push that changes `docs/index.html` updates the site within a minute or two.

Vercel works as an alternative: import the repository and it uses `vercel.json`.

## How `ret-sim.html` is organised

- **Styles** come first, in one `<style>` block. The theme is dark only.
- **Markup**: a sidebar (Simulate, results, stats) and tabs: Gear, Settings, Talents, Rotation, Detailed Results, Assumptions.
- **Script**, in this order:
  - `FIELDS`: every setting, with its group (`char`, `wpn`, `rot`, `buff`, `cons`, `tgt`, `as`, `side`), label and default.
    Form elements get the id `f6-<key>`.
  - The engine, between `/* ===== ENGINE START ===== */` and `/* ===== ENGINE END ===== */`: `derive()` turns settings into
    combat values, `simulate()` runs one fight as an event loop with a seeded random generator.
  - `readRaw()` reads the form exactly as shown. `readValues()` adds talents, gear, enchants and consumables on top.
  - `ITEMS`, `ITEM_ICONS`, `SETS`, `ENCHANTS`, `ICONS` (talents) and `UI_ICON` (consumables, buffs, abilities): data, as JSON.
    Icons are embedded as data URIs.
  - Gear picker, gear sets, talents, import/export, timeline, encounters.

## Rules this project follows

- **Save only raw form values.** `save()` must store `readRaw()`, never `readValues()`. Saving values that already have
  gear applied makes stats pile up on every reload.
- **Base stats follow the race.** Strength, Intellect, crit, spell crit and mana come from `RACE_BASE` and are not editable.
- **Items must be confirmed in game** for the current phase, according to the tracker foreverchanges.pro. Exceptions are
  added only on request and are labelled in the item's source line.
- **More than one source.** Item and spell values are checked against the tracker and Wowhead's Forever tooltips, not only wowsims.
- **Calibration.** With every buff and debuff at its default, results are fitted to the wowsims Forever sim (two setups,
  within about 3%). A change to the engine should leave the default result unchanged unless that is the intent. The armor
  debuffs share one calibrated total (`armorDebuff`, 2693) in proportion to their tooltip values.
- **Procs are played in the fight, not averaged.** `PROCS` (in the engine block) holds every effect of an item, weapon
  enchant (`e` + enchant id) or set bonus (`s` + set id + `:` + pieces) that the fight plays: "Chance on hit" weapons,
  trinkets and other slots, Crusader and the "Grand" enchants, set procs. Each entry says its rate and where the rate
  comes from (measured on Forever, fitted from Forever logs, Classic value, game data); the rates and which hits roll
  come from the measurements collected in the wowsims Forever project (`weapon_procs.go`, `docs/evidence`), read
  24 Nov 2026. An effect without a known rate uses "Procs without a known rate" under Assumptions. Effects that do no
  damage carry `no` with the reason and are shown as not simulated. On-use effects (keys `u` + item id) and the combat potion are used at the pull and again whenever they are
  ready, with the shared on-use cooldown between trinkets. Not played: summons, bonuses against a
  creature type, "when struck" effects. `procList()` turns the worn effects into what `simulate()` plays; the addon has
  the same table and the same code (`tools/check-ret-engine.js` in the addon repository compares them fight by fight).
- **Layout follows wowsims.com/forever**: settings in columns, icon pickers for consumables, round buttons for saved sets,
  encounters and rotations. Interface text is English and short.
- **Middle click opens Wowhead.** Every element that shows an item carries `data-item` (`<id>|<slot type>`). A middle
  click on one opens `https://www.wowhead.com/forever/item=<id>` in a new tab (`itemMiddle`, one listener on the document).
- **Random seed per run.** Each press of Simulate, Stat Weights or Compare Rotations draws a new seed; comparisons within
  one run share it.
- **Gear sets** store item ids, enchant names and the rotation selected when saved (`_ench`, `_mode`).
- **Import/Export** uses the wowsims JSON layout plus a `retSim` block for this sim's own settings. Share codes are the
  same JSON, deflated and base64url-encoded with the prefix `RS1:`.
- **Import > Addon** reads the export code of the in-game addon ([PaladinSIMAddon](https://github.com/alanzyr/PaladinSIMAddon),
  `/rsim export`): `RSA1:` + base64 of JSON with items by the game's inventory slot number (`id`, `enchant`), the talent
  string, race and rotation. Enchants are matched by their id (`e` in `ENCHANTS`).
- **Export > Wowhead** writes the same kind of link from what is equipped (`ieWowheadCode`, `ieWowheadLink`). Checked by
  taking a real link apart and putting it together again: the text comes out the same. Three fields of the format are
  not understood and are written as that link had them. Enchants whose Wowhead spell id is not known are named in the
  dialog, because Wowhead may not show them.
- **Export > Addon gear list** makes a code of what is equipped for the addon's gear list: `RSG1:` + base64 of JSON
  `{ v: 1, name, items: [{ s: inventory slot, id, n, q, src, e: enchant name, ei: enchant id }] }` (`ieGearListCode`). The
  addon shows each piece, where it comes from (the item's `src`) and whether you wear or carry it.
- **Import > Wowhead** reads a gear planner link (`https://www.wowhead.com/forever/gear-planner/paladin/<race>/<code>` or the
  `[gear-planner=...]` tag): gear, enchants, race and talents. The code is version 5 of Wowhead's format, a stream of
  6-bit values read as variable-length integers (`ieWowhead`); the layout was worked out from the readers in the wowsims
  projects and checked on a real link. Enchants are in the link as the spell that puts them on: `WH_ENCH` maps the ones
  whose spell differs from the one in `ENCHANTS`.
- **Settings codes** go both ways between the website and the addon: `RSS1:` + base64 of JSON `{ v: 1, settings: {...} }`
  with the fields of the groups `buff`, `cons`, `tgt` and `rot` under their own keys. Export > Addon settings writes
  one; Import reads one. Gear, talents and the Player fields are never in it. A new field in one of those groups is
  picked up by the addon when its data is generated again (`node gen-ret-data.js` in the addon's `tools`).

## Not in this repository

The scripts and caches that fetched item data from the tracker and Wowhead are kept outside the repository. `ret-sim.html`
already contains all the data it needs.

## Testing a change

There is no test suite. After a change:

1. Check that the script still parses: extract the `<script>` blocks and run `node --check` on them.
2. Open the page, press Simulate with default settings and compare the DPS with the value before the change.
3. Check the page at phone width as well; it must not scroll sideways.
