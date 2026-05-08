import { db } from './firestore.js';

const snap = await db.collection('posts').get();
const counts = {};
const samples = {};

snap.docs.forEach(d => {
  const cat = d.data().category || 'NONE';
  counts[cat] = (counts[cat] || 0) + 1;
  if (!samples[cat]) samples[cat] = d.data().title;
});

console.log('\n📊 Category Distribution:\n');
Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => {
    console.log(`  ${k.padEnd(20)} : ${String(v).padStart(4)} posts`);
    console.log(`     e.g. "${samples[k]?.substring(0, 70)}"`);
  });

console.log('\n  Total posts in DB:', snap.size);
process.exit(0);
