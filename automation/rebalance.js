import { db } from './firestore.js';

// Advanced Keyword Matching with 11 Categories
const keywords = {
  'web-development': [
    'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'html', 'css', 'tailwind', 
    'javascript', 'js', 'typescript', 'ts', 'node', 'express', 'frontend', 'backend', 
    'fullstack', 'api', 'graphql', 'rest', 'vercel', 'netlify', 'supabase', 'firebase', 
    'pwa', 'web', 'website', 'stripe', 'auth', 'vite', 'webpack'
  ],
  'machine-learning': [
    'machine learning', 'ml', 'pytorch', 'tensorflow', 'scikit', 'pandas', 'numpy', 
    'training', 'dataset', 'inference', 'cuda', 'gpu', 'tensor', 'keras', 'transformer', 
    'bert', 'cnn', 'rnn', 'lstm', 'regression', 'clustering', 'classifier', 'accuracy', 
    'backprop', 'weights', 'neural network', 'deep learning', 'fine-tuning', 'lora', 'rlhf'
  ],
  'data-science': [
    'data science', 'data analyst', 'big data', 'analytics', 'visualization', 'hadoop', 
    'spark', 'sql', 'database', 'mongodb', 'postgres', 'tableau', 'powerbi', 'data engineer'
  ],
  'cybersecurity': [
    'cybersecurity', 'security', 'hack', 'exploit', 'vulnerability', 'malware', 'phishing', 
    'ransomware', 'encryption', 'zerotrust', 'firewall', 'infosec', 'penetration testing', 'cve'
  ],
  'design-ui': [
    'design', 'ui', 'ux', 'figma', 'adobe', 'photoshop', 'illustrator', 'prototype', 
    'wireframe', 'usability', 'typography', 'user interface', 'user experience'
  ],
  'devops-cloud': [
    'devops', 'cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'k8s', 'ci/cd', 
    'jenkins', 'terraform', 'microservice', 'linux', 'serverless', 'infrastructure', 'sysadmin'
  ],
  'mobile-dev': [
    'mobile', 'ios', 'android', 'react native', 'flutter', 'swiftui', 'kotlin', 'xcode', 
    'app store', 'play store', 'smartphone app'
  ],
  'programming': [
    'python', 'rust', 'cpp', 'c++', 'c#', 'java', 'golang', 'go', 'ruby', 'php', 'swift', 
    'coding', 'tutorial', 'algorithm', 'dsa', 'leetcode', 'architecture', 'terminal', 
    'shell', 'git', 'github', 'gitlab', 'bug', 'fix', 'developer', 'software', 'engineer', 'code'
  ],
  'ai': [
    'ai', 'artificial intelligence', 'llm', 'gpt', 'gpt-4', 'gpt-3', 'claude', 'gemini', 
    'llama', 'agent', 'prompt', 'chatbot', 'openai', 'anthropic', 'stable diffusion', 
    'midjourney', 'copilot', 'mistral', 'grok', 'deepseek', 'agentic', 'rag', 'vector', 
    'embeddings', 'ollama', 'generative', 'agi'
  ],
  'new-tech': [
    'hardware', 'chip', 'processor', 'nvidia', 'amd', 'intel', 'space', 'nasa', 'spacex', 
    'gadget', 'iphone', 'apple', 'breakthrough', 'future', 'industry', 'electric', 'ev', 
    'tesla', 'energy', 'battery', 'robot', 'drone', 'iot', 'quantum', 'crypto', 'blockchain', 
    'web3', 'ar', 'vr', 'mr', 'metaverse', 'vision pro', 'headset', 'startup', 'funding', 'ceo'
  ]
};

async function rebalanceCategories() {
  console.log('⚖️ Rebalancing Categories with 11 Categories...');
  
  const postsSnap = await db.collection('posts').get();
  console.log(`Found ${postsSnap.size} posts to evaluate.`);

  let updatedCount = 0;
  const batchSize = 400;
  let batch = db.batch();
  let currentBatchSize = 0;
  
  const stats = { 'web-development': 0, 'machine-learning': 0, 'data-science': 0, 'cybersecurity': 0, 'design-ui': 0, 'devops-cloud': 0, 'mobile-dev': 0, 'programming': 0, 'ai': 0, 'new-tech': 0, 'general': 0 };

  for (const doc of postsSnap.docs) {
    const post = doc.data();
    const text = (post.title + ' ' + (post.summary || '')).toLowerCase();
    
    const scores = { 'web-development': 0, 'machine-learning': 0, 'data-science': 0, 'cybersecurity': 0, 'design-ui': 0, 'devops-cloud': 0, 'mobile-dev': 0, 'programming': 0, 'ai': 0, 'new-tech': 0 };
    
    for (const [cat, words] of Object.entries(keywords)) {
      for (const word of words) {
        const regex = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
        const matches = text.match(regex);
        if (matches) scores[cat] += matches.length;
      }
    }
    
    // Penalize AI and general Programming to allow specific categories to shine
    if (scores['ai'] > 0) scores['ai'] *= 0.6; 
    if (scores['programming'] > 0) scores['programming'] *= 0.8;
    
    let bestCat = 'general';
    let maxScore = 0;
    
    for (const [cat, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestCat = cat;
      }
    }
    
    if (maxScore < 1.5) {
       bestCat = post.category || 'general';
    }

    stats[bestCat] = (stats[bestCat] || 0) + 1;
    
    if (bestCat !== post.category) {
      batch.update(doc.ref, { category: bestCat });
      updatedCount++;
      currentBatchSize++;
      
      if (currentBatchSize >= batchSize) {
        await batch.commit();
        console.log(`Committed batch of ${currentBatchSize} updates...`);
        batch = db.batch();
        currentBatchSize = 0;
      }
    }
  }

  if (currentBatchSize > 0) {
    await batch.commit();
  }

  console.log(`\n✅ Rebalance complete! Updated ${updatedCount} posts.`);
  console.log('New Distribution:', stats);
  process.exit(0);
}

rebalanceCategories().catch(e => { console.error('Error:', e); process.exit(1); });
