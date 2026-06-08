<div align="center">

# Kalimotxo

**Windows gaming on Apple Silicon**

Install and play Battle.net games on your Apple Silicon Mac — no technical knowledge required.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/macOS-Apple%20Silicon-black?logo=apple)](https://github.com/segux/kalimotxo/releases)
[![Release](https://img.shields.io/github/v/release/segux/kalimotxo?label=latest)](https://github.com/segux/kalimotxo/releases/latest)

[**Download**](https://github.com/segux/kalimotxo/releases/latest) · [Report a bug](https://github.com/segux/kalimotxo/issues)

</div>

---

## What is Kalimotxo?

Kalimotxo is a free, open-source desktop app that makes it possible to run
Battle.net games on Apple Silicon Macs (M1, M2, M3, M4…). It sets up and manages
everything automatically: the Wine compatibility layer, the graphics drivers, and
the Battle.net client itself.

**You just click Install, and Kalimotxo takes care of the rest.**

> Tested and working on **macOS 16 Tahoe** on Apple Silicon.

---

## Requirements

| | |
|---|---|
| **Mac** | Apple Silicon (M1 or newer) |
| **macOS** | Ventura 13 or later — tested on Tahoe 16 |
| **Disk space** | ~2 GB free (for Wine + graphics runtimes) |
| **Internet** | Required for the initial setup download |

That's it. No Xcode, no Homebrew, no command line — the setup wizard handles everything else.

---

## Download and install

1. Go to the [Releases page](https://github.com/segux/kalimotxo/releases/latest).
2. Download **Kalimotxo-x.x.x-arm64.dmg**.
3. Open the DMG file and drag **Kalimotxo** into your **Applications** folder.
4. Launch Kalimotxo from Applications.

> **"Kalimotxo" can't be opened?** Right-click the app icon → **Open** → click Open
> in the dialog. You only need to do this once. This happens because the app is
> distributed outside the Mac App Store.

---

## First launch — setup wizard

The first time you open Kalimotxo it shows a setup wizard. Click
**"Prepare everything automatically"** and wait for it to finish.

The wizard downloads:
- Wine 11 (compatibility layer for Windows programs)
- DXMT (translates DirectX 11/12 calls to Metal — Apple's GPU API)
- Game Porting Toolkit components
- Rosetta 2 (if not already installed)

This is a one-time download of roughly 700 MB. Once done, you're ready to install games.

---

## Installing and playing games

1. Open Kalimotxo and go to **Platforms → Battle.net**.
2. Click **Install** to download and set up the Battle.net client.
3. Log in to Battle.net normally inside the window.
4. Install any game from the Battle.net client.
5. To launch a game later, click **Play** next to it in Kalimotxo.

### Supported games (tested)

| Game | Status |
|---|---|
| Diablo II: Resurrected | ✅ Working |
| World of Warcraft | ✅ Working |
| Overwatch 2 | ✅ Working |
| Hearthstone | ✅ Working |
| StarCraft II | ✅ Working |
| Warcraft III: Reforged | ✅ Working |

Other Battle.net games may work — try them and [report results](https://github.com/segux/kalimotxo/issues).

---

## Frequently asked questions

**Does it cost anything?**
No. Kalimotxo is free and open-source under the GPL-3.0 license. You still need
to own the games you want to play.

**Will it slow down my Mac or damage anything?**
No. Kalimotxo creates an isolated environment in `~/.kalimotxo`. Removing the app
and deleting that folder restores your Mac to its original state completely.

**Does it work on Intel Macs?**
No. It is built specifically for Apple Silicon (M-series chips).

**Why does macOS warn me the app is from an unidentified developer?**
The app is not signed with an Apple developer certificate (that costs $99/year).
Right-click → Open bypasses this warning and is safe.

**A game doesn't start or crashes — what do I do?**
Check the [issues page](https://github.com/segux/kalimotxo/issues) to see if it's
a known problem. If not, open a new issue with your Mac model, macOS version, and
the game name.

**Can I use CrossOver or other Wine versions instead?**
Kalimotxo manages its own Wine installation and does not use CrossOver or any
third-party Wine. This keeps the setup reproducible and avoids conflicts.

---

## Languages

The UI is available in **English, Spanish, French, Italian, Portuguese and German**.
Kalimotxo auto-detects your system language and you can change it in
**Settings → System**.

---

## For developers

This project uses **pnpm** exclusively (never npm or yarn).

```bash
pnpm install
pnpm start          # Electron dev window with hot reload
pnpm run codecheck  # TypeScript type check (no emit)
pnpm run test       # Jest test suite
pnpm run dist:mac   # Build Kalimotxo.app + DMG into dist/mac/
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for code conventions (English code,
Conventional Commits in English).

### Architecture overview

```
src/
  backend/          # Electron main process
    wine/           # Wine environment, runtimes, graphics layers
    storeManagers/  # Battle.net orchestration (install/repair/launch)
    config/         # Paths and global config
    launcher/       # Wine runner, registry setup
  preload/          # Typed window.api bridge
  frontend/         # React + Tailwind UI
  common/types/     # IPC contracts shared between processes
```

Key files:
- [`wine/wineEnv.ts`](src/backend/wine/wineEnv.ts) — builds the Wine launch environment
- [`wine/wineRuntimeLibs.ts`](src/backend/wine/wineRuntimeLibs.ts) — places MoltenVK and gnutls where Wine loads them
- [`storeManagers/battlenet/agentPortBridge.ts`](src/backend/storeManagers/battlenet/agentPortBridge.ts) — Update Agent TCP bridge (port 1120)
- [`storeManagers/battlenet/service.ts`](src/backend/storeManagers/battlenet/service.ts) — install / repair / launch orchestration

For a deep dive into the technical challenges solved, see [`docs/battlenet-wine-problemas-y-roadmap.md`](docs/battlenet-wine-problemas-y-roadmap.md).

---

## Credits

Kalimotxo builds on [Heroic Games Launcher](https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher) (GPL-3.0),
[DXMT](https://github.com/3Shain/dxmt), [MoltenVK](https://github.com/KhronosGroup/MoltenVK) and Wine.
Full list in [CREDITS.md](CREDITS.md).

## License

[GPL-3.0-or-later](LICENSE).

## Disclaimer

Independent project, not affiliated with or endorsed by Blizzard Entertainment or
Apple Inc. Trademarks belong to their respective owners. Use at your own risk and
respect the terms of service of the software you run.
