const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  topQueries: [{
    query: String,
    count: Number
  }],
  totalSearches: { type: Number, default: 0 }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
