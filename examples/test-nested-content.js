const { LLMStreamParser } = require('../dist/index.js');

console.log('🧪 Testing Nested Content Updates\n');

const testContent = `<thinking>
  <analysis>Bu analiz kısmı...</analysis>
  <conclusion>Sonuç bu</conclusion>
</thinking>`;

const parser = new LLMStreamParser({
  enableNested: true,
  maxDepth: 10,
  caseSensitive: false,
});

// Sadece thinking tag'ını kaydet
parser.defineTag({ tagName: 'thinking' });

let contentUpdates = [];

parser.on('tag_opened', (tag, depth, path) => {
  console.log(`🔓 Tag opened: <${tag.tagName}> (depth: ${depth}, path: ${path})`);
});

parser.on('tag_content_update', (tagName, partialContent) => {
  contentUpdates.push({ tagName, partialContent });
  console.log(`📝 Content update for <${tagName}>: "${partialContent}"`);
});

parser.on('tag_completed', tag => {
  console.log(`✅ Tag completed: <${tag.tagName}> with ${tag.content?.length || 0} chars`);
  console.log(`   Final content: "${tag.content}"`);
});

parser.on('parse_error', error => {
  console.log(`❌ Parse error: ${error.message}`);
});

console.log('🌊 Starting parsing...\n');
parser.parseComplete(testContent);

console.log(`\n📊 Content Updates Summary:`);
contentUpdates.forEach((update, index) => {
  console.log(`   ${index + 1}. <${update.tagName}>: "${update.partialContent}"`);
});
