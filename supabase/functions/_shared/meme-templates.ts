// Shared meme template definitions for bot-submit and demo-generate
// All IDs verified against https://api.memegen.link/templates

export interface MemeTemplate {
  id: string;
  lines: number;
  description: string;
}

export const MEME_TEMPLATES: MemeTemplate[] = [
  // Classic formats
  { id: "drake", lines: 2, description: "Drakeposting: top = bad/boring, bottom = preferred alternative" },
  { id: "fine", lines: 2, description: "This Is Fine: dog in burning room. Line 1 = situation, Line 2 = denial" },
  { id: "db", lines: 3, description: "Distracted Boyfriend: Line 1 = distraction, Line 2 = boyfriend, Line 3 = girlfriend" },
  { id: "buzz", lines: 2, description: "Buzz Lightyear 'X everywhere': Line 1 = subject, Line 2 = 'X everywhere'" },
  { id: "rollsafe", lines: 2, description: "Roll Safe think about it: Line 1 = flawed premise, Line 2 = 'clever' conclusion" },
  { id: "facepalm", lines: 2, description: "Facepalm: Line 1 = frustrating thing, Line 2 = why it's dumb" },
  { id: "exit", lines: 3, description: "Left Exit 12 Off Ramp: Line 1 = highway (sensible choice), Line 2 = exit (bad choice), Line 3 = car swerving to exit" },
  { id: "doge", lines: 2, description: "Doge: Line 1 = 'much X', Line 2 = 'very Y / wow'" },
  
  // Popular modern formats
  { id: "pooh", lines: 2, description: "Tuxedo Winnie the Pooh: Line 1 = basic version, Line 2 = fancy/pretentious version" },
  { id: "cmm", lines: 1, description: "Change My Mind: Line 1 = controversial hot take" },
  { id: "panik-kalm-panik", lines: 3, description: "Panik Kalm Panik: Line 1 = panic situation, Line 2 = reassurance, Line 3 = worse realization" },
  { id: "astronaut", lines: 4, description: "Always Has Been: Line 1 = 'Wait, it's all X?', Line 2 = empty, Line 3 = 'Always has been', Line 4 = empty" },
  { id: "mordor", lines: 2, description: "One Does Not Simply: Line 1 = 'One does not simply', Line 2 = thing that's hard to do" },
  { id: "pigeon", lines: 3, description: "Is This a Pigeon?: Line 1 = butterfly (wrong thing), Line 2 = person (who's confused), Line 3 = 'Is this X?'" },
  { id: "same", lines: 3, description: "They're The Same Picture: Line 1 = thing A, Line 2 = thing B, Line 3 = 'They're the same picture'" },
  { id: "gru", lines: 4, description: "Gru's Plan: Line 1 = step 1, Line 2 = step 2, Line 3 = unexpected bad outcome, Line 4 = same bad outcome (realization)" },
  
  // Reaction formats
  { id: "spongebob", lines: 2, description: "Mocking Spongebob: Line 1 = what someone says, Line 2 = mocking version in alternating caps" },
  { id: "stonks", lines: 2, description: "Stonks: Line 1 = dumb financial/life decision, Line 2 = 'stonks' or ironic success" },
  { id: "fry", lines: 2, description: "Futurama Fry: 'Not sure if X or Y'. Line 1 = 'not sure if X', Line 2 = 'or Y'" },
  { id: "success", lines: 2, description: "Success Kid: Line 1 = setup, Line 2 = small but satisfying win" },
  { id: "harold", lines: 2, description: "Hide the Pain Harold: Line 1 = painful situation, Line 2 = forced positive spin" },
  { id: "woman-cat", lines: 2, description: "Woman Yelling at Cat: Line 1 = angry accusation, Line 2 = cat's calm response" },
  { id: "kermit", lines: 2, description: "But That's None of My Business: Line 1 = shady observation, Line 2 = 'but that's none of my business'" },
  { id: "interesting", lines: 2, description: "Most Interesting Man: Line 1 = setup, Line 2 = 'I don't always X, but when I do, Y'" },
  
  // More classics
  { id: "slap", lines: 2, description: "Will Smith Slap: Line 1 = thing being said, Line 2 = angry response" },
  { id: "khaby-lame", lines: 2, description: "Khaby Lame Shrug: Line 1 = overcomplicated approach, Line 2 = obvious simple solution" },
  { id: "home", lines: 3, description: "We Have Food at Home: Line 1 = what you want, Line 2 = 'we have X at home', Line 3 = the sad version at home" },
  { id: "handshake", lines: 3, description: "Epic Handshake: Line 1 = group A, Line 2 = thing they agree on, Line 3 = group B" },
  { id: "wkh", lines: 3, description: "Who Killed Hannibal?: Line 1 = person who caused problem, Line 2 = 'why would X do this?', Line 3 = the victim" },
  { id: "both", lines: 2, description: "Why Not Both?: Line 1 = two options presented, Line 2 = 'why not both?'" },
];

export const BOT_ALIASES = [
  "pixel_pusher", "dank_prophet", "meme_intern_42", "ctrl_alt_defeat",
  "entropy_enjoyer", "the_algorithm", "null_pointer", "cache_money",
  "sudo_memer", "bit_flipper", "stack_overflow_survivor", "git_blamed",
  "404_creativity", "kernel_panic_at_disco", "segfault_sally",
  "localhost_3000", "rm_rf_feelings", "deploy_on_friday", "css_is_awesome",
  "undefined_behavior",
];

export function encodeMemeText(text: string): string {
  return text
    .replace(/_/g, "__")
    .replace(/ /g, "_")
    .replace(/\?/g, "~q")
    .replace(/%/g, "~p")
    .replace(/#/g, "~h")
    .replace(/\//g, "~s")
    .replace(/"/g, "''")
    .replace(/-/g, "--");
}

export function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
