# Number Guess (0–99) — Dynamic Temperature Radar

[![Category](https://img.shields.io/badge/Category-Games-10B981?style=flat-square)](../../../README.md)
[![Route](https://img.shields.io/badge/Route-%2Fguess--game-122033?style=flat-square)](#routes--endpoints)
[![Atmosphere](https://img.shields.io/badge/Atmosphere-Temperature_Radar-FB7185?style=flat-square)](#overview)

## Overview

**Number Guess (0–99)** transforms classic binary-search deduction into an atmospheric **Dynamic Temperature Radar**. Players have 10 radar sweeps to lock onto a hidden integer between `00` and `99`, receiving both directional guidance (`Too Low` / `Too High`) and proximity-reactive visual feedback on every attempt.

> [!NOTE]
> **Proximity-Reactive Full-Viewport Radar**: Every guess calculates the absolute distance $\Delta = |\text{target} - \text{guess}|$ and smoothly transitions the entire viewport background and target readout box across five thermal zones:
> - **Cold Signal ($\Delta > 25$)**: Deep Ocean Slate (`#0C1624` dark / `#EFF6FF` light) with Sky-Blue (`#38BDF8`) telemetry pills.
> - **Warm Proximity ($10 < \Delta \le 25$)**: Warm Amber Slate (`#1F1712` dark / `#FFFBEB` light) with Amber (`#F59E0B`) telemetry pills.
> - **Hot — Within 10 ($\Delta \le 10$)**: Fiery Terracotta (`#241313` dark / `#FEF2F2` light) with Rose-Coral (`#FB7185`) proximity alerts.
> - **Target Locked ($\Delta = 0$)**: Rich Emerald (`#0D211A` dark / `#ECFDF5` light) revealing the locked target coordinate.
> - **Attempts Exhausted (`10 / 10` sweeps used)**: Crimson Slate (`#221115` dark / `#FEF2F2` light) revealing the hidden target.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `GuessGamePage.tsx` | Implements random `0–99` target generation, 2-digit coordinate input sanitization, thermal zone state machine, large target readout display, remaining sweeps progress bar, and color-coded directional telemetry pills. |
| `README.md` | Module documentation for the Number Guess workspace. |

---

## Routes & Endpoints

| Route | Component | Responsibility |
| :--- | :--- | :--- |
| `/guess-game` | `GuessGamePage` | Interactive 10-attempt number deduction radar game (`0–99`). |

---

## Storage Keys

| Key | Storage Engine | Purpose |
| :--- | :--- | :--- |
| `anous_recent_tools` | `localStorage` | Records `'guess-game'` via `recordRecentProject('guess-game')` when the workspace opens (active round state is held in React component memory). |
