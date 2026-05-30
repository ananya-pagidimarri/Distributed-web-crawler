const { isDbConnected } = require('../database/mongoConnection');
const CrawledPage = require('../models/CrawledPageModel');

exports.searchPages = async (query) => {
  // Use regex for basic search if text index is not configured, or $text if it is
  // For this demo, we'll use regex on title or snippet
  const regex = new RegExp(query, 'i');
  return await CrawledPage.find({
    $or: [{ title: regex }, { snippet: regex }, { url: regex }]
  }).limit(20);
};