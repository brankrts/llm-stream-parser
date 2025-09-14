const { LLMStreamParser } = require('../dist/index.js');

console.log('🚀 LLM Stream Parser - Real World Demo\n');
const htmlTemplate = `<thinking>
The user wants to create a modern landing page. I'll create a responsive design using TailwindCSS with a hero section, features, and contact form.
</thinking>

<status>Creating HTML structure...</status>

<page_start>
<file_name>index.html</file_name>
<html_content><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Landing Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/feather-icons"></script>
</head>
<body class="bg-gray-50">
    <!-- Hero Section -->
    <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div class="container mx-auto px-6 py-16">
            <div class="text-center" data-aos="fade-up">
                <h1 class="text-5xl font-bold mb-4">Modern Web Solutions</h1>
                <p class="text-xl mb-8">Create amazing websites with cutting-edge technology</p>
                <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Get Started
                </button>
            </div>
        </div>
    </header>

    <!-- Features Section -->
    <section class="py-16">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-12" data-aos="fade-up">Our Features</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="text-center p-6 bg-white rounded-lg shadow-lg" data-aos="fade-up" data-aos-delay="100">
                    <i data-feather="zap" class="w-12 h-12 mx-auto mb-4 text-blue-600"></i>
                    <h3 class="text-xl font-semibold mb-2">Fast Performance</h3>
                    <p class="text-gray-600">Lightning-fast loading times and optimized performance</p>
                </div>
                <div class="text-center p-6 bg-white rounded-lg shadow-lg" data-aos="fade-up" data-aos-delay="200">
                    <i data-feather="shield" class="w-12 h-12 mx-auto mb-4 text-blue-600"></i>
                    <h3 class="text-xl font-semibold mb-2">Secure</h3>
                    <p class="text-gray-600">Enterprise-grade security for your peace of mind</p>
                </div>
                <div class="text-center p-6 bg-white rounded-lg shadow-lg" data-aos="fade-up" data-aos-delay="300">
                    <i data-feather="smartphone" class="w-12 h-12 mx-auto mb-4 text-blue-600"></i>
                    <h3 class="text-xl font-semibold mb-2">Responsive</h3>
                    <p class="text-gray-600">Perfect experience on all devices and screen sizes</p>
                </div>
            </div>
        </div>
    </section>
    <search>Search for "responsive" and replace with "responsive design"</search>

    <!-- Contact Section -->
    <section class="bg-gray-100 py-16">
        <div class="container mx-auto px-6">
            <div class="max-w-2xl mx-auto">
                <h2 class="text-3xl font-bold text-center mb-8" data-aos="fade-up">Contact Us</h2>
                <form class="bg-white p-8 rounded-lg shadow-lg" data-aos="fade-up" data-aos-delay="100">
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
                        <input class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" id="name" type="text" placeholder="Your Name">
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                        <input class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" id="email" type="email" placeholder="your@email.com">
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="message">Message</label>
                        <textarea class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 h-32" id="message" placeholder="Your message..."></textarea>
                    </div>
                    <button class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors" type="submit">
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    </section>

    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init();
        feather.replace();
    </script>
</body>
</html>
</html_content>
</page_start>

<status>Website creation completed successfully!</status>`;

async function runStreamingDemo() {
  console.log(`🧪 Starting HTML XML Demo\n`);

  const parser = new LLMStreamParser({
    enableNested: false,
    // maxDepth: 10,
    caseSensitive: false,
  });

  const completedTags = [];
  const errors = [];

  parser.on('tag_opened', tag => {
    console.log(`🔓 Tag opened: <${tag.tagName}> (depth: ${parser.getCurrentDepth()})`);
  });

  parser.on('tag_completed', tag => {
    completedTags.push(tag);
    console.log(`✅ Tag completed: <${tag.tagName}> with ${tag.content?.length || 0} chars`);

    if (tag.attributes && Object.keys(tag.attributes).length > 0) {
      console.log(`   📋 Attributes:`, JSON.stringify(tag.attributes));
    }
    if (tag.content && tag.content.length > 50) {
      console.log(`   📝 Content preview: "${tag.content.substring(0, 50)}..."`);
    } else if (tag.content && tag.content.trim()) {
      console.log(`   📝 Content: "${tag.content.trim()}"`);
    }
  });
  parser.on('tag_content_update', (tagName, partialContent) => {
    console.log(partialContent);
  });

  parser.on('parsing_complete', tags => {
    console.log(`🎉 Parsing complete! Total tags: ${tags.length}`);
  });

  parser.on('parse_error', error => {
    errors.push(error);
    console.log(`❌ Parse error: ${error.message}`);
  });

  parser.defineTag({ tagName: 'thinking' });
  parser.defineTag({ tagName: 'status' });
  parser.defineTag({ tagName: 'error' });
  parser.defineTag({ tagName: 'page_start' });
  parser.defineTag({ tagName: 'page_end' });
  parser.defineTag({ tagName: 'html_content' });
  parser.defineTag({ tagName: 'file_name' });
  parser.defineTag({ tagName: 'update_start' });
  parser.defineTag({ tagName: 'update_end' });
  parser.defineTag({ tagName: 'search' });
  parser.defineTag({ tagName: 'replace' });
  parser.defineTag({ tagName: 'new_page' });

  console.log(`📋 Registered ${parser.getRegisteredTags().length} tag types\n`);

  console.log(`🌊 Starting streaming simulation...\n`);
  const startTime = Date.now();

  const chunkSize = 25;
  const chunks = [];

  for (let i = 0; i < htmlTemplate.length; i += chunkSize) {
    chunks.push(htmlTemplate.slice(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));

    parser.parse(chunks[i]);
  }

  parser.finalize();
  const endTime = Date.now();

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 DEMO RESULTS`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`⏱️  Processing time: ${endTime - startTime}ms`);
  console.log(`📦 Total chunks: ${chunks.length}`);
  console.log(`📝 Content length: ${htmlTemplate.length} characters`);
  console.log(`🏷️  Tags completed: ${completedTags.length}`);
  console.log(`🚨 Errors: ${errors.length}`);

  const stats = parser.getStats();
  console.log(`\n📊 Parser Statistics:`);
  console.log(`   Buffer size: ${stats.bufferSize} bytes`);
  console.log(`   Registered tags: ${stats.registeredTagsCount}`);
  console.log(`   Current state: ${stats.state}`);
  console.log(`   Max depth reached: ${stats.maxDepthReached}`);

  console.log(`\n🏷️  Tag Breakdown:`);
  const tagCounts = {};
  completedTags.forEach(tag => {
    tagCounts[tag.tagName] = (tagCounts[tag.tagName] || 0) + 1;
  });

  Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([tagName, count]) => {
      console.log(`   ${tagName}: ${count} instances`);
    });

  console.log(`\n🔍 Sample Completed Tags:`);
  completedTags.slice(0, 3).forEach((tag, index) => {
    console.log(`\n   ${index + 1}. <${tag.tagName}>`);
    if (tag.attributes && Object.keys(tag.attributes).length > 0) {
      console.log(`      Attributes: ${JSON.stringify(tag.attributes)}`);
    }
    if (tag.content && tag.content.trim()) {
      const preview =
        tag.content.trim().length > 100
          ? tag.content.trim().substring(0, 100) + '...'
          : tag.content.trim();
      console.log(`      Content: "${preview}"`);
    }
  });

  return { completedTags, errors, processingTime: endTime - startTime };
}

async function main() {
  try {
    const result = await runStreamingDemo();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎯 FINAL SUMMARY`);
    console.log(`${'='.repeat(50)}`);
    console.log(`🏷️  Total tags parsed: ${result.completedTags.length}`);
    console.log(`🚨 Total errors: ${result.errors.length}`);
    console.log(`⚡ Processing time: ${result.processingTime}ms`);

    if (result.completedTags.length > 0) {
      const successRate = (
        (result.completedTags.length / (result.completedTags.length + result.errors.length)) *
        100
      ).toFixed(1);
      console.log(`✅ Success rate: ${successRate}%`);
    }

    console.log(`\n🎉 HTML XML demo completed successfully!`);
  } catch (error) {
    console.error(`💥 Demo execution failed:`, error);
    process.exit(1);
  }
}

main();
