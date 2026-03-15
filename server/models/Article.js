const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID for backward compatibility with frontend
    title: { type: String, required: true },
    summary: { type: String },
    description: { type: String },
    content: { type: String },
    link: { type: String },
    image: { type: String },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    publishedAt: { type: Date },
    source: { type: String },
    author: { type: String },
    seo_title: { type: String },
    seo_description: { type: String },
    keywords: { type: String },
    isBreaking: { type: Boolean, default: false },
    isEvergreen: { type: Boolean, default: false },
    clusterId: { type: String, index: true },
    views: { type: Number, default: 0 },
    trafficSources: {
        search: { type: Number, default: 0 },
        social: { type: Number, default: 0 },
        direct: { type: Number, default: 0 }
    },
    headline_variations: [String],
    faqs: [Object],
    explainer: String,
    schema_data: Object,
    video_script: String,
    key_points: [String]
}, { timestamps: true });

// Create text index for trending news keyword extraction
articleSchema.index({ title: 'text', description: 'text', summary: 'text' });

module.exports = mongoose.model('Article', articleSchema);
