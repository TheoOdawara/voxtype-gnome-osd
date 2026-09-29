# Voxtype OSD

GNOME Shell 50 extension that shows what the [voxtype](https://github.com/peteonrails/voxtype)
speech-to-text daemon is doing: a panel indicator for its state and an on-screen pill with a live
waveform while it records.

## How it works

- **State:** watches `$XDG_RUNTIME_DIR/voxtype/state` with a `Gio.FileMonitor` and maps it to
  `idle`, `recording`, `transcribing` or `unavailable`.
- **Waveform:** while recording, launches `voxtype-audio-bridge` as a subprocess and reads one JSON line
  per sample (`{"peak": 0.42}`) from its stdout, drawing the last 300 peaks. Malformed lines are dropped.
- The subprocess and the file monitor are cancelled on `disable()`, so nothing outlives the extension.

## Requirements

- GNOME Shell 50
- voxtype running as a daemon
- a `voxtype-audio-bridge` executable on `PATH` that prints the JSON lines above

## Install

```sh
npm ci
npm run install-extension
gnome-extensions enable voxtype-osd@theoodawara
```

Log out and back in on Wayland for GNOME Shell to load it.

## Development

```sh
npm run build
npm test
```

Written in TypeScript against the `@girs/gnome-shell` type definitions; the level parsing is covered by
`node:test`.
