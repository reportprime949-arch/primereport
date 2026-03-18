const axios = require('axios');
const cheerio = require('cheerio');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { GoogleDecoder } = require('google-news-url-decoder');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads/processed');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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
        return { image: null, content: null };
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
            timeout: 10000,
            maxRedirects: 5,
        });

        const $ = cheerio.load(data);
        const urlObj = new URL(url);

        // Priority 1: Meta Tags (og:image is king)
        const candidates = [
            $('meta[property="og:image"]').attr('content'),
            $('meta[property="og:image:secure_url"]').attr('content'),
            $('meta[name="twitter:image"]').attr('content'),
            $('meta[name="twitter:image:src"]').attr('content'),
            $('meta[itemprop="image"]').attr('content'),
            $('link[rel="image_src"]').attr('href'),
            $('link[rel="apple-touch-icon"]').attr('href')
        ];

        for (let candidate of candidates) {
            if (candidate && !isLogoUrl(candidate)) {
                foundImage = candidate;
                break;
            }
        }

        // Priority 2: Semantic Lead Image
        if (!foundImage) {
            const semanticSelectors = [
                'article img', 'main img', '.post-content img', '.article-body img', 
                '.entry-content img', '[itemprop="articleBody"] img'
            ];
            for (const selector of semanticSelectors) {
                const img = $(selector).first();
                const src = img.attr('src') || img.attr('data-src') || img.attr('srcset')?.split(' ')[0];
                if (src && !isLogoUrl(src)) {
                    foundImage = src;
                    break;
                }
            }
        }

        // Priority 3: Fallback Scrape
        if (!foundImage) {
            $('img').each((i, el) => {
                const src = $(el).attr('src') || $(el).attr('data-src');
                if (src && !isLogoUrl(src) && src.length > 10) {
                    foundImage = src;
                    return false;
                }
            });
        }

        // Clean and Resolve URL (Mandatory absolute path)
        if (foundImage) {
            foundImage = foundImage.trim();
            if (foundImage.startsWith('//')) {
                foundImage = 'https:' + foundImage;
            } else if (foundImage.startsWith('/')) {
                foundImage = urlObj.origin + foundImage;
            } else if (!foundImage.startsWith('http')) {
                try {
                    foundImage = new URL(foundImage, url).href;
                } catch (e) {
                    const base = url.substring(0, url.lastIndexOf('/') + 1);
                    foundImage = base + foundImage;
                }
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
            // Readability error
        }

    } catch (err) {
        // Silent catch for scraping errors
    }

    // Cache the result
    imageCache.set(url, { image: foundImage, content: foundContent, ts: Date.now() });
    
    // Proactively optimize if image found
    if (foundImage) {
        optimizeAndStoreImage(foundImage).catch(() => {});
    }

    return { image: foundImage, content: foundContent };
}

/**
 * Downloads, resizes, and compresses an image for local serving
 */
async function optimizeAndStoreImage(imageUrl) {
    if (!imageUrl || imageUrl.includes('news-placeholder') || imageUrl.startsWith('/')) return imageUrl;

    const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
    const fileName = `${hash}.webp`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    const publicPath = `/uploads/processed/${fileName}`;

    if (fs.existsSync(filePath)) return publicPath;

    try {
        const response = await axios.get(imageUrl, { 
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        await sharp(response.data)
            .resize({ width: 800, withoutEnlargement: true })
            .webp({ quality: 65, effort: 6 })
            .toFile(filePath);

        return publicPath;
    } catch (err) {
        console.error(`[Image Opt] Failed ${imageUrl}:`, err.message);
        return imageUrl; // Fallback to original
    }
}

module.exports = {
    resolveGoogleNewsURL,
    extractArticleData,
    optimizeAndStoreImage
};
