const cheerio = require('cheerio');
exports.parseContent = (html) => {
  const $ = cheerio.load(html);
  return {
    title: $('title').text(),
    text: $('body').text().substring(0, 200)
  };
};