# Prism Run — post-mortem

**js13kGames 2026 · theme: Unicorns and Rainbows · 10,360 of 13,312 bytes**

With a theme like Unicorns and Rainbows, I assumed a few hundred entries were
about to be pastel gradients and cute sprite ponies. 13KB is a bad place to win
on art, so the plan was to find a dimension nobody else was working in.

## You don't have to do maths

The idea started from noticing that **a rainbow has seven bands and mod 7 has
seven residues**. So: you carry a number, and `number mod 7` is the colour you
glow. The goal doesn't check your number, it checks your colour.

That sounds like arithmetic homework, and in the first build it was. Then I
gave the prisms light: **every beam a prism scatters is drawn in the colour you
would become if you hit that face.** A beam outlined in white means that face
wins the level. A grey beam means it would take you negative and your light
goes out.

So you never compute anything. You look at the colours and pick a route. The
arithmetic is still underneath — it's what makes the colours behave in an
interesting way — but the player's job is spatial, not mental. Beginners read
the beams; experienced players stop looking.

## The prisms came from a butterfly

The best idea in the game arrived from outside it. Butterfly wing blue isn't
pigment, it's structural colour — the hue changes with viewing angle. Nothing
about the object changes; only your angle does.

Applied to the pickups: **a prism has two faces, and which operator you get
depends on the side you hit it from.** Clip it from the left and it adds 5; come
at the same prism from the right and it multiplies by 2.

That made approach angle a real decision, which is exactly what a tilting
marble is good at. It also meant one prism carries two operators, so levels stay
visually sparse while getting denser in content. And it's thematically honest —
not a rainbow pasted on top, but the physics of structural colour turned into a
rule.

Order not commuting does the rest: `+3` then `×2` is not `×2` then `+3`, so a
level is a route, not a sum. Momentum makes both harder than they look, which
is where the game actually lives.

## Fake 3D, then real 3D

The board looks three-dimensional and for most of the project it wasn't. One
function divides coordinates by depth — a hand-rolled perspective projection,
a few hundred bytes. Tilting the board is just a per-vertex height; the physics
stayed 2D the whole time. Depth sorting, the coloured light the unicorn casts
on the floor, and the seven-band rainbow trail all fell out of the same
function.

For the WebXR category that isn't enough. A textured panel floating in a
headset technically qualifies and is worth nothing — a judge puts it on and
sees a flat screen. So the renderer got rewritten in raw WebGL: geometry
generators for box, sphere, octahedron, disc, grid and a starfield, one lit
shader with an emissive term, per-eye matrices, and the whole board group
rotating with your controller. About 2KB compressed, which is why the zip sits
at 77% rather than 62%.

## Things I got wrong

**A base tilt that only existed in the picture.** I gave the VR board a 17°
resting pitch so the surface faced the player. The physics knew nothing about
it, so the board looked permanently tilted while the ball refused to roll down
the slope. Any transform that affects how a surface slopes has to exist on both
sides or on neither.

**A sign error hidden by a sign fix.** The pitch axis was inverted between the
visual rotation and the physics slope. A tester said front and back felt
backwards, I flipped the *input* sign, and both the picture and the ball
flipped together — so the mismatch survived wearing a different hat. I caught
it by printing the rotation matrix next to the physics formula and comparing
term by term. Verify against the maths, not against how it feels.

**Forking without a contract.** The Director's Cut has walls; the 13KB build
doesn't. The shared VR renderer looped over the wall list and threw every
frame, so the board drew and everything after it silently vanished.

**`getComputedStyle` in a render loop.** Reading CSS variables for colours every
frame, twice per prism, is around a thousand forced style recalculations a
second. It looked exactly like a crash. Cache the theme once.

## Levels a solver signed off on

A generator proposes a layout, a breadth-first search computes the minimum
number of prism faces needed to reach the target residue, and the candidate is
rejected unless that number matches the designed difficulty. A flood fill
confirms every prism and the goal are reachable around the walls. Fifteen
levels whose shortest solutions go 1 → 2 → 3 → 4 → 5, verified rather than
hoped for.

An earlier version silently dropped a pickup when placement failed, which
produced genuinely unsolvable levels and a tester who reasonably assumed the
game was broken. Any retry loop needs a guaranteed exit.

## Numbers

Source about 29,700 bytes, minified to roughly 29KB, and **10,360 bytes** as a
Roadroller-packed, zopfli-zipped single file. No images, no fonts, no audio
files — everything drawn in code, every sound synthesised at runtime.

## Would I do it again

The habit worth keeping was asking what the theme *is* rather than what it
looks like. Mod 7 and seven rainbow bands, structural colour and
angle-dependent operators — both came from taking the theme literally enough to
find a rule inside it.

The thing I'd change is testing on the headset earlier. Every painful bug in
this project lived in the gap between what I could verify on my machine and
what actually happened in VR.
