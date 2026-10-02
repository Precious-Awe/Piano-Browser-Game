"""
Generates Easy / Medium / Hard note charts from a song's audio.

Usage (macOS, uses the built-in afconvert to decode MP3):

    python3 tools/generate-charts.py audio/shadows-behind-neon.mp3 \
        --bpm 104.76 --offset 0.44 --first-beat 5 --last-beat 184 \
        --scale C,D,D#,F,G,G#,A#

Prints JSON: {"easy": [[beat, note], ...], "medium": ..., "hard": ...}
Paste the pairs into the matching buildChart([...]) calls in js/notes.js.

How it works:
- Measures the onset strength (sudden rise in loudness) at every beat and
  half beat, using the song's bpm and offset from js/notes.js.
- Picks the strongest hits first. Easy uses whole beats at least 2 beats
  apart, Medium adds notes at least 1 beat apart, Hard adds notes at least
  half a beat apart, but a half-beat gap is always followed by at least a
  full beat (quick notes come in pairs, not streams). The weakest 30% of positions never get a note, so
  quiet sections stay quiet.
- The pitch of each note is the strongest pitch class heard just after the
  hit (octaves 4-6), chosen only from the song's scale (--scale) so that
  what the player plays is always in key with the track.
- Each note goes in whichever octave (4 or 5) is closest to the previous
  note, so the melody moves smoothly instead of jumping across the keyboard.

Pass --estimate to print the best bpm and first-beat offset instead.
"""

import argparse
import array
import json
import math
import os
import subprocess
import sys
import tempfile
import wave

SAMPLE_RATE = 22050
HOP = 0.005
NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def decode(mp3_path):
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = os.path.join(tmp, "song.wav")
        subprocess.run(
            ["afconvert", "-f", "WAVE", "-d", f"LEI16@{SAMPLE_RATE}", "-c", "1", mp3_path, wav_path],
            check=True,
        )
        w = wave.open(wav_path)
        return array.array("h", w.readframes(w.getnframes()))


def onset_flux(data):
    n = int(SAMPLE_RATE * HOP)
    env = []
    for i in range(0, len(data) - n, n):
        s = 0
        for x in data[i:i + n]:
            s += x * x
        env.append(math.log(1 + s / n))
    return [0.0] + [max(0.0, env[i] - env[i - 1]) for i in range(1, len(env))]


def grid_score(flux, bpm, phase, start, end):
    period = 60 / bpm
    total, t = 0.0, phase
    while t < end:
        if t >= start:
            i = int(round(t / HOP))
            total += max(flux[max(0, i - 2):i + 3])
        t += period
    return total


def best_phase(flux, bpm, start, end):
    period = 60 / bpm
    phases = [p * HOP for p in range(int(period / HOP))]
    return max(phases, key=lambda ph: grid_score(flux, bpm, ph, start, end))


def estimate(flux, guess):
    """Finds the bpm whose beat grid stays in phase across the whole song."""
    duration = len(flux) * HOP
    seg = 20
    results = []
    bpm = guess - 3
    while bpm <= guess + 3:
        period = 60 / bpm
        phases = [best_phase(flux, bpm, s, s + seg) for s in range(0, int(duration) - seg, seg)]
        angles = [2 * math.pi * p / period for p in phases]
        c = sum(math.cos(a) for a in angles) / len(angles)
        s = sum(math.sin(a) for a in angles) / len(angles)
        mean = (math.atan2(s, c) % (2 * math.pi)) * period / (2 * math.pi)
        results.append((math.hypot(c, s), round(bpm, 2), round(mean, 3)))
        bpm += 0.05
    results.sort(reverse=True)
    return results[:5]


def generate(data, flux, bpm, offset, first_beat, last_beat, scale):
    period = 60 / bpm

    def time_of(beat):
        return offset + (beat - 1) * period

    def strength(beat):
        i = int(round(time_of(beat) / HOP))
        return max(flux[max(0, i - 4):i + 5])

    grid = []
    beat = first_beat
    while beat <= last_beat + 1e-9:
        grid.append(round(beat * 2) / 2)
        beat += 0.5
    scores = {b: strength(b) for b in grid}
    floor = sorted(scores.values())[int(len(grid) * 0.30)]

    def no_streams(chart):
        # A half-beat gap must be followed by at least a full beat, so any
        # three consecutive notes span at least 1.5 beats.
        return all(chart[i] - chart[i - 2] >= 1.5 - 1e-9 for i in range(2, len(chart)))

    def pick(candidates, chosen, min_gap, target, allowed=lambda chart: True):
        chosen = set(chosen)
        for b in sorted(candidates, key=lambda x: -scores[x]):
            if len(chosen) >= target or scores[b] <= floor:
                break
            if all(abs(b - c) >= min_gap - 1e-9 for c in chosen) and allowed(sorted(chosen | {b})):
                chosen.add(b)
        return sorted(chosen)

    beats = last_beat - first_beat + 1
    easy = pick([b for b in grid if b == int(b)], [], 2, int(beats * 0.36))
    medium = pick(grid, easy, 1, int(beats * 0.6))
    hard = pick(grid, medium, 0.5, int(beats * 0.9), no_streams)

    size = 2048
    hann = [0.5 - 0.5 * math.cos(2 * math.pi * n / (size - 1)) for n in range(size)]

    def power(frame, freq):
        c = 2 * math.cos(2 * math.pi * freq / SAMPLE_RATE)
        s1 = s2 = 0.0
        for x in frame:
            s1, s2 = x + c * s1 - s2, s1
        return s1 * s1 + s2 * s2 - c * s1 * s2

    def pitch_class(beat):
        start = int((time_of(beat) + 0.02) * SAMPLE_RATE)
        frame = [data[start + n] * hann[n] for n in range(size)] if start + size < len(data) else [0.0] * size
        energy = {
            (pc, octave): power(frame, 440 * 2 ** ((12 * (octave + 1) + pc - 69) / 12))
            for pc in scale
            for octave in (4, 5, 6)
        }
        pc = max(scale, key=lambda p: sum(energy[(p, o)] for o in (4, 5, 6)))
        return pc, (4 if energy[(pc, 4)] >= energy[(pc, 5)] else 5)

    # Hard contains every note, so walking it in order gives each note a
    # previous note to stay close to. Easy and Medium reuse these pitches.
    notes = {}
    previous = None
    for beat in hard:
        pc, loudest_octave = pitch_class(beat)
        if previous is None:
            midi = 12 * (loudest_octave + 1) + pc
        else:
            midi = min((60 + pc, 72 + pc), key=lambda m: abs(m - previous))
        notes[beat] = f"{NAMES[midi % 12]}{midi // 12 - 1}"
        previous = midi

    def fmt(beat):
        return int(beat) if beat == int(beat) else beat

    return {
        name: [[fmt(b), notes[b]] for b in chart]
        for name, chart in (("easy", easy), ("medium", medium), ("hard", hard))
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("audio")
    parser.add_argument("--bpm", type=float, required=True)
    parser.add_argument("--offset", type=float)
    parser.add_argument("--first-beat", type=float, default=5)
    parser.add_argument("--last-beat", type=float)
    parser.add_argument("--scale", help="comma-separated pitch classes, e.g. C,D,E,F,G,A,B")
    parser.add_argument("--estimate", action="store_true")
    args = parser.parse_args()

    data = decode(args.audio)
    flux = onset_flux(data)

    if args.estimate:
        for stability, bpm, phase in estimate(flux, args.bpm):
            print(f"bpm {bpm}  beat phase {phase}s  stability {stability:.3f}")
        return

    if args.offset is None or args.last_beat is None or args.scale is None:
        sys.exit("--offset, --last-beat and --scale are required unless --estimate is used")

    scale = [NAMES.index(name.strip()) for name in args.scale.split(",")]
    print(json.dumps(generate(data, flux, args.bpm, args.offset, args.first_beat, args.last_beat, scale)))


if __name__ == "__main__":
    main()
