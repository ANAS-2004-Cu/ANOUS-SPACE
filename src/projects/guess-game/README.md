# Number Guess (0–99) — Dynamic Temperature Radar

[![Category](https://img.shields.io/badge/Category-Games-10B981?style=flat-square)](../../../README.md)
[![Route](https://img.shields.io/badge/Route-%2Fguess--game-122033?style=flat-square)](#routes--endpoints)
[![Atmosphere](https://img.shields.io/badge/Atmosphere-Temperature_Radar-FB7185?style=flat-square)](#overview)

## Overview

**Number Guess (0–99)** is a 10-attempt (`MAX_TRIES = 10`) numerical deduction game built around a **Dynamic Temperature Radar** atmosphere. At the start of each round, `Math.floor(Math.random() * 100)` generates a hidden target integer from `0` to `99`, and the 2-digit coordinate input (`maxLength={2}`, sanitized via `replace(/[^0-9]/g, '')`) evaluates both direction (`high` / `low` / `correct`) and absolute proximity (`distance = Math.abs(randomNumber - value)`).

> [!NOTE]
> **Thermal Zone State Machine (`ZONE_THEME`) & Progress Telemetry**:
> Every submitted coordinate updates `radarZone` and smoothly transitions the full-viewport `.route-theme-canvas` background, card borders, target readout box, and directional telemetry pills across five distinct states:
> - **`cool` (`distance > 25` or Standby)**: Cool Slate (`#111419` dark / `#F5F7F9` light) with Slate-Blue (`#5B82B8`) accent and badge `RADAR STANDBY` or `COLD SIGNAL (> 25)`.
> - **`warm` (`10 < distance <= 25`)**: Warm Umber (`#161411` dark / `#F9F7F2` light) with Ochre (`#C5954E`) accent and badge `WARM PROXIMITY (≤ 25)`.
> - **`hot` (`distance <= 10`)**: Clay (`#171211` dark / `#F9F4F2` light) with Terracotta (`#C26A58`) accent, badge `HOT — WITHIN 10 UNITS`, and proximity status (`Close — Too High (Within 10)` or `Close — Too Low (Within 10)`).
> - **`victory` (`perfect === true`)**: Forest (`#111614` dark / `#F4F8F5` light) with Sage (`#51A37D`) accent, badge `TARGET LOCKED`, and full target reveal.
> - **`limit` (`limit === true` or `tries >= 10`)**: Oxblood Slate (`#161213` dark / `#F8F4F4` light) with Burgundy-Terracotta (`#A85751`) accent, badge `ATTEMPTS EXHAUSTED`, and target reveal.
>
> The **Remaining Radar Sweeps** progress bar shifts color dynamically based on `remaining / MAX_TRIES`: Sage (`#51A37D`) above `50%`, Ochre (`#C5954E`) above `25%`, and Terracotta (`#C26A58`) at or below `25%`.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `GuessGamePage.tsx` | Implements `0–99` target generation, 2-digit numeric input sanitization, `check()` proximity evaluation (`distance <= 10`), 5-zone `ZONE_THEME` atmosphere transitions, remaining sweeps progress bar, and chronological `guessHistory` directional pills. |
| `README.md` | Module documentation for the Number Guess (0–99) workspace. |

---

## Routes & Endpoints

| Route | Component | Responsibility |
| :--- | :--- | :--- |
| `/guess-game` | `GuessGamePage` | Renders the 10-attempt Dynamic Temperature Radar number deduction game. |

---

## Storage Keys

| Key | Storage Engine | Purpose |
| :--- | :--- | :--- |
| `anous_recent_tools` | `localStorage` | Records `'guess-game'` on mount via `recordRecentProject('guess-game')` (round state and `guessHistory` are held in React state). |
