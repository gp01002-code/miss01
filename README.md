**Your number is your colour.**

You are a unicorn made of light, rolling across a slab in the dark. Whatever number you carry, take it mod 7 — that remainder is the colour you glow. Reach the light column while glowing its colour and the level opens.

To change your number you roll into operator beads. But the beads are prisms: which operator you get depends on the side you hit. Come at a bead from the left and it might add 5; clip the same bead from the right and it multiplies by 2. So a level is never just arithmetic — it is a route. Order matters (+3 then ×2 is not ×2 then +3), approach angle matters, and momentum makes both harder to control than they look.

Beads return a few seconds after you take one, so a mistake costs time, not the run. Let your number go negative and your light goes out.

**Controls**

- Desktop: drag anywhere on the board to tilt it, or use the arrow keys.
- Mobile: tilt the phone itself. Whatever posture you are holding when it starts counts as level; the ⌖ button re-centres it any time. Dragging still works and overrides tilt.

The first five levels are hand-built and untimed or generous, and each introduces exactly one idea. After that, levels are generated — always with a guaranteed solution path, plus decoy beads to punish greed.

**Technical notes**

Everything is drawn procedurally into a single canvas — no images, no fonts, no external requests. The 3D is not WebGL: it is a hand-rolled perspective projection, so the board's tilt is just a per-vertex height and the whole renderer costs a few hundred bytes. Depth sorting, the light the unicorn casts on the floor, and the seven-band rainbow trail all fall out of that same projection.

Audio is synthesised with the Web Audio API at runtime. Each bead's pickup note is pitched by your new remainder against a major scale, so the sound tells you your colour too — useful if you cannot rely on hue. Every colour in the game is mirrored in text (mod n on the goal, the number on the unicorn, both remainders in the HUD).
