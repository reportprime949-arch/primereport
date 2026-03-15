const fetch = require('node-fetch');

const base64Str = 'CBMipgFBVV95cUxNQ0ctLV9NZ3dUY0tzbnF5dWo5Q3VWQTdsSVlvekYwTGNSekw0ckE4REVES1pWbnNNZURaT3diNnkwUFFLZDZILUdoZXVkNTZtNl9wZDY3dDdlMUE4QWV2ZXN2bXZ4UHA4RVZmNDBFeTdlWmN0eU5SZnlyRS00M3RZdUo1OE10d3kzdDhoWkpwc2ZfeWExdnFTXzJiQ1MxWTUydjlmNUpn0gGuAUFVX3lxTE1URk1NR2ZTemdydnFCX05EZGxMRHNtSGxmbFVNTFNid0JtalVUV3Vvekc0Z1ZLTGhMaF9TVG9fX2ktUEFJanhXTlJMRmhucHk2aVZzUmtCU1VtcThmZ0FnalZPS0xrMm9pOThTWFFuYklZQ1Rnb09aQ3dRc1RGaHZlbWdfRUF5YkozTVlXSFhVSWdHRU1OaTZseGp4SVRoek5FOEI2ZVFqWUFTTmg4Zw';
const signature = 'AZ5r3eSKLi9Vo0roaZ4JeF-44gaF';
const timestamp = '1773481949';

(async () => {
    const url = "https://news.google.com/_/DotsSplashUi/data/batchexecute";
    const payload = [
        "Fbv4je",
        `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${base64Str}",${timestamp},"${signature}"]`,
    ];

    const reqData = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Origin": "https://news.google.com",
            "Referer": "https://news.google.com/",
        },
        body: reqData
    });

    const text = await response.text();
    console.log('Full response:');
    console.log(text);
    console.log('---');
    
    // Try parsing
    const splitParts = text.split('\n\n');
    console.log('Number of parts:', splitParts.length);
    for (let i = 0; i < splitParts.length; i++) {
        console.log(`Part ${i} (first 200 chars):`, splitParts[i].substring(0, 200));
        try {
            const parsed = JSON.parse(splitParts[i]);
            console.log(`Part ${i} parsed:`, JSON.stringify(parsed).substring(0, 300));
        } catch (e) {
            console.log(`Part ${i} not JSON:`, e.message);
        }
    }
})();
