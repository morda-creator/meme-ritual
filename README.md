# Meme Nexus

Build a web app called “Meme Ritual” – a weekly, AI-hosted meme competition.



The product should feel like a mix between Slack culture, internet humor, and a slightly existential AI presence.







🎯 

Core concept





A weekly meme competition with a fixed ritual:



Competition runs every Friday

Submission phase: 09:00 → 13:00

Voting phase: 13:00 → 16:00

Memes are anonymous until the end

AI bot hosts the entire experience





The goal is to create a fun, slightly chaotic, but structured social ritual.







🧩 

Core features (MVP)







1. Theme generation (AI)





At start of competition, AI generates a weekly meme theme

Theme is based on current events, trends, or absurd observations

Displayed prominently at the top





Example tone:

“This week’s theme: ‘Chat control in the EU’ – good luck explaining your memes to the algorithm.”







2. Submission phase





Users can upload memes (image upload)

No usernames displayed (anonymous entries)

Each meme appears in a live feed









3. AI commentary (key feature)





Every time a meme is uploaded:



AI automatically comments on it in the feed

Tone should be:



dry

slightly sarcastic

culturally aware

a bit absurd







Examples:



“Strong structure. Emotionally confusing.”

“This meme understands something about modern life.”

“Ambitious. Possibly illegal in 3 countries.”









4. Feed





Infinite scroll meme feed

Each meme card includes:



image

timestamp

AI comment



No author shown during competition









5. Voting phase





Simple voting system (e.g. ✔️ or upvote)

Each user can vote once per meme

Voting UI should feel lightweight and fast









6. Reveal + winner





At end of competition:



Voting closes

Winner is revealed

Authors are revealed

AI announces winner with a comment





Example:

“Against all odds, this meme has won. Humanity remains undefeated. For now.”







7. AI participant





The bot should also submit 1 meme per competition

Clearly marked as AI after reveal

Before reveal, it is anonymous like others









🎨 

Visual design direction





Style:



Dark mode by default

Retro-digital aesthetic

Slightly “terminal meets modern UI”





Details:



Black / deep charcoal background

Subtle glow accents (green, blue or purple)

Monospace elements mixed with clean sans-serif

Minimal UI, lots of spacing

Slight grain / noise overlay for texture





Inspiration:



Old terminals

Hacker aesthetics (but ironic, not cringe)

Early internet forums, but clean









🧠 

Tone of voice (important)





The entire app should feel like it’s “alive”.



Tone:



humorous

dry

slightly existential

millennial / internet-native





Avoid:



corporate tone

overly excited startup language





Examples of UI copy:



Instead of:

“Upload your meme”



Use:

“Submit your offering”



Instead of:

“No memes yet”



Use:

“Silence. Concerning.”







🧱 

Pages / structure







Main page (single-page app)





Sections:



Header (theme + countdown timer)

Submission area (visible during submission phase)

Meme feed

Voting UI (enabled during voting phase)









⏱️ 

State logic





App should behave differently depending on time:



Before 09:00 → “Preparing ritual”

09:00–13:00 → Submission open

13:00–16:00 → Voting open

After 16:00 → Reveal + winner









🤖 

AI integration





Use LLM to:



Generate weekly theme

Generate comments for each meme

Generate winner announcement





All AI outputs should follow the defined tone of voice.







🚀 

Goal of MVP





Do NOT overbuild.



Focus on:



ritual

humor

AI personality

simple interaction





This should feel like:

“A weekly internet moment you don’t want to miss.”

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://meme-ritual.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/411fdc75-b312-4ba0-b7f5-413394425b09).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
