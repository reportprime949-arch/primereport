const axios = require('axios');
const crypto = require('crypto');

// The AI rewrite module interfaces with the LLM API to reconstruct the scraped HTML.
// By default, assuming a prompt-based structure with mock fallback if the key is missing

async function rewriteArticleAI(rawText, originalHeadline, category) {
    if (!rawText || rawText.length < 50) return null;

    // Check if an AI proxy key is provided in env (e.g. OpenAI or mock generator)
    const apiKey = process.env.AI_API_KEY;

    // If no key is present, apply minimal rewriting structure to act as the AI for demonstration.
    if (!apiKey) {
        return mockRewrite(rawText, originalHeadline, category);
    }

    try {
        const prompt = `
You are a senior news editor and SEO expert specializing in high-traffic viral news.
Given the following raw news content:
"${rawText.slice(0, 4000)}"

Tasks:
1. Rewrite into a professional news article (400-700 words, HTML <p> tags).
2. Generate 3 unique "Viral Headlines" (High-CTR, emotional triggers, use numbers if possible). Pick the best as "headline".
3. Create a short summarizing intro (1-2 sentences).
4. List 3-4 "Key Highlights" (bullet points).
5. Write a 30-second "Video Script".
6. Generate "SEO Title" (max 60 chars) and "SEO Description" (max 160 chars).
7. Generate a valid Schema.org NewsArticle JSON-LD object as "schema_data".
8. Generate 3 "FAQ" Q&As based on the article as "faqs".
9. Create a 100-word "Explainer" background context as "explainer".

Output strictly as a raw JSON object with these keys:
"headline", "headline_variations", "summary", "article_body", "key_points", "video_script", "keywords", "seo_title", "seo_description", "schema_data", "faqs", "explainer"
`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4-turbo-preview", // Upgraded for better logic
            messages: [{ role: "system", content: "You are a senior journalist and editor specializing in viral news." }, { role: "user", content: prompt }],
            temperature: 0.6,
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const content = JSON.parse(response.data.choices[0].message.content);
        return content;
    } catch (error) {
        console.error('AI Rewrite API failed. Falling back to mock.', error.message);
        return mockRewrite(rawText, originalHeadline, category);
    }
}

function mockRewrite(rawText, originalHeadline, category) {
    // Basic scrubbing to simulate a rewrite for local dev environments
    const plainText = rawText.replace(/<[^>]*>?/gm, '').trim();
    const paragraphs = plainText.split('\\n').filter(p => p.trim().length > 30).slice(0, 6);
    
    let htmlBody = paragraphs.map(p => `<p class="leading-relaxed mb-6">${p}</p>`).join('\n');
    
    // Simulate generation
    return {
        headline: `Prime Report: ${originalHeadline}`,
        summary: `Latest updates on ${category}: ${paragraphs[0]?.substring(0, 100)}...` || 'A premium report on breaking news developments.',
        article_body: htmlBody,
        keywords: `${category.toLowerCase()}, news, prime report, breaking`,
        seo_title: `${originalHeadline} | PrimeReport News`,
        seo_description: `Breaking ${category} news: ${originalHeadline}`
    };
}

module.exports = {
    rewriteArticleAI
};
