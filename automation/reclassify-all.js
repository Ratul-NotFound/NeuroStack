import { db } from './firestore.js';

async function deepFix() {
  console.log('🧹 Deep Re-Classification Started...');
  
  const sourcesSnap = await db.collection('sources').get();
  const sourceMap = {};
  sourcesSnap.docs.forEach(doc => { sourceMap[doc.data().name] = doc.data().category; });

  const postsSnap = await db.collection('posts').where('category', '==', 'ai').get();
  console.log(`   Scanning ${postsSnap.size} posts currently in 'ai' folder...`);

  let movedCount = 0;
  for (const doc of postsSnap.docs) {
    const data = doc.data();
    const text = (data.title + ' ' + (data.tags || []).join(' ')).toLowerCase();
    let newCat = null;

    // WEB DEV
    if (/\b(react|vue|angular|css|tailwind|html|javascript|js|typescript|ts|node|express|nextjs|frontend|backend|ui|ux|figma|web|website|api|database|sql|mongodb|postgres|strapi|vercel|netlify|supabase|clerk|auth|stripe|prisma|graphql|rest|soap|socket|webrtc|pwa|responsive|flexbox|grid|sass|less|styled|component|prop|hook|state|redux|zod|tanstack|vite|webpack|babel|npm|yarn|pnpm|deno|bun)\b/.test(text)) {
      newCat = 'web-development';
    } 
    // PROGRAMMING
    else if (/\b(python|rust|cpp|c\+\+|java|golang|ruby|php|kotlin|swift|coding|tutorial|algorithm|dsa|leetcode|pattern|architecture|linux|terminal|shell|git|docker|kubernetes|k8s|devops|aws|azure|gcp|cloud|serverless|microservice|clean code|refactor|test|unit|integration|ci|cd|jenkins|github|gitlab|action|workflow|env|config|log|monitor|observability|security|hack|exploit|bug|fix|version|dep|module|package|lib|sdk|framework|runtime|engine)\b/.test(text)) {
      newCat = 'programming';
    } 
    // MACHINE LEARNING
    else if (/\b(machine learning|ml|pytorch|tensorflow|scikit|pandas|numpy|data science|training|model|dataset|inference|cuda|gpu|tensor|keras|transformer|bert|cnn|rnn|lstm|regression|clustering|classifier|accuracy|precision|recall|f1|overfitting|backprop|weights|bias)\b/.test(text)) {
      newCat = 'machine-learning';
    } 
    // NEW TECH
    else if (/\b(hardware|chip|processor|space|nasa|spacex|gadget|iphone|android|breakthrough|news|future|industry|electric|ev|tesla|energy|battery|robot|drone|iot|quantum|crypto|blockchain|web3|ar|vr|mr|metaverse|vision pro)\b/.test(text)) {
      newCat = 'new-tech';
    } 
    // SOURCE-BASED OVERRIDE (If title is not specifically AI)
    else if (sourceMap[data.sourceName] && sourceMap[data.sourceName] !== 'ai') {
      const isActuallyAI = /\b(ai|artificial intelligence|llm|gpt|claude|gemini|llama|agent|prompt|neural|chatbot|openai|anthropic|stable diffusion|midjourney|dall-e|copilot|perplexity|mistral|grok|deepseek|deepseek-r1|agentic|rpa|automation|rag|vector|embeddings|ollama|lm-studio)\b/.test(text);
      if (!isActuallyAI) {
        newCat = sourceMap[data.sourceName];
      }
    }

    if (newCat && newCat !== 'ai') {
      await doc.ref.update({ category: newCat });
      movedCount++;
    }
  }

  console.log(`🎉 Success! Moved ${movedCount} posts to their correct intelligence sectors.`);
  process.exit(0);
}

deepFix().catch(console.error);
