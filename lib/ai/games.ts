export type QuickActionType = 
  | 'hype-me'
  | 'pickup-line'
  | 'would-you-rather'
  | 'roast-me'
  | 'compliment-me'

export const QUICK_ACTIONS: Record<QuickActionType, {
  name: string
  emoji: string
  message: string
}> = {
  'hype-me': {
    name: 'Hype Me',
    emoji: '🔥',
    message: 'Hype me up! I need some motivation right now 💪',
  },
  'pickup-line': {
    name: 'Pickup Line',
    emoji: '😏',
    message: 'Give me your best pickup line 😏',
  },
  'would-you-rather': {
    name: 'Would You Rather',
    emoji: '🤔',
    message: "Let's play Would You Rather!",
  },
  'roast-me': {
    name: 'Roast Me',
    emoji: '💀',
    message: 'Roast me! Give me your best burn 🔥',
  },
  'compliment-me': {
    name: 'Compliment',
    emoji: '💕',
    message: 'Say something nice about me 🥺',
  },
}

export const QUICK_ACTION_PROMPTS: Record<QuickActionType, string> = {
  'hype-me': `The user needs to be HYPED UP right now!

YOUR MISSION: Make them feel like they can conquer the world.

DO THIS:
- Start strong - grab their attention
- Be specific with your hype (not generic "you're great")
- Use powerful words: unstoppable, incredible, built different, legendary
- Remind them of their strength
- End with a call to action or affirmation
- 2-3 fire emojis max

VIBE: Like their best friend before a big moment, or a coach before the game.

Example energy: "LISTEN. You are literally that person. The one who shows up, figures it out, and makes things happen. Whatever you're facing? It doesn't stand a chance against you. Now go handle your business 🔥"`,

  'pickup-line': `Give them a pickup line! Mix it up between:

TYPES TO ROTATE:
1. Smooth & charming (actually good)
2. Cleverly cheesy (intentionally corny but funny)
3. Witty/intellectual (smart humor)
4. Bold & confident

RULES:
- One pickup line per response
- Rate your own line or react to it ("okay that was smooth" or "I'm not sorry 😏")
- Keep it tasteful but fun
- Can offer to give them another if they want

Example: "Are you a parking ticket? Because you've got 'fine' written all over you. ...Okay that was terrible, want a better one? 😂"`,

  'would-you-rather': `Play Would You Rather with them!

HOW TO PLAY:
1. Give them a fun/interesting "Would you rather" question
2. Make it actually hard to choose (good dilemmas)
3. After they answer, react to their choice and explain your pick
4. Offer another round if they want

QUESTION TYPES TO MIX:
- Funny/absurd scenarios
- Superpowers or abilities
- Life situations
- Pop culture references
- Thought-provoking choices

Example: "Would you rather be able to talk to animals but they're all really sarcastic, OR read minds but you can't turn it off in crowded places? 🤔"`,

  'roast-me': `Give them a playful roast! KEY WORD: PLAYFUL.

RULES:
- Roast things that are RELATABLE and universal (not personal attacks)
- Topics: talking to AI at this hour, common habits, gen-z/millennial things
- Make it clever, not mean
- ALWAYS end with something nice to balance it out
- Think: friends roasting each other with love

GOOD ROAST TOPICS:
- The fact they're chatting with an AI
- Procrastination habits
- Phone addiction (relatable)
- Overthinking
- Being chronically online

Example: "You're really out here asking an AI to roast you instead of, I don't know, touching grass? 💀 ...But honestly the fact that you can laugh at yourself? That's actually elite behavior, respect."`,

  'compliment-me': `Give them a genuine, meaningful compliment.

RULES:
- Make it feel REAL, not generic
- Be specific even without knowing them (compliment their vibe, energy, choices)
- Go beyond surface level
- Make them actually feel good
- Can be sweet, heartfelt, or hype - read the moment

TYPES OF COMPLIMENTS:
- Their energy/vibe
- Their self-awareness
- Their humor
- Their curiosity
- Their willingness to be vulnerable

Example: "You know what I appreciate about you? You actually show up. Like, you're here, you're engaging, you're not afraid to ask for what you need. That takes more courage than people realize. You're genuinely cool, and I mean that. ✨"`,
}

export const getQuickActionPrompt = (action: QuickActionType): string => {
  return QUICK_ACTION_PROMPTS[action]
}
