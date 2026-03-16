const axios = require('axios');

/**
 * Article Expander Engine [ULTRA]
 * Converts short RSS summaries/snippets into full-length professional articles (500-800 words).
 */
async function expandArticle(summary, title, category) {
  if (!summary || summary.length < 20) return null;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `
    You are an elite news architect and investigative journalist. 
    Expand the following news snippet into a full professional article.
    
    Title: ${title}
    Category: ${category}
    Snippet: ${summary}
    
    Article Requirements:
    - Length: 500-800 words
    - Formatting: Pure HTML (use only <p>, <h2>, <ul>, <li> tags)
    - Tone: Factual, analytical, and authoritative.
    - Structure MUST include:
      1. Intro: A compelling hook and overview.
      2. <h2>Key Developments</h2>: Detailed explanation of the event.
      3. <h2>Why It Matters</h2>: Context, broader impact, and analysis.
      4. <h2>Expert Insight</h2>: Summary analysis or future outlook.
    - Subheadings (<h2>) must be EXACTLY as specified.
    
    Return ONLY the HTML content.
    `;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4-turbo-preview",
      messages: [{ role: "system", content: "You are a senior journalism editor." }, { role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const fullContent = response.data.choices[0].message.content.trim();
    console.log(`[Article Expander] Expanded article: ${title} (~${fullContent.split(' ').length} words)`);
    return fullContent;
  } catch (error) {
    console.error("[Article Expander] Error:", error.message);
    return null;
  }
}

module.exports = expandArticle;
