/**
 * NeuroStack Triple-Provider Summarizer
 * 1. Gemini 3 (Primary)
 * 2. Groq (Fast Fallback)
 * 3. OpenRouter (Unlimited Free Fallback)
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Initialize Providers
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-3-flash-preview',
  generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
});

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

function heuristicClassify(title, tagList, categoryHint) {
  const text = (title + ' ' + tagList).toLowerCase();
  
  // 1. Web Development (High Priority Keywords)
  if (/\b(react|vue|angular|css|tailwind|html|javascript|js|typescript|ts|node|express|nextjs|frontend|backend|ui|ux|figma|web|website|api|database|sql|mongodb|postgres|strapi|vercel|netlify|supabase|clerk|auth|stripe|prisma|graphql|rest|soap|socket|webrtc|pwa|responsive|flexbox|grid|sass|less|styled|component|prop|hook|state|redux|zod|tanstack|vite|webpack|babel|npm|yarn|pnpm|deno|bun)\b/.test(text)) {
    return 'web-development';
  }
  
  // 2. Machine Learning (High Priority Keywords)
  if (/\b(machine learning|ml|pytorch|tensorflow|scikit|pandas|numpy|data science|training|model|dataset|inference|cuda|gpu|tensor|keras|transformer|bert|cnn|rnn|lstm|regression|clustering|classifier|accuracy|precision|recall|f1|overfitting|backprop|weights|bias)\b/.test(text)) {
    return 'machine-learning';
  }

  // 3. Programming (High Priority Keywords)
  if (/\b(python|rust|cpp|c\+\+|java|golang|ruby|php|kotlin|swift|coding|tutorial|algorithm|dsa|leetcode|pattern|architecture|linux|terminal|shell|git|docker|kubernetes|k8s|devops|aws|azure|gcp|cloud|serverless|microservice|clean code|refactor|test|unit|integration|ci|cd|jenkins|github|gitlab|action|workflow|env|config|log|monitor|observability|security|hack|exploit|bug|fix|version|dep|module|package|lib|sdk|framework|runtime|engine)\b/.test(text)) {
    return 'programming';
  }

  // 4. AI (Only if specifically AI)
  if (/\b(ai|artificial intelligence|llm|gpt|claude|gemini|llama|agent|prompt|neural|chatbot|openai|anthropic|stable diffusion|midjourney|dall-e|copilot|perplexity|mistral|grok|deepseek|deepseek-r1|agentic|rpa|automation|rag|vector|embeddings|ollama|lm-studio)\b/.test(text)) {
    return 'ai';
  }

  // 5. New Tech
  if (/\b(hardware|chip|processor|space|nasa|spacex|gadget|iphone|android|breakthrough|news|future|industry|electric|ev|tesla|energy|battery|robot|drone|iot|quantum|crypto|blockchain|web3|ar|vr|mr|metaverse|vision pro)\b/.test(text)) {
    return 'new-tech';
  }

  // 6. Source-Based Fallback (FORCE THE SECTOR)
  if (categoryHint) return categoryHint;

  return 'general';
}

/**
 * Main summarization entry point
 */
export async function summarizeContent(title, description, content, allowedCategories, sourceType = 'article', categoryHint = '', tags = []) {
  const contentBody = [description, content].filter(Boolean).join('\n\n').substring(0, 4000);
  const tagList = Array.isArray(tags) ? tags.join(', ') : '';
  
  // STAGE 1: HEURISTIC CHECK (Fast & 100% Accurate for Keywords)
  const heuristicCategory = heuristicClassify(title, tagList, categoryHint);
  if (heuristicCategory && allowedCategories.includes(heuristicCategory)) {
    console.log(`   💡 Heuristic detected: ${heuristicCategory}`);
  }

  const prompt = `You are a professional technology CIO. Deep-scan this ${sourceType}.
  
---
TITLE: ${title}
TAGS: ${tagList || 'None'}
CONTENT: ${contentBody || '[No content]'}
---

AVAILABLE CATEGORY IDs: ai, machine-learning, web-development, programming, new-tech, general
LOCKED/HINT CATEGORY: ${heuristicCategory || categoryHint || 'None'}

RESPONSE VALID JSON:
{
  "reasoning": "Explain heatmap analysis",
  "summary": "Professional markdown summary",
  "category": "exact_id_from_list"
}`;

  // AI TRIAGE (Gemini -> Groq -> OpenRouter)
  try {
    console.log(`   ✨ Analyzing: "${title.substring(0, 40)}..." [Multi-AI]`);
    let resultText = '';

    try {
      const result = await geminiModel.generateContent(prompt);
      resultText = result.response.text();
    } catch {
      if (groq) {
        const chat = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });
        resultText = chat.choices[0].message.content;
      } else throw new Error();
    }

    const parsed = parseAIResponse(resultText, allowedCategories);
    // If heuristic locked a category, prefer it unless AI is very sure
    return {
      summary: parsed.summary,
      category: heuristicCategory || parsed.category
    };
  } catch (err) {
    console.log(`   ⚠️  AI failed. Using Intelligent Fallback.`);
  }

  // STAGE 3: INTELLIGENT FALLBACK
  // Never default to 'ai'. Default to Heuristic -> Source Hint -> General
  const finalFallbackCat = heuristicCategory || 
                           (allowedCategories.includes(categoryHint) ? categoryHint : 'general');

  return {
    summary: `## 📄 ${title}\n\n${description || ''}\n\n*⚠️ Full AI summary pending (quota reset).*`,
    category: finalFallbackCat
  };
}

function parseAIResponse(text, allowedCategories) {
  let jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace === -1) throw new Error('No JSON found');
  jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  const parsed = JSON.parse(jsonText);
  
  let category = parsed.category?.toLowerCase().trim();
  const nameToId = {
    'artificial intelligence': 'ai', 'web development': 'web-development',
    'web dev': 'web-development', 'machine learning': 'machine-learning',
    'new tech': 'new-tech', 'programming': 'programming', 'general': 'general'
  };
  if (nameToId[category]) category = nameToId[category];
  
  return {
    summary: parsed.summary.trim(),
    category: allowedCategories.includes(category) ? category : allowedCategories[0]
  };
}
