# Kiroween 2026 submission checklist

Deadline: **Friday, December 4, 2026, 2:00 PM Pacific** (Saturday, December 5, 3:30 AM India time). Devpost lets you save drafts, so start the submission early.

This list follows the requirements on the Kiroween 2026 overview page. Read the Official Rules page yourself too: it is the final word, and this checklist was written without access to it.

## Must have, or the entry does not count

- [ ] **The project uses Kiro.** Not done yet. All five rooms were built with Claude Code. Kiro still has to do real work on this project before you submit: for example the mansion map, a gallery of freed ghosts, tests, or a polish pass driven by specs and hooks. Keep notes for the write-up. See "How Kiro was used" in `docs/devpost.md`.
- [x] **Public GitHub repo** (not GitLab or Bitbucket): https://github.com/Sribb/euphoria-haunted-house
- [x] **Open source license file, visible in the repo's About section.** MIT, detected by GitHub.
- [x] **`/.kiro` directory at the repo root, not in `.gitignore`.** Steering docs are committed. Add specs and hooks as you use Kiro.
- [x] **All source, assets and instructions needed to run it.** `npm install`, then `npm run dev`.
- [x] **URL to the working app.** https://euphoria-haunted-house.vercel.app, no login needed.
- [ ] **Text description** of features and functionality. Draft in `docs/devpost.md`.
- [ ] **Demo video**, under 3 minutes, public on YouTube, showing the project working on the device it was built for. Script in `docs/demo-video-script.md`.
- [ ] **Write-up on how Kiro was used.** Must be true. Template in `docs/devpost.md`.
- [ ] **Category selected:** Costume Contest.

## Rules to keep in mind

- **New projects only.** The project must be built during the submission period (October 30 to December 4, 2026). This repo started on November 27, 2026. It reuses older Euphoria code and content, and the README says exactly what. Check the Official Rules on pre-existing code, and ask in the Kiro Discord (#kiroween-hackathon) if it is unclear.
- **No third-party trademarks or copyrighted music in the video.** The game's sound is synthesised, so the game audio is safe. Euphoria's own name and brand are yours to use.
- **Teams** can have up to three members. Everyone must be above the age of majority where they live, and some countries are excluded. Check the rules for your case.
- **One prize type.** A project can win one Overall or one Category prize, plus any number of bonus prizes.

## Judging criteria, and where this project stands

| Criterion | What judges ask | Where we stand |
| --- | --- | --- |
| Potential Impact | Real problem, real audience, would someone use it? | Strong: teens who find investing scary, backed by a real app. |
| Technological Implementation | How thoroughly and skilfully was Kiro used? | **Weak until Kiro is used.** This is the biggest risk. |
| Design | Complete, coherent, polished product? | Good and improving: five full rooms, cutscenes, encounters, phone support. |
| Innovation | Novel concept, unusual tech or resources? | Strong: 3D-as-pixel-art renderer, lessons as ghost stories. |
| Presentation | Does the video show it working end to end and tell the story? | Not started. Script is ready. |

## Bonus prizes

- [ ] **Best Startup Project ($10,000).** Confirm you are a founder of Euphoria. Add your LinkedIn profile and https://euphoriainv.com on the form.
- [ ] **Best Student Project ($1,500 per category).** Only if all team members are students. Each needs LinkedIn, student email, year and degree, and school name.
- [ ] **Social Blitz.** Post on any social platform during the submission period. The post must **start** with `#KiroweenHackathon26` and share your favourite thing about Kiro and how it changed how you build. Add the link. Draft in `docs/writeups/social-post.md`.
- [ ] **Bonus Blog.** Publish a public blog post about Kiro and the project on a third-party platform during the submission period, and say it was written for the Kiroween 2026 hackathon. Add the link. Draft in `docs/writeups/blog-post.md`.
- [x] **Best Demo.** Every eligible entry is considered.
- Ghost of Kiroween Past and Best Kiro Crew App apply only if you registered for Kiroween 2025, or built a Kiro Crew app.

## The last day

1. Deploy the final build (`vercel deploy --prod`) and play it through once on the live URL, on a laptop and on a phone.
2. Push the final commit. Open the GitHub page and check the license shows in About and `.kiro` is there.
3. Upload the video to YouTube as Public (not Unlisted). Watch it once from a logged-out browser.
4. Paste the description and the Kiro write-up into Devpost. Check every link opens.
5. Submit with time to spare. Devpost gets slow near a deadline.
