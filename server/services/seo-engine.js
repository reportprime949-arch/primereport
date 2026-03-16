/**
 * SEO Engine [ULTRA]
 * Generates dynamic meta tags, OG tags, and Schema.org objects.
 */
class SEOEngine {
    constructor(baseUrl = 'https://primereport-news.netlify.app') {
        this.baseUrl = baseUrl;
    }

    generateMeta(article) {
        const title = article.title.length > 60 ? article.title.substring(0, 57) + "..." : article.title;
        const description = (article.summary || "").substring(0, 160);
        
        return {
            title: title,
            description: description,
            keywords: `${article.category}, news, prime report, breaking, intelligence`,
            og: {
                title: article.title,
                description: description,
                image: article.image,
                url: `${this.baseUrl}/article/${article.slug || article.id}`,
                type: 'article'
            }
        };
    }

    generateNewsSchema(article) {
        return {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "image": [article.image],
            "datePublished": article.publishedAt || new Date().toISOString(),
            "dateModified": article.updatedAt || article.publishedAt || new Date().toISOString(),
            "author": {
                "@type": "Organization",
                "name": "PrimeReport"
            },
            "publisher": {
                "@type": "Organization",
                "name": "PrimeReport",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${this.baseUrl}/logo.png`
                }
            },
            "description": (article.summary || "").substring(0, 200),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `${this.baseUrl}/article/${article.slug || article.id}`
            }
        };
    }
}

module.exports = new SEOEngine();
