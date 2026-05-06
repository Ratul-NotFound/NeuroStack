import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function summarizeContent(title, description, content, allowedCategories) {
  const prompt = `
    You are an expert knowledge curator. Analyze the following content and provide a structured summary.
    
    TITLE: ${title}
    DESCRIPTION: ${description}
    CONTENT_SNIPPET: ${content?.substring(0, 5000)}
    
    ALLOWED CATEGORIES: ${allowedCategories.join(', ')}
    
    TASK:
    1. Summarize the content in Markdown format. Use an overview paragraph followed by clear bullet points. Max 300 words.
    2. Assign exactly ONE category from the ALLOWED CATEGORIES list.
    
    RESPONSE FORMAT (JSON):
    {
      "summary": "markdown_summary_here",
      "category": "assigned_category"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up JSON if LLM adds markdown blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid JSON response from Gemini');
  } catch (error) {
    console.error('Summarization error:', error);
    return {
      summary: `${description}\n\n**Source: ${title}**`,
      category: allowedCategories[0] || 'General'
    };
  }
}
