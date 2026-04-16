# claude-ding

> Play a notification sound when Claude Code finishes responding.

No more forgetting about Claude's output while you're doing other things. Get a subtle "ding" when it's done.

## Install

```bash
git clone https://github.com/WILLIAM030623/claude-ding.git
cd claude-ding
claude --plugin-dir ./claude-ding
```

That's it. Every time Claude finishes a response, you'll hear a beep.

## Usage

### Configuration

All options are controlled via environment variables:

| Variable | Default | Description |
|---|---|---|
| `DING_FREQ` | `880` | Tone frequency in Hz (80–8000) |
| `DING_DURATION` | `200` | Tone duration in ms |
| `DING_COOLDOWN` | `0` | Minimum ms between dings (`0` = always ding) |

Example — set a higher pitch with cooldown:

```bash
# In your shell profile
export DING_FREQ=1200
export DING_COOLDOWN=5000
```

Or in Claude Code's `settings.json`:

```json
{
  "env": {
    "DING_FREQ": "1200",
    "DING_COOLDOWN": "5000"
  }
}
```

### Manual install (without `--plugin-dir`)

If your version of Claude Code doesn't support `--plugin-dir`, you can add the hook directly to your project's `.claude/settings.local.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/claude-ding/bin/ding.cjs"
          }
        ]
      }
    ]
  }
}
```

## How it works

- Listens on the `Stop` hook (fires when Claude finishes a response)
- Plays a cross-platform notification sound via Node.js
- Works on Windows, macOS, and Linux
- No dependencies beyond Node.js (which Claude Code already requires)

## License

MIT
