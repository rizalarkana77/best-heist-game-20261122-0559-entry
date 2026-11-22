[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rizalarkana77/best-heist-game-20261122-0559-entry/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rizalarkana77/best-heist-game-20261122-0559-entry/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# Velvet Vault — A Midnight Heist

A stealth heist game for the make.fun competition
`best-heist-game-20261122-0559`. Original art, sounds, names and levels —
nothing borrowed from any commercial game.

## The heist

You are Wren, a thief in a velvet mask, inside the Marroway Gallery after
dark. Three rooms stand between you and the Star Sapphire — each patrolled
by guards with visible vision cones and swept by wall cameras. Grab the
sapphire (plus the optional loot cases), then slip out the exit before the
alarm meter hits 100.

- **Move:** WASD / arrow keys, or click anywhere to walk there.
- **Sneak:** hold Shift to move slowly and be spotted half as fast.
- **Pause:** P or Esc. **Mute:** M. **Restart level:** R.
- **Seen?** The alarm rises while you stand in a guard's or camera's cone
  and cools down while you hide. At 100 the alarm trips: you lose a nerve
  and restart the room. Three nerves per heist.
- **Win a room:** grab the Star Sapphire, then reach the glowing exit.
  Finish all three rooms to complete the heist.

## Play it

```sh
node serve.ts        # then open http://localhost:8080
```

No build step, no network request: `game/` is plain static files and all
art is drawn in code on a canvas; sounds are synthesized with WebAudio.

## Screenshots

`?shot=cover|spotted|loot|exit&seed=1` stages a fixed, deterministic
gameplay frame for each screenshot (same render code as live play).

## Hand-in

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and
writes `/output/dossier.json` via `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

MIT licensed.
