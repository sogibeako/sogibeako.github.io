# Braided MOS Lab

Open `index.html` directly in a modern browser. No dependencies, build, network calls or server are required. Press Play to enable Web Audio.

## Implemented

- 5L2s, seven steps, eight persistent note IDs including the period endpoint.
- SVG trajectories, six exact presets, slider, configurable forward/reverse sweep.
- Validated permutation input and keyboard-accessible swap buttons.
- Web Audio clock scheduling, per-note oscillators, attack/release envelopes, logarithmic retuning, BPM, reference frequency, volume and waveform controls.
- Target pitch markers and separate estimated current audio pitch rings.
- Editable 2–15-step words, up to 16 voices, 100–2400 cent periods and a 3:1 preset. Cyclic balance is checked; arbitrary words are allowed but identified separately from MOS-derived words.
- Stop cancels the sweep, queued sequence events and oscillator playback with a short master release. Hidden tabs stop automatically.

## Review of the proposal

The specified 5L2s formula and all six numeric states are consistent. `u=1/7` exchanges which fixed label is larger; `u=1/2` collapses the L steps. Negative L describes an extension of the labeled trajectories, rather than an ordinary ascending scale.

1. The example permutation must end in 7, not 8. References to seven lines or seven sequence notes must be eight when the endpoint is included.
2. Fifteen steps imply sixteen voices with the endpoint. This implementation keeps the step limit and includes all sixteen voices.
3. Harmonic minor `LsLLsKs` contains **1K3L3s**, not 1K3L2s. Setting K=L does yield a rotation of the 4L3s MOS word `LLsLsLs`. Setting L=s yields a rotation of 1L6s.
4. A mediant lies between the inputs when both denominators are positive. Strict inequalities require unequal inputs. In EDO notation denominators encode the chosen division; reducing fractions before a mediant changes that operation even though the endpoint cents remain the same.
5. Component addition of aligned integer step vectors gives a denominator-weighted average after period normalization. It is not in general closed on MOS words: the Ionian/Lydian example has three distinct step sizes. The displayed 24EDO example is arithmetically correct, but is not itself a two-step MOS.
6. 7EDO and 5EDO are degenerate boundary tunings here. Calling 7EDO itself “Meantone” is less precise than calling it the 7EDO boundary of the illustrated family. Decimal cents in the preamble should use a consistent rounding policy (e.g. 4\\7 = 685.714 cent).
7. A nonzero glide inherently separates the instantaneous target from the sounding frequency. The UI distinguishes target values from a ring calculated from the same exponential ramp sent to Web Audio. It is not a microphone or spectrum measurement.
8. The plotted crossings do not, by themselves, specify a braid group element. The proposal already states this limitation correctly.

Reference for 4L3s step order: https://en.xen.wiki/w/4L_3s
Web Audio exponential ramps: https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime

## Verification

Run `node model.test.cjs` from this directory. Tests cover all six specified states at error below 1e-10 cent, 1,001 sweep positions, endpoint invariance, positive frequencies, invalid permutations, harmonic-minor collapse word balance, a non-octave period, sixteen voices, and exponential interpolation.

Desktop browser UI checked: 2EDO collapse, playback state, negative region, stop, invalid permutation rejection and valid permutation application. Browser error log was empty. Responsive layout inspected at 390px width. Actual speaker output and physical-device latency have not been measured.

Future interval walks, explicit crossing histories, TRIAD controls, MIDI and VST are not implemented.
