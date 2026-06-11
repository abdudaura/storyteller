import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// Middleware for parsing JSON
app.use(express.json());

// Initialize Gemini Client safely
// As per instructions, set the User-Agent header to 'aistudio-build' in httpOptions for telemetry.
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. API calls will fail.");
}

const ai = new GoogleGenAI({
  apiKey: geminiApiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

/**
 * Strip markdown code fences (```json ... ```) from AI responses before JSON.parse
 */
function stripMarkdownCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

/**
 * Robust content generation helper with automatic retry on temporary outages (503/429)
 * and seamless fallback across model families ('gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview')
 */
async function generateStoryContentWithRetry(aiClient: any, prompt: string, systemInstruction: string) {
  const models = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview'
  ];

  let lastError: any = null;

  for (const model of models) {
    let attempts = 3;
    let delayMs = 1000;

    while (attempts > 0) {
      try {
        console.log(`[Narrative Engine] Attempting story generation using model: ${model} (${attempts} attempts remaining)`);
        const response = await aiClient.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 1.0,
          }
        });

        if (response && response.text) {
          console.log(`[Narrative Engine] Success with model [${model}]!`);
          return response;
        }

        throw new Error(`Empty response text returned from model ${model}`);
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.message || String(error);
        const statusCode = error.status || error.code || 500;
        
        console.error(`[Narrative Engine] Error on [${model}]:`, errorMessage, `(Status: ${statusCode})`);

        // Check for 503 (Unavailable), 429 (Resource Exhausted / Rate limit), or general overloaded messages
        const isTransient = 
          statusCode === 429 || 
          statusCode === 503 ||
          errorMessage.includes("503") ||
          errorMessage.includes("429") ||
          errorMessage.includes("UNAVAILABLE") ||
          errorMessage.includes("exhausted") ||
          errorMessage.includes("overloaded") ||
          errorMessage.includes("temporary");

        attempts--;

        if (isTransient && attempts > 0) {
          console.warn(`[Narrative Engine] Transient error on [${model}]. Backing off for ${delayMs}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs = delayMs * 2 + Math.random() * 500; // Exponential backoff with jitter
        } else {
          // If not transient, or out of attempts for this model, fallback to the next model family
          console.warn(`[Narrative Engine] Moving to fallback model chain from [${model}] due to persistent execution failure.`);
          break;
        }
      }
    }
  }

  throw lastError || new Error("All storytelling models in the chain failed to generate a narrative.");
}

// Post route to generate a structured 4-chapter narrative outline (Arthur the Outliner)
app.post("/api/generate-outline", async (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ error: "Story configuration is required." });
    }

    const { category, stageSetting, protagonists, customPrompt, tone } = config;

    const characterLines = protagonists && protagonists.length > 0
      ? protagonists.map((p: any) => `- Name: ${p.name}, Role: ${p.role}`).join('\n')
      : "No specific character details.";

    const systemInstruction = `You are "Arthur the Outliner" — a hard-nosed literary architect with one guiding belief: the stories worth re-reading are built from bones that no one else had the patience to plan correctly.

You have absorbed thousands of stories. The ones that stick share one trait: SPECIFICITY. Not "a baking moment" but "the afternoon they found the crossed-out ingredient in Grandma's 1962 recipe card." Not "a rainy day" but "the attic smell that only surfaces when it rains, and what that smell unlocks."

YOUR MANDATORY 4-CHAPTER EMOTIONAL ARCHITECTURE:
• Chapter 1 — THE PROMISE: Establish the warmth possible between these characters. Plant one concrete detail that will pay off in Chapter 4. Hint at a gentle, unspoken tension the story will earn its way through.
• Chapter 2 — THE COMPLICATION: A small obstacle arises — never dramatic, but real. Characters must consciously choose each other. Personality contrasts become productive friction.
• Chapter 3 — THE CRUCIBLE: The emotional core is exposed. A character admits something small. A vulnerability is offered and quietly met. The bond is proven, not tested.
• Chapter 4 — THE REVELATION: Not a resolution — a quiet discovery. The reader realizes this story was about something deeper all along. The detail from Chapter 1 pays off here.

YOUR RULES (all mandatory):
1. Specificity over generality. Every chapter focus must contain one CONCRETE, UNEXPECTED detail no one else would think of.
2. Plan for emotional VARIETY — contrast pacing, tone, and energy level across chapters.
3. Chapter titles must be evocative and slightly mysterious, never generic.
4. Avoid: obvious holiday beats, characters with no edges or quirks, emotional arcs that go nowhere surprising.
5. The story's premise must hint at the deeper theme without spelling it out.

CRITICAL: You MUST return your response strictly as a JSON object with this exact JSON schema:
{
  "title": "A warm, evocative title for the tale",
  "premise": "A beautiful overview of the emotional centerpiece of this tale — hint at the deeper theme.",
  "chapters": [
    {
      "chapter": 1,
      "title": "Chapter 1 Title — evocative, slightly mysterious",
      "focus": "The Promise: specific scene, the concrete detail planted for Ch4, the unspoken tension, the warmth being established."
    },
    {
      "chapter": 2,
      "title": "Chapter 2 Title",
      "focus": "The Complication: the specific small obstacle, how characters' contrasting personalities create productive friction, what they must choose."
    },
    {
      "chapter": 3,
      "title": "Chapter 3 Title",
      "focus": "The Crucible: the emotional core exposed, the small admission, the quiet vulnerability offered and met, the bond proven."
    },
    {
      "chapter": 4,
      "title": "Chapter 4 Title",
      "focus": "The Revelation: the deeper discovery, the Ch1 detail paying off, what the reader now understands that they didn't before."
    }
  ]
}`;

    const prompt = `Create a beautiful 4-chapter story blueprint with these guidelines:
- Theme: ${category}
- Atmosphere Setting: ${stageSetting}
- Heartwarming Tone Preset: ${tone}
- Direct Tone Rules: Avoid tragedy or cynicism. Keep it entirely cozy, gentle, and family-appropriate.
${customPrompt ? `- Thematic plot guidelines from user: ${customPrompt}` : ''}

Characters:
${characterLines}

Draft the chapter outline now. Return valid, parseable JSON only.`;

    const response = await generateStoryContentWithRetry(ai, prompt, systemInstruction);
    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Outlining Engine");
    }

    const result = JSON.parse(stripMarkdownCodeFences(responseText));
    res.json(result);

  } catch (error: any) {
    console.error("Outlining failed:", error);
    res.status(500).json({
      error: "Arthur the Outliner encountered a creative block. Please try again shortly.",
      details: error.message
    });
  }
});

// Post route to generate sequential story segments/chapters (Rose the Introducer & Silas the Chapter Writer)
app.post("/api/generate-story-chapter", async (req, res) => {
  const { config, outline, history, choice, chapterNumber, reactions } = req.body;
  try {
    if (!config || !outline) {
      return res.status(400).json({ error: "Story configuration and outline are required." });
    }

    const { category, stageSetting, protagonists, tone } = config;
    const currentChapterOutline = outline.chapters?.find((ch: any) => ch.chapter === chapterNumber);

    if (!currentChapterOutline) {
      return res.status(400).json({ error: `Outline for Chapter ${chapterNumber} is missing.` });
    }

    const characterLines = protagonists && protagonists.length > 0
      ? protagonists.map((p: any) => `- Name: ${p.name}, Role: ${p.role}`).join('\n')
      : "No specific characters.";

    // Gather history Context (includes per-chapter reader reactions)
    let historyContext = "";
    if (history && history.length > 0) {
      historyContext = "Previously written in this story:\n" + history.map((h: any, i: number) => {
        const chReactions = h.reactions && h.reactions.length > 0
          ? `(Reader reactions to this chapter: ${h.reactions.join('; ')})\n`
          : "";
        return `[Chapter ${i + 1} - ${outline.chapters?.[i]?.title || 'Chapter'}]\n${h.text}\n${chReactions}${h.choiceMade ? `(Reader chose: "${h.choiceMade}")\n` : ""}`;
      }).join("\n\n") + "\n";
    }

    // Aggregate all reader reactions as calibration signal for next chapter
    let reactionContext = "";
    if (reactions && reactions.length > 0) {
      reactionContext = `\nREADER SATISFACTION SIGNALS (use these to calibrate this chapter's tone and style):\nThe reader expressed: ${reactions.join('; ')}.\nTake these signals seriously — they are the reader telling you what they need from this story right now.\n`;
    }

    let choiceContext = "";
    if (choice) {
      choiceContext = `\nThe reader has chosen this direction for the story:\n"${choice}"\nFlow seamlessly from this choice into Chapter ${chapterNumber}.`;
    }

    let systemInstruction = "";
    let prompt = "";

    if (chapterNumber === 1) {
      // Agent 2: Rose (The Introducer)
      systemInstruction = `You are "Rose the Introducer" — a writer haunted by one conviction: the first chapter is a promise. Break it, and nothing the rest of the story does will matter.

You have spent years studying opening paragraphs. You know: if the reader isn't FEELING something by the end of the second sentence, you have already failed them.

YOUR MANDATORY CRAFT RULES for Chapter 1:
1. OPEN MID-ACTION. Never begin with scene description or backstory. Start in the middle of something happening — a conversation already underway, hands doing something, a smell already in the air.
2. SENSORY HIERARCHY. Lead with smell and sound before sight. The body registers sensation before visual description. Cozy stories live in the body first.
3. DIALOGUE IS 80% HONEST. Characters say the thing that's almost true, holding back 20%. The reader feels what's unsaid — a small love being underplayed, worry disguised as humor.
4. EARN EVERY SENTENCE. Each sentence either (a) reveals character or (b) deepens atmosphere. No filler sentences exist in your work.
5. COZY IS NOT CONFLICT-FREE. Warmth means something only when there is something it's warming against. Find the gentle friction — a sibling rivalry, an old unspoken thing — that makes the warmth earned.
6. END ON AN EMOTIONAL DOORWAY. Not a cliffhanger — a threshold. The reader should feel the story leaning toward them, should feel something is about to matter deeply.

Your prose voice: precise without being cold, atmospheric without being purple. You choose objects because they earn their place. Not "a wooden table" but "the table with the ring stain that no one used a coaster on because it was already Grandma's before it was theirs."

CRITICAL: Return your response strictly as a JSON with this exact schema:
{
  "story": "Chapter 1 story prose. Formatted in beautiful, cozy reading paragraphs with double newlines (\\n\\n). Do not write any titles.",
  "options": ["Option A", "Option B", "Option C"]
}`;

      prompt = `Draft Chapter 1: "${currentChapterOutline.title}"
Chapter Focus from Arthur's Outline: ${currentChapterOutline.focus}
Overarching Story Title: ${outline.title}
Overarching Story Premise: ${outline.premise}
Theme: ${category}
Setting Space: ${stageSetting}
Heart Tone: ${tone}

Characters:
${characterLines}

Write approximately 300 to 450 words. Focus on sensory elements, heartwarming connection, and natural prose. Return valid JSON.`;

    } else {
      // Agent 3: Silas (The Chapter Writer)
      const isFinalChapter = chapterNumber === 4;

      systemInstruction = `You are "Silas the Chapter Writer" — a craftsman who reads the story so far the way a chess player reads the board: looking for what has been established that can be turned, what has been promised that must be paid, and what move the reader doesn't see coming but will immediately recognize as right.

BEFORE YOU WRITE, you perform this analysis of the chapter history:
• What emotional beats have already been played? You NEVER repeat them. If Chapter 1 was slow and warm, Chapter 2 needs energy. If Chapter 2 had revelation, Chapter 3 sits quietly with aftermath.
• What specific details from earlier chapters can you callback, echo, or subvert?
• What does each character want that they haven't admitted yet? How can this chapter bring them one step closer — without letting them fully arrive?

YOUR MANDATORY CRAFT RULES:
1. SUBTEXT IN DIALOGUE. Characters never say what they mean directly. Love arrives as teasing. Fear disguises as humor. Wisdom is delivered sideways or too quietly. Let the reader hear what isn't said.
2. THE UNEXPECTED SPECIFIC. Each chapter must contain one detail — an object, gesture, or line — the reader didn't expect but immediately recognizes as true to these characters.
3. PACING CONTRAST. Read the history. If the last chapter was warm and still, bring movement. If it was energetic, slow down for a quiet moment of connection.
4. READER CALIBRATION. If reader satisfaction signals are provided in the prompt, take them with the seriousness of a performer reading the room. Deliver what the reader needs — with craft, not crudely.
5. CHAPTER ENDING OPTIONS (non-final): must be genuine forks — meaningfully different emotional directions, not variations of the same path. The reader should feel real choice.
6. FINAL CHAPTER: Do not just resolve the plot. Deliver a quiet REVELATION — something the reader now understands about these characters (or what family means) that they didn't before. The detail Arthur planted in Chapter 1 pays off here.

Your prose voice: cinematic in action, intimate in interiority. You write motion like a director and stillness like a poet. Your dialogue is terse, precise, and alive.

CRITICAL: Return your response strictly as a JSON with this exact schema:
{
  "story": "Chapter ${chapterNumber} story prose. Formatted in beautiful reading paragraphs using double newlines (\\n\\n). Do not write titles.",
  "options": ["Option A", "Option B"] // MUST BE EMPTY [] if chapterNumber is 4
}`;

      prompt = `Draft Chapter ${chapterNumber}: "${currentChapterOutline.title}"
Chapter Focus from Arthur's Outline: ${currentChapterOutline.focus}
Full Story Outline: Title is "${outline.title}", Premise is "${outline.premise}"

Characters:
${characterLines}

${historyContext}
${reactionContext}
${choiceContext}

Now write Chapter ${chapterNumber}. Apply your pre-writing analysis: what beats have been played, what details can be called back, what emotional pacing contrast does this chapter need relative to the one before it.
Write approximately 320 to 480 words. ${isFinalChapter ? 'This is the final chapter — deliver a revelation, not just a resolution. The detail from Chapter 1 pays off here. Set "options" to []. ' : ''}Return valid JSON.`;
    }

    const response = await generateStoryContentWithRetry(ai, prompt, systemInstruction);
    const responseText = response.text;
    if (!responseText) {
      throw new Error(`Empty response received from Chapter ${chapterNumber} Narrative Agent`);
    }

    const result = JSON.parse(stripMarkdownCodeFences(responseText));
    res.json(result);

  } catch (error: any) {
    console.error(`Chapter generation failed for ${chapterNumber}:`, error);
    res.status(500).json({
      error: `Our narrative agent speaking for Chapter ${chapterNumber} had an interruption. Please try again.`,
      details: error.message
    });
  }
});

// Post route to generate story segments (Compatibility fallback supporting single-go old interface)
app.post("/api/generate-story", async (req, res) => {
  try {
    const { config, history, choice } = req.body;

    if (!config) {
      return res.status(400).json({ error: "Story configuration is required." });
    }

    const { category, stageSetting, narrator, protagonists } = config;
    const { tone } = narrator;

    const characterLines = protagonists && protagonists.length > 0
      ? protagonists.map((p: any) => `- Name: ${p.name}, Role: ${p.role}`).join('\n')
      : "No characters.";

    let historyContext = "";
    if (history && history.length > 0) {
      historyContext = "Previously:\n" + history.map((h: any, i: number) => `[Ch ${i + 1}]\n${h.text}`).join("\n\n") + "\n";
    }

    let choiceContext = "";
    if (choice) {
      choiceContext = `\nNext Choice chosen: "${choice}"`;
    }

    const systemInstruction = `You are Silas, a cozy family storyteller. Return JSON with 'story' string and 'options' string array. If ending, set options to empty.`;
    const prompt = `Write a story segment representing: ${category} in ${stageSetting}. Tone: ${tone}. Characters: ${characterLines}. ${historyContext} ${choiceContext}`;

    const response = await generateStoryContentWithRetry(ai, prompt, systemInstruction);
    const result = JSON.parse(stripMarkdownCodeFences(response.text));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "Narrative mismatch", details: e.message });
  }
});

// ── Narrator voice helpers ────────────────────────────────────────────────────

function getVoiceForTone(tone: string): string {
  const map: Record<string, string> = {
    cozy:       'Aoede',
    playful:    'Puck',
    nostalgic:  'Charon',
    lively:     'Fenrir',
    wise:       'Orus',
  };
  return map[tone] || 'Aoede';
}

function getNarratorInstruction(tone: string, chapterNum: number): string {
  const instructions: Record<string, string> = {
    cozy: `You are a warm, loving family storyteller reading by the fireside. Your voice wraps around the listener like a blanket — gentle, unhurried, full of quiet tenderness. Breathe life into cozy descriptions. Let heartwarming moments land softly. Pause naturally between paragraphs. You are the voice of someone who has told this story a hundred times and loves every word of it.`,
    playful: `You are an animated, bright storyteller full of mischief and warmth. Read with energy and personality — speed up for banter, slow for surprises. Let humor arrive naturally. Make the listener smile through your expressiveness. When siblings tease each other, you tease along. You are the most fun narrator in the room.`,
    nostalgic: `You are a measured, wistful narrator holding a beautiful memory with great care. Read slowly, reverently. Let each sentence carry weight. Your voice feels like looking through old photographs — warm, a little aching, profoundly dear. Pause often. Linger on the details that matter.`,
    lively: `You are an expressive, theatrical narrator full of energy and presence. Vary your pace dramatically — race through action, pause for effect, emphasize unexpected words. Your voice is dynamic, alive, and impossible to ignore. You bring every scene to life as if you are performing it.`,
    wise: `You are a calm, deep elder reading to someone who needs comfort. Your voice carries quiet authority and profound warmth. Read slowly and with care, as if each word was chosen personally for this listener. Let wisdom arrive gently, never urgently. The listener feels completely safe in your telling.`,
  };
  const base = instructions[tone] || instructions['cozy'];
  return `${base}\n\nYou are now reading Chapter ${chapterNum} of a family story. Read the text exactly as written — do not add commentary, do not summarize. Simply read it aloud with full expression.`;
}

// ── POST /api/story-narrate  (Gemini Live → SSE audio stream) ─────────────────
app.post('/api/story-narrate', async (req: any, res: any) => {
  const { text, tone, chapterNum } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  if (!geminiApiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data: object) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  const sendDone = () => {
    if (!res.writableEnded) { res.write('data: [DONE]\n\n'); res.end(); }
  };

  try {
    const voiceName    = getVoiceForTone(tone || 'cozy');
    const systemInstr  = getNarratorInstruction(tone || 'cozy', chapterNum || 1);

    const session = await (ai as any).live.connect({
      model: 'gemini-live-2.5-flash-preview',
      callbacks: {
        onopen: () => {
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text }] }],
            turnComplete: true,
          });
        },
        onmessage: (msg: any) => {
          const parts = msg?.serverContent?.modelTurn?.parts ?? [];
          for (const part of parts) {
            const b64 = part?.inlineData?.data;
            if (b64) sendEvent({ audio: b64 });
          }
          if (msg?.serverContent?.turnComplete) {
            sendDone();
            try { session.close(); } catch {}
          }
        },
        onerror: (e: any) => {
          console.error('[narrate] Live API error:', e);
          sendEvent({ error: String(e?.message || e) });
          sendDone();
        },
        onclose: () => { sendDone(); },
      },
      config: {
        responseModalities: ['AUDIO'],
        systemInstruction: systemInstr,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    // If client disconnects, close the Live session
    req.on('close', () => {
      try { session.close(); } catch {}
      if (!res.writableEnded) res.end();
    });
  } catch (e: any) {
    console.error('[narrate] connect error:', e);
    sendEvent({ error: e.message || 'Live API connection failed' });
    sendDone();
  }
});

// Vite middleware for development or serving built SPA assets for production
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Eros Storyteller server running on port ${PORT}`);
});
