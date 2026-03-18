const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ARTICLES_FILE = path.join(__dirname, 'server', 'data', 'articles.json');

async function validateImageUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    try {
        const response = await axios.head(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
            timeout: 3000
        });
        return response.status === 200;
    } catch (err) {
        try {
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
                timeout: 3000,
                maxContentLength: 512 * 1024
            });
            return response.status === 200;
        } catch (getErr) {
            return false;
        }
    }
}

async function cleanup() {
    console.log("Starting article cleanup...");
    if (!fs.existsSync(ARTICLES_FILE)) {
        console.log("Articles file not found.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
    console.log(`Checking ${data.length} articles...`);

    const cleanedData = [];
    for (const article of data) {
        if (!article.image || article.image.trim() === "" || !article.image.startsWith('http')) {
            console.log(`[-] Skipping article (Invalid Image Path): ${article.title}`);
            continue;
        }

        const isValid = await validateImageUrl(article.image);
        if (isValid) {
            cleanedData.push(article);
        } else {
            console.log(`[-] Skipping article (Broken Image URL): ${article.title} -> ${article.image}`);
        }
    }

    console.log(`Cleanup complete. Kept ${cleanedData.length} of ${data.length} articles.`);
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(cleanedData, null, 2), 'utf8');
}

cleanup().catch(err => console.error(err));
