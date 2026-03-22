# ISLANDERS City Planner ⬡

An interactive node-based city planning tool for **ISLANDERS** and **ISLANDERS: New Shores** by GrizzlyGames / The Station.

Plan building placement, visualize adjacency radii, calculate real-time scores, and optimize your district layouts before committing in-game.

## Features

- **44 buildings** — All original ISLANDERS buildings + New Shores additions (Cliff House, Hermitage, Terrace, Pyre, Guild Hall, Mountain Shrine, Lighthouse, Harbor, Dock, Fish Kite, Fortune Teller)
- **Real-time scoring** — Adjacency bonuses and penalties calculated as you drag buildings
- **Influence radii** — Visual radius circles color-coded by category, per-building toggle
- **Connection lines** — Green = positive synergy, red dashed = penalty, thickness = magnitude
- **Boons system** — Apply Score Multiplier, Neighborly, Sustainable, +50% Area, Precious to individual buildings
- **Pack unlock tracker** — See which building packs you've unlocked based on current score
- **Placement suggestions** — Context-aware tips based on your current layout
- **Drag & drop** — Drag buildings from sidebar directly onto the canvas
- **District strategy guide** — Built-in advice on zone separation

## Data Sources

Building stats (base scores, self-penalties, adjacency bonuses/penalties) are sourced from:
- [Islanders Score & Strategy Bible](https://steamcommunity.com/sharedfiles/filedetails/?id=1704459130) (Cap'n Saccade, 2019)
- [Knoef Console Edition Trophy Guide](https://knoef.info/trophy-guides/ps4-guides/islanders-console-edition-trophy-guide/) (2021)
- [Tips & Strategy - Become an Efficient Islander](https://steamcommunity.com/sharedfiles/filedetails/?id=3300334936) (Piel, 2025)
- [ISLANDERS: New Shores - Strategy, Tips and Thoughts](https://steamcommunity.com/sharedfiles/filedetails/?id=3541168527) (2025)

Radius values use relative multipliers from the Strategy Bible (1x, 4x, 10x, 20x of footprint) mapped to a consistent visual scale. New Shores buildings have approximate stats based on community gameplay observations.

**Contributions welcome!** If you have exact datamined values, please open an issue or PR.

## Quick Start

### Standalone HTML (no build needed)
Open `dist/index.html` in any browser. That's it.

### Development
```bash
npm install
npm run dev
```

### Build for production
```bash
npm run build
```

Output goes to `dist/` — deploy anywhere static files are served.

## License

MIT — This is a fan-made tool. ISLANDERS is a trademark of The Station / Coatsink / Thunderful.
