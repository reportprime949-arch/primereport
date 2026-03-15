const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

(async () => {
    const r = await axios.get('https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en', {
        headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000
    });
    const p = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const d = p.parse(r.data);
    const items = d.rss?.channel?.item || [];
    
    console.log('=== FIRST 3 ITEMS DESCRIPTION HTML ===');
    items.slice(0, 3).forEach((item, i) => {
        console.log(`\n--- Item ${i} ---`);
        console.log('LINK:', item.link);
        console.log('DESC:', item.description?.substring(0, 500));
        
        // Try to extract real URL from description
        const urlMatch = (item.description || '').match(/href="([^"]+)"/);
        console.log('Extracted URL:', urlMatch ? urlMatch[1] : 'NONE');
    });
})();
