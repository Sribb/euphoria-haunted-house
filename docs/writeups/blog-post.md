# Blog post draft (Bonus Blog Prize)

Rules for this prize: publish on a third-party blog platform (dev.to, Medium, Hashnode) during the submission period, make it public, write about **Kiro and the project**, and say it was written for the Kiroween 2026 hackathon. Then add the link to the Devpost submission.

The parts about the project are written. The parts about Kiro are marked **FILL IN**, because they have to be what really happened when you used it.

---

## We turned our investing lessons into a haunted house

*Written for the Kiroween 2026 hackathon.*

We run Euphoria, an app that teaches teenagers to invest. The most common thing we hear is not "this is boring". It is "this is scary". The words are scary, the charts are scary, and losing money is scary.

So for Kiroween we took that literally and built a haunted house.

**Play it:** https://euphoria-haunted-house.vercel.app
**Code:** https://github.com/Sribb/euphoria-haunted-house

### The idea: every ghost got money wrong

You walk through a dark mansion with a lantern. Each room holds one real lesson from our app and one ghost who never understood it.

The first ghost is the Miser. He kept every dollar in a drawer and thought that was safe. In his room you find the drawer, and it plays a short pixel movie: a hundred-dollar bill goes in, a year passes, and the same bill buys nine movie tickets instead of ten. That is inflation, and now it has a face.

When you have found all three of his memories, the Miser asks you questions. If you get one wrong, the room flickers and he explains. If you get them right, he is finally free, the room fills with warm light, and the door opens.

The second ghost is the Gambler, who put everything on one stock. His cellar teaches risk and reward.

### Spooky has to do a job

The Costume Contest asks for spooky design that improves the app, and that changed how we designed everything.

- Each room starts dark, and each thing you learn lights a candle. The light is the progress bar.
- The ghost's mood is the feedback: restless, then calm, then glowing.
- A wrong answer makes the room flicker, and the explanation arrives right then, when you care most.

### A 3D room that looks hand-drawn

The rooms are real 3D, drawn to look like pixel art. We render the scene at a low resolution with toon shading, add outlines, and snap every pixel to one Halloween palette. The camera is tilted to a 3-4-5 angle and snapped to the pixel grid, so every texture lands one texel to one screen pixel and nothing shimmers when you walk.

The moonlight is a real light behind the back wall, shining through real window openings. That is why the beams on the floor are arched like the windows.

Three bugs taught us the most:

1. **Our first room was almost black.** three.js divides ambient and directional light by pi, so every value needed to be about three times bigger than it looked.
2. **A chandelier looked like junk on the rug.** From a top-down camera, anything hanging in the middle of a room lands on the floor on screen.
3. **Bright gold turned mint green.** The palette snap picks the nearest colour, and for over-lit gold that was a green. Nothing in the house is green, so we took the greens out of the palette.

### What Kiro did for us

**FILL IN.** Write this from what actually happened. Useful things to cover, with one concrete example each:

- What you asked Kiro to build, and how you wrote the spec for it.
- A steering rule that Kiro followed and that saved you rework. (The steering docs in `.kiro/steering/` hold the rules above: light divided by pi, the camera angle, what belongs in the palette.)
- A hook you set up and what it automated.
- A property-based test that caught something. Good candidates: the player can never end up inside a wall, and a ghost cannot be freed before its unrest reaches zero.
- What surprised you, good or bad.

### What is next

Three more rooms: compound interest in the Clock Tower, stocks versus bonds in the Portrait Gallery, and diversification in the Kitchen. After that, we want to bring the best of it back into Euphoria.

If investing ever felt scary to you, come free a ghost.
