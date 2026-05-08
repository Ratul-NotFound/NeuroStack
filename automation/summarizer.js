/**
 * NeuroStack Quad-Provider Summarizer
 * Chain: Gemini 2.0 Flash → Groq Llama → Together AI → OpenRouter
 * Each provider is tested and verified before falling through.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// ── Provider Initialization ──────────────────────────────────────────────────

const geminiKey = process.env.GEMINI_API_KEY;
const groqKey   = process.env.GROQ_API_KEY;
const togetherKey = process.env.TOGETHER_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
const geminiModel = genAI ? genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',   // ✅ Correct model name
  generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
}) : null;

const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;

console.log(`🤖 AI Providers loaded:
   Gemini 2.0: ${geminiKey ? '✅' : '❌ Missing GEMINI_API_KEY'}
   Groq:       ${groqKey ? '✅' : '❌ Missing GROQ_API_KEY'}
   Together:   ${togetherKey ? '✅' : '❌ Missing TOGETHER_API_KEY'}
   OpenRouter: ${openrouterKey ? '✅' : '❌ Missing OPENROUTER_API_KEY'}`);

// ── Heuristic Classifier ─────────────────────────────────────────────────────

function heuristicClassify(title, tagList, categoryHint) {
  const text = (title + ' ' + tagList).toLowerCase();
  if (/\b(react|vue|angular|css|tailwind|html|javascript|js|typescript|ts|node|express|nextjs|frontend|backend|ui|ux|figma|web|website|api|database|sql|mongodb|postgres|vercel|netlify|supabase|auth|stripe|prisma|graphql|rest|socket|pwa|responsive|flexbox|grid|sass|component|hook|state|redux|vite|webpack|npm|yarn|deno|bun)\b/.test(text)) return 'web-development';
  if (/\b(machine learning|ml|pytorch|tensorflow|scikit|pandas|numpy|data science|training|model|dataset|inference|cuda|gpu|tensor|keras|transformer|bert|cnn|rnn|lstm|regression|clustering|classifier|accuracy|backprop|weights)\b/.test(text)) return 'machine-learning';
  if (/\b(python|rust|cpp|c\+\+|java|golang|ruby|php|kotlin|swift|coding|tutorial|algorithm|dsa|leetcode|architecture|linux|terminal|shell|git|docker|kubernetes|devops|aws|azure|gcp|cloud|serverless|microservice|security|bug|fix)\b/.test(text)) return 'programming';
  if (/\b(ai|artificial intelligence|llm|gpt|claude|gemini|llama|agent|prompt|neural|chatbot|openai|anthropic|stable diffusion|copilot|mistral|grok|deepseek|agentic|rag|vector|embeddings|ollama)\b/.test(text)) return 'ai';
  if (/\b(hardware|chip|processor|space|nasa|spacex|gadget|iphone|android|breakthrough|future|industry|electric|ev|tesla|energy|battery|robot|drone|iot|quantum|crypto|blockchain|ar|vr|metaverse)\b/.test(text)) return 'new-tech';
  if (categoryHint) return categoryHint;
  return 'general';
}

// ── Individual Provider Calls ────────────────────────────────────────────────

async function tryGemini(prompt) {
  if (!geminiModel) throw new Error('Gemini not configured');
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  if (!text || text.length < 20) throw new Error('Gemini returned empty response');
  return text;
}

async function tryGroq(prompt) {
  if (!groq) throw new Error('Groq not configured');
  const chat = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    max_tokens: 1024
  });
  const text = chat.choices[0].message.content;
  if (!text || text.length < 20) throw new Error('Groq returned empty response');
  return text;
}

async function tryTogether(prompt) {
  if (!togetherKey) throw new Error('Together AI not configured');
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${togetherKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3-8b-chat-hf',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1024
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Together AI HTTP ${response.status}: ${data.error?.message || 'unknown'}`);
  if (!data.choices?.[0]?.message?.content) throw new Error('Together AI returned no content');
  return data.choices[0].message.content;
}

async function tryOpenRouter(prompt) {
  if (!openrouterKey) throw new Error('OpenRouter not configured');
  const models = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemma-2-9b-it:free',
    'microsoft/phi-3-medium-128k-instruct:free'
  ];
  for (const modelId of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://neurostack.vercel.app',
          'X-Title': 'NeuroStack AI Hub'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch { continue; }
  }
  throw new Error('All OpenRouter models failed');
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

export async function summarizeContent(title, description, content, allowedCategories, sourceType = 'article', categoryHint = '', tags = []) {
  const contentBody = [description, content].filter(Boolean).join('\n\n').substring(0, 4000);
  const tagList = Array.isArray(tags) ? tags.join(', ') : '';
  const heuristicCategory = heuristicClassify(title, tagList, categoryHint);

  if (heuristicCategory) {
    console.log(`   💡 Heuristic: ${heuristicCategory}`);
  }

  const prompt = `You are a professional technology editor. Analyze this ${sourceType} and return ONLY valid JSON.

TITLE: ${title}
TAGS: ${tagList || 'None'}
CONTENT: ${contentBody || '[No content provided]'}

AVAILABLE CATEGORY IDs (pick exactly one): ai, machine-learning, web-development, programming, new-tech, general
PREFERRED CATEGORY: ${heuristicCategory || categoryHint || 'auto-detect'}

Return ONLY this JSON (no markdown, no explanation):
{"summary": "A 3-5 sentence professional summary in markdown","category": "exact_id_from_list"}`;

  const providers = [
    { name: 'Gemini 2.0', fn: tryGemini },
    { name: 'Groq Llama', fn: tryGroq },
    { name: 'Together AI', fn: tryTogether },
    { name: 'OpenRouter', fn: tryOpenRouter }
  ];

  for (const provider of providers) {
    try {
      console.log(`   🤖 Trying ${provider.name}...`);
      const resultText = await provider.fn(prompt);
      const parsed = parseAIResponse(resultText, allowedCategories);
      console.log(`   ✅ Success via ${provider.name}`);
      return {
        summary: parsed.summary,
        category: heuristicCategory || parsed.category
      };
    } catch (err) {
      console.log(`   ⚠️  ${provider.name} failed: ${err.message}`);
    }
  }

  // All providers exhausted — use intelligent fallback
  console.log(`   ❌ All AI providers failed. Using intelligent fallback.`);
  const fallbackCategory = heuristicCategory || (allowedCategories.includes(categoryHint) ? categoryHint : 'general');
  return {
    summary: `## 📄 ${title}\n\n${description?.substring(0, 500) || 'No description available.'}\n\n*⚠️ AI summary pending — will be auto-repaired.*`,
    category: fallbackCategory
  };
}

// ── Response Parser ──────────────────────────────────────────────────────────

function parseAIResponse(text, allowedCategories) {
  let jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace === -1) throw new Error('No JSON object found in response');
  jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  const parsed = JSON.parse(jsonText);

  if (!parsed.summary || parsed.summary.length < 10) throw new Error('Summary is too short or missing');

  const nameToId = {
    'artificial intelligence': 'ai', 'web development': 'web-development',
    'web dev': 'web-development', 'machine learning': 'machine-learning',
    'new tech': 'new-tech', 'programming': 'programming', 'general': 'general'
  };
  let category = parsed.category?.toLowerCase().trim();
  if (nameToId[category]) category = nameToId[category];

  return {
    summary: parsed.summary.trim(),
    category: allowedCategories.includes(category) ? category : allowedCategories[0]
  };
}
