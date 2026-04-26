# Kitchen Beats — Digital Production Center

A world-class browser-based MPC (Music Production Center) for creating beats. Built with React, TypeScript, and the Web Audio API.

## Features

- **16 Velocity-Sensitive Pads** — 4 banks (A/B/C/D) for 64 total pads
- **Full Drum Synthesis** — 16 synthesized drum sounds (kick, snare, hi-hats, toms, percussion) via Web Audio API
- **Step Sequencer** — 16/32 step patterns with per-step velocity editing
- **8 Pattern Slots** — Pattern copy, clear, and switching
- **Mixer** — Per-pad volume, pan, mute, and solo
- **Effects Rack** — Master reverb, delay, filter (LP/HP/BP/Notch), and compressor
- **Per-Pad Controls** — Pitch, filter, resonance, reverb send, delay send
- **Audio Visualizer** — Real-time frequency spectrum and waveform display
- **Swing Control** — Adjustable swing amount per pattern
- **Tap Tempo** — Tap to detect BPM
- **WAV Export** — Render patterns to downloadable WAV files
- **Keyboard Mapping** — Full keyboard control (1-4, Q-R, A-F, Z-V)
- **Real-time Recording** — Record pad hits directly into the sequencer
- **CRT-style Display** — Hardware-inspired LCD status display

## Quick Start

```bash
npm install
npm run dev
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1 2 3 4` | Pads 1-4 |
| `Q W E R` | Pads 5-8 |
| `A S D F` | Pads 9-12 |
| `Z X C V` | Pads 13-16 |
| `Space` | Play / Stop |
| `Enter` | Toggle Recording |

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Web Audio API (synthesis, effects, analysis)
- Lucide React (icons)

## Architecture

```
src/
  engine/
    AudioEngine.ts      # Core audio routing, effects, offline rendering
    DrumSynth.ts        # Procedural drum synthesis (16 types)
    Sequencer.ts        # Lookahead step sequencer
  hooks/
    useMPC.ts           # Main state management
    useKeyboard.ts      # Keyboard input mapping
  components/
    App.tsx             # Main layout
    PadGrid.tsx         # 4x4 pad grid with bank selector
    Pad.tsx             # Individual velocity-sensitive pad
    StepSequencer.tsx   # Step sequencer grid
    Transport.tsx       # Play/stop/record/BPM/swing controls
    Mixer.tsx           # Per-pad mixer with faders and knobs
    EffectsPanel.tsx    # Master effects controls
    Knob.tsx            # SVG rotary knob control
    Display.tsx         # LCD status display
    Visualizer.tsx      # Real-time audio visualizer
    PatternSelector.tsx # Pattern management
```
