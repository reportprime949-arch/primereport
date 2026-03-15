const Article = require('./models/Article');
const trendService = require('./trends');

class ClusterEngine {
    async organizeClusters() {
        console.log("[CLUSTERS] Organizing article clusters...");
        const trends = trendService.getTrends();
        
        if (trends.length === 0) {
            console.log("[CLUSTERS] No trends detected yet, skipping grouping.");
            return;
        }

        for (const topic of trends) {
            // Find articles related to the trending topic
            const relatedArticles = await Article.find({
                $or: [
                    { title: new RegExp(topic, 'i') },
                    { summary: new RegExp(topic, 'i') },
                    { content: new RegExp(topic, 'i') }
                ],
                clusterId: { $exists: false } // Only articles not yet clustered
            });

            if (relatedArticles.length >= 3) {
                const clusterId = `cluster_${topic.replace(/\s+/g, '_')}_${Date.now()}`;
                console.log(`[CLUSTERS] Creating cluster: ${clusterId} for topic: "${topic}" (${relatedArticles.length} articles)`);
                
                await Article.updateMany(
                    { _id: { $in: relatedArticles.map(a => a._id) } },
                    { clusterId: clusterId }
                );

                // Trigger Expansion for high-performing clusters
                await this.expandCluster(clusterId, topic);
            }
        }
    }

    async expandCluster(clusterId, topic) {
        // Logic to nominate a cluster for "Explainer/FAQ" generation if it doesn't have one
        const articles = await Article.find({ clusterId: clusterId });
        const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
        
        if (totalViews > 100 || articles.length >= 5) {
            console.log(`[EXPANSION] Cluster ${clusterId} is high-traffic. Ensuring all articles have rich metadata.`);
            // This is where we could trigger an AI job to specifically write a "Master Explainer"
            // For now, we ensure the latest article in the cluster is marked as "Evergreen candidate"
            await Article.findOneAndUpdate(
                { clusterId: clusterId },
                { isEvergreen: true },
                { sort: { date: -1 } }
            );
        }
    }

    async getClusterRelated(clusterId, excludeId) {
        if (!clusterId) return [];
        return await Article.find({
            clusterId: clusterId,
            id: { $ne: excludeId }
        }).limit(5);
    }
}

const clusterEngine = new ClusterEngine();
module.exports = clusterEngine;
