const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleDecoder } = require('google-news-url-decoder');

// In-memory cache for resolved URLs to avoid hitting Google's undocumented API too often
const resolvedUrlCache = new Map();
// Cache for extracted images
const imageCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const BAD_DOMAINS = [
    'gstatic.com', 'google.com/images', 'lh3.googleusercontent',
    'news.google.com', 'googlelogo', 'favicon',
    '1x1', 'blank.gif', 'pixel.gif', 'spacer.gif'
];

function isLogoUrl(url) {
    if (!url) return true;
    const l = url.toLowerCase();
    return BAD_DOMAINS.some(b => l.includes(b));
}

/**
 * Resolves a Google News redirect URL to the real publisher URL
 * Uses batchexecute API via google-news-url-decoder
 */
async function resolveGoogleNewsURL(googleUrl) {
    if (!googleUrl) return null;
    if (!googleUrl.includes('news.google.com')) return googleUrl;

    // Check cache
    if (resolvedUrlCache.has(googleUrl)) {
        return resolvedUrlCache.get(googleUrl);
    }

    try {
        const decoder = new GoogleDecoder();
        const result = await decoder.decode(googleUrl);
        
        let finalUrl = googleUrl; // Fallback
        
        if (result.status && result.decoded_url) {
            finalUrl = result.decoded_url;
        } else {
            console.warn(`[URL Resolver] Failed to decode ${googleUrl}: ${result.message}`);
            // Fallback: try standard redirect following just in case
            try {
                const response = await axios.get(googleUrl, {
                    maxRedirects: 5,
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 8000
                });
                const redirectedUrl = response.request?.res?.responseUrl || response.request?.responseURL;
                if (redirectedUrl && !redirectedUrl.includes('news.google.com') && !redirectedUrl.includes('consent.google.com')) {
                    finalUrl = redirectedUrl;
                }
            } catch (fallbackErr) {
                if (fallbackErr.response?.headers?.location) {
                    finalUrl = fallbackErr.response.headers.location;
                }
            }
        }

        resolvedUrlCache.set(googleUrl, finalUrl);
        return finalUrl;
    } catch (err) {
        console.error(`[URL Resolver] Error resolving ${googleUrl}:`, err.message);
        return googleUrl; // Return original if all parsing fails
    }
}

/**
 * Extracts the lead image from a publisher article page
 */
async function extractArticleData(url) {
    if (!url || url.includes('news.google.com') || url.includes('consent.google.com')) {
        return { image: null, content: null }; // Don't try to scrape Google pages
    }

    // Check cache
    const cached = imageCache.get(url);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
        return { image: cached.image, content: cached.content };
    }

    let foundImage = null;
    let foundContent = null;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 8000,
            maxRedirects: 5,
        });

        const $ = cheerio.load(data);
        const candidate =
            $('meta[property="og:image"]').attr('content') ||
            $('meta[property="og:image:secure_url"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('meta[itemprop="image"]').attr('content') ||
            $('article img').first().attr('src') ||
            $('main img').first().attr('src') ||
            $('img').first().attr('src');

        if (candidate && !isLogoUrl(candidate)) {
            // Make URL absolute if relative
            if (candidate.startsWith('//')) {
                foundImage = 'https:' + candidate;
            } else if (candidate.startsWith('/')) {
                const urlObj = new URL(url);
                foundImage = urlObj.origin + candidate;
            } else {
                foundImage = candidate;
            }
        }

        try {
            const { JSDOM, VirtualConsole } = require('jsdom');
            const { Readability } = require('@mozilla/readability');
            const virtualConsole = new VirtualConsole();
            const doc = new JSDOM(data, { url, virtualConsole });
            const reader = new Readability(doc.window.document);
            const article = reader.parse();
            if (article && article.content) {
                foundContent = article.content;
            }
        } catch (readErr) {
            // Ignore readability errors silently or log safely
        }

    } catch (_) {
        // Silent catch to prevent flooding logs on 404s/403s
    }

    // Cache the result (even if null)
    imageCache.set(url, { image: foundImage, content: foundContent, ts: Date.now() });
    return { image: foundImage, content: foundContent };
}

module.exports = {
    resolveGoogleNewsURL,
    extractArticleData
};
