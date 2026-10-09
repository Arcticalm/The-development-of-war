"""Generate short original PCM cues; no network or third-party audio required."""
from pathlib import Path
import math
import struct
import wave

root = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
root.mkdir(parents=True, exist_ok=True)
notes = {
    'click': [(740, .06)], 'spawn': [(440, .08), (660, .1)],
    'confirm': [(660, .045), (880, .065)], 'reject': [(260, .07), (220, .05)],
    'evolve': [(440, .12), (554, .12), (659, .18), (880, .22)],
    'skill': [(220, .09), (330, .09), (660, .2)],
    'win': [(523, .15), (659, .15), (784, .15), (1047, .28)],
    'lose': [(392, .18), (330, .18), (262, .28)],
    'draw': [(440, .18), (440, .25)],
}
for name, sequence in notes.items():
    samples = []
    for hz, duration in sequence:
        count = round(duration * 22050)
        for i in range(count):
            envelope = min(1, i / 180, (count - i) / 450)
            samples.append(round(9000 * envelope * math.sin(2 * math.pi * hz * i / 22050)))
        samples.extend([0] * 220)
    with wave.open(str(root / (name + '.wav')), 'wb') as sound:
        sound.setparams((1, 2, 22050, 0, 'NONE', 'not compressed'))
        sound.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
