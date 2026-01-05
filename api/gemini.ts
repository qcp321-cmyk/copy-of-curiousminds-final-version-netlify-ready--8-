import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

// Model tiers with fallbacks - latest to stable
const FAST_MODELS = ["gemini-3-flash-preview", "gemini-2.0-flash", "gemini-1.5-flash"];
const PRO_MODELS = ["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.0-flash", "gemini-1.5-pro"];

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Resilient generation with automatic fallback - no errors shown to user
async function generateWithFallback(
  ai: any,
  models: string[],
  contents: any,
  config: any = {}
): Promise<any> {
  let lastError: any;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return response;
    } catch (error: any) {
      lastError = error;
      console.log(`Model ${model} failed, trying next fallback...`);
      continue;
    }
  }
  throw lastError;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { action, payload } = req.body;
    const ai = getAI();

    switch (action) {
      case "generateQuickRecap": {
        const { pastTopic, currentTopic } = payload;
        const prompt = `Generate a one-sentence fast recap linking the past study of "${pastTopic}" to the new inquiry of "${currentTopic}". Be extremely concise.`;
        const response = await generateWithFallback(ai, FAST_MODELS, prompt, { temperature: 0.3 });
        return res.json({ result: response.text || "" });
      }

      case "translateEngineResult": {
        const { humanized, summary, targetLanguage, deepDive } = payload;
        const prompt = `Translate the following educational content into ${targetLanguage}. Maintain the academic tone and technical precision. Output ONLY JSON.\nHumanized Briefing: "${humanized}"\nSummary: "${summary}"\n${deepDive ? `Deep Dive: "${deepDive}"` : ""}`;
        const response = await generateWithFallback(ai, FAST_MODELS, prompt, {
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { humanized: { type: Type.STRING }, summary: { type: Type.STRING }, deepDive: { type: Type.STRING } }, required: ["humanized", "summary"] }
        });
        return res.json({ result: JSON.parse(response.text || "{}") });
      }

      case "generateScenario": {
        const { topic, grade, difficulty } = payload;
        const prompt = `Target Audience: Grade ${grade} Student. Topic: "${topic}". Difficulty: ${difficulty}. Create a modern learning module that eliminates rote memorization. STRICT PLAIN TEXT. Output JSON.`;
        const response = await generateWithFallback(ai, PRO_MODELS, prompt, {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { explanation: { type: Type.STRING }, examples: { type: Type.ARRAY, items: { type: Type.STRING } }, role: { type: Type.STRING }, objective: { type: Type.STRING }, scenario: { type: Type.STRING }, steps: { type: Type.ARRAY, items: { type: Type.STRING } }, quote: { type: Type.STRING } }, required: ["explanation", "examples", "role", "objective", "scenario", "steps", "quote"] }
        });
        return res.json({ result: { ...JSON.parse(response.text || "{}"), difficulty } });
      }

      case "engineOceanQuery": {
        const { query, grade, marks, difficulty, isSyllabusMode } = payload;
        const isUniversity = grade === "University" || parseInt(grade) >= 12;
        let syllabusDirective = "";
        if (isSyllabusMode && isUniversity) syllabusDirective = "SYLLABUS MODE ACTIVE: You must include a section called 'CURRICULUM SYNERGY: 8-SEMESTER ROADMAP' where you break down this entire field of study into 8 distinct semesters suitable for a university degree.";
        else if (isSyllabusMode) syllabusDirective = "SYLLABUS MODE ACTIVE: Provide a comprehensive multi-year roadmap for this academic topic suitable for K-12.";

        const prompt = `Perform an Exhaustive Educational Resolution for Query: "${query}".
Parameters: Academic Node: ${grade} (${isUniversity ? "University Level" : "K-12 Level"}), Marks Expectation: ${marks}, Difficulty Bias: ${difficulty}.
${syllabusDirective}
STRICT INSTRUCTIONS:
1. CONTENT DEPTH: Provide a massive, high-fidelity resolution (3x longer than normal).
2. STRUCTURE: Use clear, bold-text style headers: ABSTRACT, CORE MECHANICS, MULTIDIMENSIONAL ANALYSIS, VISUALISATION, ACADEMIC REFERENCES, ${isSyllabusMode ? "CURRICULUM SYNERGY" : ""}.
3. NO SPECIAL CHARACTERS: Do not use #, *, _, [, ], or complex markdown symbols in the content. Use plain text spacing for formatting.
4. VISUALS: Mandatory. Under the VISUALISATION section, provide a highly detailed textual description that will be paired with an AI image.
5. TONALITY: Highest intelligence, university-grade reasoning.
JSON Schema: { "humanized": "Full exhaustive plain-text briefing", "summary": "One-line AI engine meta-perspective" }`;
        const response = await generateWithFallback(ai, PRO_MODELS, prompt, {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { humanized: { type: Type.STRING }, summary: { type: Type.STRING } }, required: ["humanized", "summary"] }
        });
        const parsed = JSON.parse(response.text || "{}");
        return res.json({ result: { humanized: parsed.humanized || "Resolution failed.", summary: parsed.summary || "AI Engine Offline.", grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] } });
      }

      case "deepDiveQuery": {
        const { originalQuery, context } = payload;
        const prompt = `Deep dive: "${originalQuery}". Context: "${context.substring(0, 500)}". NO MARKDOWN. PLAIN TEXT. NO SPECIAL CHARACTERS.`;
        const response = await generateWithFallback(ai, FAST_MODELS, prompt, { temperature: 0.2 });
        return res.json({ result: response.text || "Deep dive failed." });
      }

      case "generateSpeech": {
        // TTS not available - return null gracefully
        return res.json({ result: null });
      }

      case "generateFounderRemark": {
        const { content, type } = payload;
        const prompt = `Analyze: ${content.substring(0, 300)}. Type: ${type}. JSON: {remark, quote}`;
        const response = await generateWithFallback(ai, FAST_MODELS, prompt, {
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { remark: { type: Type.STRING }, quote: { type: Type.STRING } }, required: ["remark", "quote"] }
        });
        return res.json({ result: JSON.parse(response.text || "{}") });
      }

      case "globalChatResponse": {
        const { message, history } = payload;
        const contents = [...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })), { role: "user", parts: [{ text: message }] }];
        const response = await generateWithFallback(ai, FAST_MODELS, contents, { systemInstruction: "CuriousMinds Assistant. Fast, sharp, concise.", temperature: 0.5 });
        return res.json({ result: response.text });
      }

      case "generateAssessmentQuestions": {
        const { details } = payload;
        const prompt = `User: ${JSON.stringify(details)}. 5 deep questions for success prediction. JSON array of strings.`;
        const response = await generateWithFallback(ai, FAST_MODELS, prompt, {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        });
        return res.json({ result: JSON.parse(response.text || "[]") });
      }

      case "generateBeYouPersona": {
        const { details, qaPairs } = payload;
        const prompt = `User: ${JSON.stringify(details)}. Answers: ${JSON.stringify(qaPairs)}.\nMap "Cognitive Gap". Output JSON: roadmap (strategic milestones), systemInstruction (Challenging Future Self), initialGreeting (Empowering).`;
        const response = await generateWithFallback(ai, PRO_MODELS, prompt, {
          responseMimeType: "application/json",
          responseSchema: { type: Type.OBJECT, properties: { roadmap: { type: Type.STRING }, systemInstruction: { type: Type.STRING }, initialGreeting: { type: Type.STRING } }, required: ["roadmap", "systemInstruction", "initialGreeting"] }
        });
        return res.json({ result: JSON.parse(response.text || "{}") });
      }

      case "chatWithPersona": {
        const { systemInstruction, history, message } = payload;
        const contents = [...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })), { role: "user", parts: [{ text: message }] }];
        const response = await generateWithFallback(ai, FAST_MODELS, contents, { systemInstruction: `${systemInstruction}. Challenge intellectual depth. No small talk.`, temperature: 0.7 });
        return res.json({ result: response.text || "Signal interference. Please retry." });
      }

      case "generateMissionImage": {
        // Image generation not available - return empty gracefully
        return res.json({ result: "" });
      }

      case "verifyAdminKey": {
        const { key } = payload;
        const isValid = key === process.env.ADMIN_SECRET_KEY;
        return res.json({ result: isValid });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (error: any) {
    console.error("Gemini API error:", error);
    // Return graceful fallback instead of error to user
    return res.json({ result: null, fallback: true });
  }
}
