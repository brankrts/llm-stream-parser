const { LLMStreamParser } = require('../dist/index.js');

console.log('🚀 LLM Stream Parser - Real World Demo\n');

const chatTemplate = `<conversation id="support-chat" timestamp="2024-01-15T14:30:00Z">
  <message role="user" id="msg-1">
    I'm having trouble with my account login. Can you help me?
  </message>
  
  <message role="assistant" id="msg-2">
    <thinking>
      The user is experiencing login issues. I should gather more information 
      about their specific problem and provide step-by-step assistance.
    </thinking>
    
    I'd be happy to help you with your login issue! Let me ask a few questions:
    
    <checklist>
      <item checked="false">Are you getting any specific error messages?</item>
      <item checked="false">Have you tried resetting your password recently?</item>
    </checklist>
    
    <suggestion priority="high" category="immediate">
      Try clearing your browser cache and cookies, then attempt to log in again.
    </suggestion>
  </message>
  
  <message role="user" id="msg-3">
    I get an "invalid credentials" error. I'm sure I have the right password.
  </message>
  
  <message role="assistant" id="msg-4">
    <analysis confidence="0.85">
      The "invalid credentials" error typically indicates either incorrect password
      or account lockout due to multiple failed attempts.
    </analysis>
    
    Let's try a password reset to be safe:
    
    <steps>
      <step number="1" required="true">Go to the login page</step>
      <step number="2" required="true">Click "Forgot Password"</step>
      <step number="3" required="true">Enter your email address</step>
    </steps>
    
    <note type="warning">
      If you don't receive the email within 5 minutes, check your spam folder.
    </note>
  </message>
</conversation>`;

async function runStreamingDemo() {
  console.log(`🧪 Starting Chat Conversation Demo\n`);

  const parser = new LLMStreamParser({
    enableNested: true,
    maxDepth: 10,
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

  parser.on('parsing_complete', tags => {
    console.log(`🎉 Parsing complete! Total tags: ${tags.length}`);
  });

  parser.on('parse_error', error => {
    errors.push(error);
    console.log(`❌ Parse error: ${error.message}`);
  });

  parser.defineTag({ tagName: 'conversation' });
  parser.defineTag({ tagName: 'message' });
  parser.defineTag({ tagName: 'thinking' });
  parser.defineTag({ tagName: 'checklist' });
  parser.defineTag({ tagName: 'item' });
  parser.defineTag({ tagName: 'suggestion' });
  parser.defineTag({ tagName: 'analysis' });
  parser.defineTag({ tagName: 'steps' });
  parser.defineTag({ tagName: 'step' });
  parser.defineTag({ tagName: 'note' });

  console.log(`📋 Registered ${parser.getRegisteredTags().length} tag types\n`);

  console.log(`🌊 Starting streaming simulation...\n`);
  const startTime = Date.now();

  const chunkSize = 25;
  const chunks = [];

  for (let i = 0; i < chatTemplate.length; i += chunkSize) {
    chunks.push(chatTemplate.slice(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));

    console.log(`📦 Chunk ${i + 1}/${chunks.length}: "${chunks[i].replace(/\n/g, '\\n')}"`);
    parser.parse(chunks[i]);
  }

  parser.finalize();
  const endTime = Date.now();

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 DEMO RESULTS`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`⏱️  Processing time: ${endTime - startTime}ms`);
  console.log(`📦 Total chunks: ${chunks.length}`);
  console.log(`📝 Content length: ${chatTemplate.length} characters`);
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

    console.log(`\n🎉 Real-world streaming demo completed successfully!`);
  } catch (error) {
    console.error(`💥 Demo execution failed:`, error);
    process.exit(1);
  }
}

main();
