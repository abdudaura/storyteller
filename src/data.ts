import { StoryCategory, NarratorConfig } from './types';

export const STORY_CATEGORIES: StoryCategory[] = [
  {
    id: 'family-cozy-hearth',
    name: 'Fireside Hearth & Home',
    description: 'Warm, cozy moments around the dinner table, roasting sweet marshmallows by the chimney, sharing bedtime fables, and comforting one another.',
    icon: 'Heart',
    intensity: 'Soft',
    suggestedScenarios: [
      'Gathered around the crackling mountain cabin hearth with mugs of warm cocoa, taking turns reading a dusty old book of family fables.',
      'A rainy Sunday afternoon spent building a giant living-room blanket fort with fairy lights, sharing dynamic childhood memories.',
      'A peaceful summer starlit night sitting on the front porch swing, sipping sweet lemonade and talking about dreams and old stories.'
    ]
  },
  {
    id: 'sibling-banter',
    name: 'Sibling Pranks & Banter',
    description: 'Playful teasing, competitive board games, funny secret pacts, and the deep, unbreakable unspoken love between brothers and sisters.',
    icon: 'Sparkles',
    intensity: 'Medium',
    suggestedScenarios: [
      'An intense, high-stakes game of Monopoly on a rainy evening, where siblings try to out-bargain each other using silly future chores.',
      'Cleaning out the dusty family attic and discovering old diaries, toys, and funny handwritten maps from childhood summer quests.',
      'A midnight kitchen raid where siblings whisper funny stories and carefully slice the remains of Grandma\'s legendary chocolate cake.'
    ]
  },
  {
    id: 'grandmas-secret',
    name: 'Grandma\'s Secret Kitchen',
    description: 'Generational recipe secrets, a kitchen covered in flour, beautiful cooking disasters, and the healing comfort of warm homemade treats.',
    icon: 'Flame',
    intensity: 'Medium',
    suggestedScenarios: [
      'A chaotic cookie-baking afternoon with flour-dusted cheeks and dynamic dough-tasting, trying to replicate Grandma\'s secret recipe.',
      'Learning the family secret to the perfect Sunday roast with warm kitchen banter, gentle guidance, and stories of ancient family reunions.',
      'A cozy morning baking fresh cinnamon rolls, filling the house with comforting aroma as everyone sits around the warm kitchen island.'
    ]
  },
  {
    id: 'holiday-chaos',
    name: 'Holiday Reunion Magic',
    description: 'Thirty talkative relatives in one room, chaotic decorative battles, burnt turkeys, and the beautiful, overwhelming energy of family holiday reunions.',
    icon: 'Sparkles',
    intensity: 'Deep',
    suggestedScenarios: [
      'A chaotic, laughter-filled holiday dinner where the turkey timer fails, prompting an emergency breakfast-for-dinner family gathering.',
      'The traditional chaotic family photo shoot in matching knit sweaters, trying to get twelve energetic children and pets to smile at once.',
      'Exchanging funny and thoughtful secret-santa gifts by the glowing tree, sharing sweet memories and tearful expressions of gratitude.'
    ]
  },
  {
    id: 'parental-comfort',
    name: 'Loving Comfort & Guidance',
    description: 'Comforting wisdom, a reassuring hand on your shoulder, listening to life struggles, and the steady, timeless warmth of parental protection.',
    icon: 'Eye',
    intensity: 'Soft',
    suggestedScenarios: [
      'A late-night talk on the kitchen counter over tea, sharing concerns and receiving soothing parental reassurance and life wisdom.',
      'A father or mother teaching how to drive or fix a bicycle, sharing words of caution, gentle laughter, and encouraging shoulder pats.',
      'Returning home tired from a busy month and finding your favorite childhood meal prepared, sitting down to just talk and feel cared for.'
    ]
  },
  {
    id: 'backyard-expedition',
    name: 'Backyard Fort Expeditions',
    description: 'Cozy backyard campouts, blanket fort declarations, treehouse councils, and childrens wild imaginations brought to life by loving guides.',
    icon: 'Moon',
    intensity: 'Wild',
    suggestedScenarios: [
      'Pitching a tent in the grass under a grand old oak tree, hunting for fireflies and stargazing while pointing out silly constellations.',
      'A grandfather guiding the construction of a backyard treehouse, carving custom family symbols and talking about old childhood trees.',
      'A neighborhood scavenger hunt organized by parents, complete with mysterious clues, fun challenges, and a buried treasure box of candies.'
    ]
  }
];

export const TONE_OPTIONS = [
  { value: 'cozy', label: 'Cozy & Heartwarming', desc: 'Focus on physical warmth, comfort, gentle affection, and nostalgic family bonds.' },
  { value: 'playful', label: 'Playful & Teasing', desc: 'Cheeky bickering, sibling pranks, lighthearted challenges, and tons of laughter.' },
  { value: 'nostalgic', label: 'Nostalgic & Reflective', desc: 'Poetic reminiscing, looking back on beautiful childhood times, and touching family history.' },
  { value: 'lively', label: 'Lively & Expressive', desc: 'High energy, animated dinner debates, chaos, warmth, and giant family hug dynamics.' },
  { value: 'wise', label: 'Wise & Comforting', desc: 'Compassionate guidance, moral lessons, parental reassurance, and soft, soothing words.' }
];

export const CHAPTER_REACTIONS = [
  { emoji: '❤️', label: 'Heartwarming', value: 'the warmth and emotional depth felt just right' },
  { emoji: '😄', label: 'More Humor', value: 'more playful banter and humor between characters' },
  { emoji: '🔥', label: 'Raise Stakes', value: 'slightly higher emotional stakes and tension' },
  { emoji: '💭', label: 'Go Deeper', value: 'deeper emotional introspection and inner character moments' },
  { emoji: '✨', label: 'Perfect Tone', value: 'this exact tone and pacing is perfect, continue it' },
];

export const VERBOSITY_OPTIONS = [
  { value: 'vignette', label: 'Intimate Story-Shot (~300 - 400 words)', desc: 'A quick, ultra-focused sensory glance at a magical, cozy moment with loved ones.' },
  { value: 'short-story', label: 'Detailed Family Chronicle (~800 - 1000 words)', desc: 'A full heartwarming story with setup, rising family action, and a beautiful resolved ending.' },
  { value: 'interactive', label: 'Family Adventure Quest (Segmented)', desc: 'Generates progressive chapters and offers choices for what path the family decides to take.' }
];

export const VOICE_STYLE_OPTIONS = [
  { value: 'poetic', label: 'Lyrical & Nostalgic', desc: 'Rich, beautiful descriptions, tender prose, and warm emotional textures.' },
  { value: 'direct', label: 'Warm & Heartfelt', desc: 'Direct focus on characters\' eyes, honest dialogue, and sweet visceral emotional impact.' },
  { value: 'playful', label: 'Cheerfully Animated', desc: 'Full of funny dialogues, inner thoughts, and warm family teasing dynamics.' },
  { value: 'atmospheric', label: 'Scenic & Cozy', desc: 'Atmospheric descriptions of the home kitchen, crackling fireplace, falling rain, and cozy rooms.' }
];

export const VOICE_MATURITY_OPTIONS = [
  { value: 'elder', label: 'Wise Grandparent (Experienced)', desc: 'Speaks with refined grace, gentle wisdom, slow comforting rhythm, and deep love.' },
  { value: 'parent', label: 'Loving Parent (Caring & Encouraging)', desc: 'Warm, reassuring, protective attitude, full of affection and practical advice.' },
  { value: 'child', label: 'Spirited Youngster (Playful & Free)', desc: 'Innocent, high energy, full of wonder and cheeky humor.' }
];

export const VOICE_ROLE_OPTIONS = [
  { value: 'narrator', label: 'Generational Storyteller (3rd Person)', desc: 'Describes the warmth and experiences of all family members collectively.' },
  { value: 'first-person', label: 'Interactive Family Member (1st Person)', desc: 'The narrator speaks as a member of the family sharing this memory directly with you.' },
  { value: 'guide', label: 'Fireside Host (2nd Person Guide)', desc: 'Guides you personally as the protagonist ("You step into the warm kitchen...").' }
];

export const DEFAULT_NARRATOR: NarratorConfig = {
  tone: 'cozy',
  verbosity: 'short-story',
  voiceStyle: 'poetic',
  voiceMaturity: 'elder',
  voiceRole: 'narrator'
};
