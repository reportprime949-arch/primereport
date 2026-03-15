const mongoose = require('mongoose');
const Article = require('./models/Article');
const fs = require('fs');
const path = require('path');

async function generateDailyNewsletter() {
    try {
        console.log("Generating AI Daily Newsletter...");
        
        // Fetch top 5 trending articles from last 24h
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const topArticles = await Article.find({ date: { $gte: yesterday } })
            .sort({ views: -1 })
            .limit(5);

        if (topArticles.length === 0) {
            console.log("No new articles for newsletter.");
            return;
        }

        const template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 40px;">
            <div style="background: #000; padding: 20px; text-align: center;">
                <h1 style="color: #fff; margin: 0;">PrimeReport Daily</h1>
                <p style="color: #64748b; font-size: 12px;">Your AI-Powered News Digest</p>
            </div>
            <div style="padding: 20px;">
                ${topArticles.map(a => `
                    <div style="background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <img src="${a.urlToImage || 'https://via.placeholder.com/600x300'}" style="width: 100%; border-radius: 8px; margin-bottom: 15px;">
                        <h2 style="margin: 0 0 10px 0; color: #111827;">${a.title}</h2>
                        <p style="color: #4b5563; line-height: 1.6;">${a.summary}</p>
                        <a href="http://localhost:3000/article.html?id=${a.id}" style="display: inline-block; background: #dc2626; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Read More</a>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 40px;">
                <p>&copy; 2026 PrimeReport. All rights reserved.</p>
                <p>You are receiving this because you subscribed to PrimeReport Al News.</p>
            </div>
        </div>
        `;

        const newsletterPath = path.join(__dirname, 'data', 'daily-newsletter.html');
        if (!fs.existsSync(path.join(__dirname, 'data'))) {
            fs.mkdirSync(path.join(__dirname, 'data'));
        }
        
        fs.writeFileSync(newsletterPath, template);
        console.log(`Newsletter generated at: ${newsletterPath}`);
        
    } catch (err) {
        console.error("Newsletter generation failed:", err);
    }
}

module.exports = { generateDailyNewsletter };
