const { fetchSitemap } = require('./crawler/sitemapParser.js');
fetchSitemap('https://react.dev/sitemap.xml').then(urls => console.log('URLs:', urls.length)).catch(console.error);
