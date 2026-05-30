const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'http://localhost:9200',
  tls: { rejectUnauthorized: false }
});

const INDEX_NAME = 'pages';

const mockPages = [
  {
    url: 'https://space.com/starship-lands-on-mars',
    title: 'SpaceX successfully lands Starship on Mars',
    description: 'In a historic moment for humanity, SpaceX has successfully landed its Starship spacecraft on the surface of Mars, paving the way for human colonization.',
    content: 'SpaceX successfully lands Starship on Mars. The landing sequence went perfectly as planned. Elon Musk tweeted his congratulations to the team.',
    headings: ['The Journey', 'Landing Sequence', 'What Next?'],
    size: '1.2 MB',
    type: 'HTML',
    crawledAt: new Date().toISOString()
  },
  {
    url: 'https://blog.google/gemini-2-announcement',
    title: 'Google announces Gemini 2.0 with groundbreaking capabilities',
    description: 'Google has officially announced Gemini 2.0, its next-generation AI model that features groundbreaking capabilities in reasoning and multimodal understanding.',
    content: 'Google announces Gemini 2.0 with groundbreaking capabilities. The new model outperforms all existing competitors in almost every benchmark.',
    headings: ['Groundbreaking Capabilities', 'Multimodal Understanding', 'Release Date'],
    size: '850 KB',
    type: 'HTML',
    crawledAt: new Date().toISOString()
  },
  {
    url: 'https://stackoverflow.blog/rust-most-popular',
    title: 'Rust becomes the most popular systems programming language',
    description: 'According to the 2026 Developer Survey, Rust has finally overtaken C++ to become the most popular systems programming language in the world.',
    content: 'Rust becomes the most popular systems programming language. Developers cite memory safety and performance as the primary reasons for adoption.',
    headings: ['Why Rust?', 'The Decline of C++', 'Future Outlook'],
    size: '920 KB',
    type: 'HTML',
    crawledAt: new Date().toISOString()
  },
  {
    url: 'https://github.blog/copilot-writes-80-percent',
    title: 'GitHub Copilot writes 80% of new code in 2026',
    description: 'A new study reveals that GitHub Copilot and other AI assistants are now responsible for writing 80% of all new code pushed to repositories.',
    content: 'GitHub Copilot writes 80% of new code in 2026. The productivity gains are massive, but some developers worry about long-term maintainability.',
    headings: ['Productivity Gains', 'Quality Concerns', 'The Role of the Developer'],
    size: '640 KB',
    type: 'HTML',
    crawledAt: new Date().toISOString()
  },
  {
    url: 'https://python.org/gil-removal',
    title: 'Python completely rewrites GIL for true multithreading',
    description: 'The Python Software Foundation has announced the complete removal of the Global Interpreter Lock (GIL), enabling true multithreading in Python 3.15.',
    content: 'Python completely rewrites GIL for true multithreading. This major architectural change will drastically improve the performance of CPU-bound Python applications.',
    headings: ['What is the GIL?', 'How It Works Now', 'Performance Benchmarks'],
    size: '1.5 MB',
    type: 'HTML',
    crawledAt: new Date().toISOString()
  }
];

async function seed() {
  console.log('Seeding Elasticsearch with trending mock data...');
  for (const page of mockPages) {
    try {
      await client.index({
        index: INDEX_NAME,
        id: page.url,
        body: {
          url: page.url,
          title: page.title,
          description: page.description,
          content: page.content,
          headings: page.headings,
          suggest: {
            input: [page.title, ...page.headings],
            weight: 10
          },
          size: page.size,
          type: page.type,
          score: 10.5,
          crawledAt: page.crawledAt
        }
      });
      console.log(`Indexed: ${page.title}`);
    } catch (err) {
      console.error(`Failed to index ${page.title}:`, err.message);
    }
  }
  await client.indices.refresh({ index: INDEX_NAME });
  console.log('Seeding complete.');
}

seed();
