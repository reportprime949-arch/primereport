const axios = require('axios');

/**
 * AI Headline Generator
 * Transforms boring RSS titles into high-CTR clickable headlines for SEO.
 */
async function generateHighCTRHeadline(originalTitle, category) {
  if (!originalTitle) return "";
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return originalTitle; // Fallback
  }

  try {
    const prompt = `
    You are a viral news editor and SEO specialist.
    Transform the following headline into a high-CTR, clickable headline.
    
    Original: "${originalTitle}"
    Category: ${category}
    
    Rules:
    - Max 110 characters
    - Use power words (Revolution, Shocking, Breakthrough, Revealed, Massive)
    - Maintain factual accuracy
    - Optimized for Google Discover and News
    - Return ONLY the final headline string.
    `;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4-turbo-preview",
      messages: [{ role: "system", content: "You are a professional news editor." }, { role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 60
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const headline = response.data.choices[0].message.content.trim().replace(/^"(.*)"$/, '$1');
    console.log(`[AI Headline] Transformed: "${originalTitle}" -> "${headline}"`);
    return headline;
  } catch (error) {
    console.error("[AI Headline] Error:", error.message);
    return originalTitle;
  }
}

module.exports = generateHighCTRHeadline;
