# Study Case Template

Offline desktop app for data acquisition sessions at BCH FNNDSC.  
Built with Electron — no internet connection required.

---
### Dependencies

This downloads Electron and all other packages listed in `package.json`.  

```bash
npm install
```
---

## Building a Distributable App

Output files will appear in the `dist/` folder.

**macOS**
```bash
npm run build:mac # macOS — produces arm64 + x64 DMG installers
```

**Windows**
```bash
npm run build:win # Windows — produces an NSIS installer (.exe)
```

**Linux**
```bash
npm run build:linux # Linux — produces an AppImage
```

> **macOS note:** Unsigned builds are blocked by Gatekeeper.  
> To open the app anyway: right-click → Open on first launch, or run:
> ```bash
> xattr -cr "/Applications/BCH Template.app"
> ```

---

### Exporting data

| Shortcut | Action |
|---|---|
| `Ctrl+S` / `Cmd+S` | Export current form (TXT, JSON, and PDF) |

---

## Templates

Each template covers a different study with its own set of cohorts and form sections.

| Key | Full Name | Cohorts |
|---|---|---|
| `pda` | Patent Ductus Arteriosus | PDA NIRS, PDA Notes |
| `pbi` | Pediatric Brain Injury | PBI TH, PBI non-TH, PBI control |
| `scd` | Sickle Cell Disease | SCD Infant Cohort, Transfusion, Gene Therapy, Control |
| `icp` | Intracranial Pressure | ICP |
| `hydrocephalus` | Hydrocephalus | IVH, PHH, VC |

---

## Adding a New Template

1. Create `scripts/config/mytemplate.js` and define your config object:
   ```js
   const MY_CONFIG = { label, fullLabel, style, cohortOptions, specificSections, ... }
   ```
2. Register it in `scripts/config/index.js`:
   ```js
   mykey: MY_CONFIG
   ```
3. Load the script in `index.html` — add this line before the `index.js` script tag:
   ```html
   <script src="./scripts/config/mytemplate.js"></script>
   ```

---

## Project Structure

Reference for where things live in the codebase.

```
scripts/
  config/             Template definitions (one file per template)
    shared.js         Shared sections: Session Record, Device Config, Calibration
    pda.js            Patent Ductus Arteriosus
    pbi.js            Pediatric Brain Injury
    scd.js            Sickle Cell Disease
    icp.js            Intracranial Pressure
    hydrocephalus.js  Hydrocephalus
    index.js          Assembles all templates into the TEMPLATES object
  lib/                Third-party libraries bundled for offline use
    tailwind.js
    flatpickr.min.js
  state.js            Runtime state + reset functions
  utils.js            Shared constants and helpers
  render.js           Form rendering, template selector, SECTION_BUILDERS dispatch
  section_types.js    Reusable section builders (checklist, stages_table, fastrack)
  calibration.js      Calibration section logic
  notes.js            Notes table section logic
  icp.js              ICP measurement section logic
  export.js           TXT, JSON export (PDF export is on the notes.js)
  app.js              Top-level handlers (setTemplate, validate, reset, autosave)
styles/
  lib/                Third-party styles
  fonts/              IBM Plex fonts (bundled for offline use)
  fonts.css
  app.css
images/               Header logos (FNNDSC, BCH, Harvard)
build/                App icons for electron-builder (icon.icns / .ico / .png)
main.js               Electron main process — window creation + native save dialog
preload.js            Electron IPC bridge (exposes window.electronAPI.saveFile to renderer)
```
