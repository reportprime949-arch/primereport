const cheerio = require('cheerio');

function extractImage(item) {
    // 1. Check media:content (Simulating rss-parser format)
    if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
        return item.mediaContent.$.url;
    }
    
    // 2. Check enclosure
    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
    }

    // 3. Extract image from description HTML
    const desc = item.content || item.description || "";
    const descMatch = desc.match(/<img[^>]+src="([^">]+)"/);
    if (descMatch) return descMatch[1];

    // 4. Extract image from contentEncoded
    if (item.contentEncoded) {
        const contentMatch = item.contentEncoded.match(/<img[^>]+src="([^">]+)"/);
        if (contentMatch) return contentMatch[1];
    }

    return "/assets/images/news-placeholder.jpg";
}

// Test cases
const testItems = [
    {
        name: "Media Content",
        mediaContent: { $: { url: "https://example.com/media.jpg" } }
    },
    {
        name: "Enclosure",
        enclosure: { url: "https://example.com/enclosure.jpg" }
    },
    {
        name: "Description HTML",
        description: "<p>Something</p><img src=\"https://example.com/desc.png\">"
    },
    {
        name: "Content Encoded",
        contentEncoded: "<div><img src='https://example.com/content.webp'></div>"
    },
    {
        name: "Fallback",
        description: "No image here"
    }
];

testItems.forEach(item => {
    console.log(`Test: ${item.name} -> Result: ${extractImage(item)}`);
});
