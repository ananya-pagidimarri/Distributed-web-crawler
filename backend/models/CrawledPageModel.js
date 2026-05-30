const mongoose = require('mongoose');

// Crawled/Indexed page — matches searchIndex shape in crawlerSlice
const crawledPageSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  Title: { type: String, default: 'Untitled' },
  Description: { type: String, default: '' },
  Domain: { type: String, default: '' },
  Content: { type: String, default: '' },
  
  // New Semantic & AI Extraction Fields
  Keywords: [{ type: String }],
  SemanticSearchTags: [{ type: String }],
  CompanyCategory: [{ type: String }],
  NamedEntities: {
    companies: [{ type: String }],
    technologies: [{ type: String }],
    products: [{ type: String }],
    locations: [{ type: String }]
  },
  RelevanceScores: {
    technical: { type: Number, default: 0 },
    job: { type: Number, default: 0 },
    internship: { type: Number, default: 0 },
    business: { type: Number, default: 0 }
  },
  WebsitePurpose: { type: String, default: 'General' },
  CrawlPriority: { type: Number, default: 1 },

  // System Fields
  size: { type: String, default: '0 KB' },
  type: { type: String, enum: ['HTML', 'PDF', 'Text'], default: 'HTML' },
  score: { type: Number, default: 0.5 },
  contentHash: { type: String, default: null, index: true },
  links: [{ type: String }],
  parentUrl: { type: String, default: null },
  depth: { type: Number, default: 0 },
  statusCode: { type: Number, default: 200 },
  CrawledAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create MongoDB $text index across important textual fields
crawledPageSchema.index({
  Title: 'text',
  Content: 'text',
  Keywords: 'text',
  SemanticSearchTags: 'text'
}, {
  weights: {
    Title: 10,
    Keywords: 5,
    SemanticSearchTags: 5,
    Content: 1
  },
  name: 'TextIndex'
});

module.exports = mongoose.model('CrawledPage', crawledPageSchema);