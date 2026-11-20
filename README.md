# Forever Ret-sim

A DPS simulator for Retribution Paladin in WoW Forever (level 60, phase 1). Unofficial hobby project.
The whole simulator is one HTML file that runs in the browser. There is no server and no dependencies.

## Files

| File | What it is |
|---|---|
| `ret-sim.html` | The working version. Interface, simulation engine, item and enchant data and icons, all in one file. This is the file to edit. |
| `public_presets.json` | Gear sets shown as fixed "Preset Gear Sets" buttons in the public version. |
| `build.js` | Builds the public site: `node build.js docs` writes `docs/index.html`. |
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
- **Layout follows wowsims.com/forever**: settings in columns, icon pickers for consumables, round buttons for saved sets,
  encounters and rotations. Interface text is English and short.
- **Random seed per run.** Each press of Simulate, Stat Weights or Compare Rotations draws a new seed; comparisons within
  one run share it.
- **Gear sets** store item ids, enchant names and the rotation selected when saved (`_ench`, `_mode`).
- **Import/Export** uses the wowsims JSON layout plus a `retSim` block for this sim's own settings. Share codes are the
  same JSON, deflated and base64url-encoded with the prefix `RS1:`.
- **Import > Addon** reads the export code of the in-game addon ([PaladinSIMAddon](https://github.com/alanzyr/PaladinSIMAddon),
  `/rsim export`): `RSA1:` + base64 of JSON with items by the game's inventory slot number (`id`, `enchant`), the talent
  string, race and rotation. Enchants are matched by their id (`e` in `ENCHANTS`).

## Not in this repository

The scripts and caches that fetched item data from the tracker and Wowhead are kept outside the repository. `ret-sim.html`
already contains all the data it needs.

## Testing a change

There is no test suite. After a change:

1. Check that the script still parses: extract the `<script>` blocks and run `node --check` on them.
2. Open the page, press Simulate with default settings and compare the DPS with the value before the change.
3. Check the page at phone width as well; it must not scroll sideways.
