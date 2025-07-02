const { LLMStreamParser, AttributeTransformers } = require('../dist/index.js');

console.log('🚀 LLM Stream Parser - Real World Test\n');

function simulateStreaming(content, chunkSize = 15, delayMs = 50) {
  return new Promise(resolve => {
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    let currentChunk = 0;
    const streamChunk = () => {
      if (currentChunk < chunks.length) {
        setTimeout(() => {
          console.log(`📦 Chunk ${currentChunk + 1}/${chunks.length}: "${chunks[currentChunk]}"`);
          currentChunk++;
          streamChunk();
        }, delayMs);
      } else {
        console.log('✅ Streaming complete\n');
        resolve(chunks);
      }
    };

    streamChunk();
  });
}

const templates = {
  chatConversation: `
<conversation id="support-chat-001" timestamp="2024-01-15T14:30:00Z">
  <message role="user" id="msg-1" timestamp="2024-01-15T14:30:00Z">
    I'm having trouble with my account login. Can you help me?
  </message>
  
  <message role="assistant" id="msg-2" timestamp="2024-01-15T14:30:15Z">
    <thinking>
      The user is experiencing login issues. I should gather more information 
      about their specific problem and provide step-by-step assistance.
    </thinking>
    
    I'd be happy to help you with your login issue! Let me ask a few questions:
    
    <checklist>
      <item checked="false">Are you getting any specific error messages?</item>
      <item checked="false">Have you tried resetting your password recently?</item>
      <item checked="false">Are you using the correct email address?</item>
    </checklist>
    
    <suggestion priority="high" category="immediate">
      Try clearing your browser cache and cookies, then attempt to log in again.
    </suggestion>
  </message>
  
  <message role="user" id="msg-3" timestamp="2024-01-15T14:32:00Z">
    I get an "invalid credentials" error. I'm sure I have the right password.
  </message>
  
  <message role="assistant" id="msg-4" timestamp="2024-01-15T14:32:30Z">
    <analysis confidence="0.85">
      The "invalid credentials" error typically indicates either:
      1. Incorrect password (despite user confidence)
      2. Account lockout due to multiple failed attempts
      3. Email address mismatch
    </analysis>
    
    Let's try a password reset to be safe:
    
    <steps>
      <step number="1" required="true">Go to the login page</step>
      <step number="2" required="true">Click "Forgot Password"</step>
      <step number="3" required="true">Enter your email address</step>
      <step number="4" required="false">Check your email for reset link</step>
    </steps>
    
    <note type="warning">
      If you don't receive the email within 5 minutes, check your spam folder.
    </note>
  </message>
</conversation>`,

  aiReasoning: `
<reasoning task="climate-policy-analysis" complexity="high" confidence="0.78">
  <problem>
    How can governments effectively balance economic growth with climate change mitigation?
  </problem>
  
  <analysis>
    <factor weight="0.9" category="economic">
      <evidence source="OECD-2023" strength="strong">
        Carbon pricing mechanisms have shown 15-20% emissions reduction without 
        significant GDP impact in 12 developed countries.
      </evidence>
      <evidence source="McKinsey-2024" strength="medium">
        Green technology investments create 2.3x more jobs than fossil fuel investments.
      </evidence>
      <counterpoint>
        Short-term costs may impact competitive advantage in global markets.
      </counterpoint>
    </factor>
    
    <factor weight="0.8" category="environmental">
      <evidence source="IPCC-AR6" strength="strong">
        Immediate action needed to limit warming to 1.5°C - delay increases costs exponentially.
      </evidence>
      <evidence source="Nature-2024" strength="strong">
        Tipping points could trigger irreversible climate changes within decade.
      </evidence>
    </factor>
    
    <factor weight="0.7" category="political">
      <evidence source="polling-data" strength="medium">
        Public support for climate action increases when economic benefits are highlighted.
      </evidence>
      <counterpoint>
        Political cycles often conflict with long-term climate planning requirements.
      </counterpoint>
    </factor>
  </analysis>
  
  <synthesis>
    <approach name="graduated-carbon-pricing" feasibility="high">
      Implement carbon pricing starting low and increasing predictably over time.
      
      <benefits>
        <benefit>Provides business certainty for investment planning</benefit>
        <benefit>Generates revenue for green transition funding</benefit>
        <benefit>Maintains international competitiveness initially</benefit>
      </benefits>
      
      <risks>
        <risk mitigation="border-adjustments">Carbon leakage to non-pricing countries</risk>
        <risk mitigation="revenue-recycling">Regressive impact on low-income households</risk>
      </risks>
    </approach>
    
    <approach name="green-industrial-policy" feasibility="medium">
      Direct government investment in clean technology development and deployment.
      
      <benefits>
        <benefit>Creates first-mover advantage in growing global markets</benefit>
        <benefit>Addresses market failures in R&D and infrastructure</benefit>
      </benefits>
      
      <risks>
        <risk mitigation="performance-metrics">Government picking winners inefficiently</risk>
        <risk mitigation="sunset-clauses">Creating permanent subsidy dependencies</risk>
      </risks>
    </approach>
  </synthesis>
  
  <conclusion confidence="0.82">
    <recommendation priority="1">
      Implement hybrid approach combining carbon pricing with targeted industrial policy.
    </recommendation>
    
    <timeline>
      <phase duration="2-years">Pilot carbon pricing in select sectors</phase>
      <phase duration="5-years">Full economy carbon pricing with border adjustments</phase>
      <phase duration="ongoing">Adaptive management based on outcomes</phase>
    </timeline>
    
    <success-metrics>
      <metric target="20%" timeframe="5-years">Emissions reduction vs baseline</metric>
      <metric target="positive" timeframe="3-years">Net employment impact</metric>
      <metric target="maintain" timeframe="ongoing">GDP growth trajectory</metric>
    </success-metrics>
  </conclusion>
</reasoning>`,

  codeGeneration: `
<code-generation task="user-authentication-system" language="typescript">
  <requirements>
    <requirement priority="high" category="security">
      Implement JWT-based authentication with refresh tokens
    </requirement>
    <requirement priority="high" category="validation">
      Email and password validation with strength requirements
    </requirement>
    <requirement priority="medium" category="features">
      Password reset functionality via email
    </requirement>
    <requirement priority="low" category="features">
      Social login integration (Google, GitHub)
    </requirement>
  </requirements>
  
  <architecture>
    <layer name="controller" responsibility="HTTP request handling">
      <component>AuthController</component>
      <component>UserController</component>
    </layer>
    
    <layer name="service" responsibility="Business logic">
      <component>AuthService</component>
      <component>EmailService</component>
      <component>TokenService</component>
    </layer>
    
    <layer name="repository" responsibility="Data access">
      <component>UserRepository</component>
      <component>TokenRepository</component>
    </layer>
  </architecture>
  
  <implementation>
    <file path="src/auth/AuthController.ts">
      <imports>
        <import>import { Request, Response } from 'express';</import>
        <import>import { AuthService } from './AuthService';</import>
        <import>import { validateEmail, validatePassword } from '../utils/validation';</import>
      </imports>
      
      <class name="AuthController">
        <method name="register" access="public" async="true">
          <parameter>req: Request</parameter>
          <parameter>res: Response</parameter>
          <body>
            const { email, password } = req.body;
            
            if (!validateEmail(email)) {
              return res.status(400).json({ error: 'Invalid email format' });
            }
            
            if (!validatePassword(password)) {
              return res.status(400).json({ 
                error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers' 
              });
            }
            
            try {
              const user = await this.authService.register(email, password);
              const tokens = await this.authService.generateTokens(user.id);
              
              res.status(201).json({
                user: { id: user.id, email: user.email },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
              });
            } catch (error) {
              res.status(409).json({ error: 'User already exists' });
            }
          </body>
        </method>
        
        <method name="login" access="public" async="true">
          <parameter>req: Request</parameter>
          <parameter>res: Response</parameter>
          <body>
            const { email, password } = req.body;
            
            try {
              const user = await this.authService.authenticate(email, password);
              const tokens = await this.authService.generateTokens(user.id);
              
              res.json({
                user: { id: user.id, email: user.email },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
              });
            } catch (error) {
              res.status(401).json({ error: 'Invalid credentials' });
            }
          </body>
        </method>
      </class>
    </file>
    
    <file path="src/auth/AuthService.ts">
      <imports>
        <import>import bcrypt from 'bcrypt';</import>
        <import>import jwt from 'jsonwebtoken';</import>
        <import>import { UserRepository } from '../repositories/UserRepository';</import>
      </imports>
      
      <class name="AuthService">
        <method name="register" access="public" async="true">
          <parameter>email: string</parameter>
          <parameter>password: string</parameter>
          <body>
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
              throw new Error('User already exists');
            }
            
            const hashedPassword = await bcrypt.hash(password, 12);
            return await this.userRepository.create({
              email,
              password: hashedPassword,
              createdAt: new Date()
            });
          </body>
        </method>
        
        <method name="authenticate" access="public" async="true">
          <parameter>email: string</parameter>
          <parameter>password: string</parameter>
          <body>
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
              throw new Error('Invalid credentials');
            }
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
              throw new Error('Invalid credentials');
            }
            
            return user;
          </body>
        </method>
      </class>
    </file>
  </implementation>
  
  <testing>
    <test-case name="successful-registration" category="integration">
      <setup>Valid email and password</setup>
      <action>POST /auth/register</action>
      <expected>201 status with user and tokens</expected>
    </test-case>
    
    <test-case name="duplicate-registration" category="integration">
      <setup>Email already exists in database</setup>
      <action>POST /auth/register</action>
      <expected>409 status with error message</expected>
    </test-case>
    
    <test-case name="invalid-password-format" category="validation">
      <setup>Password too short or missing requirements</setup>
      <action>POST /auth/register</action>
      <expected>400 status with validation error</expected>
    </test-case>
  </testing>
  
  <deployment>
    <environment name="development">
      <config>JWT_SECRET from environment variable</config>
      <config>Database connection to local PostgreSQL</config>
    </environment>
    
    <environment name="production">
      <config>JWT_SECRET from secure vault</config>
      <config>Database connection to managed PostgreSQL</config>
      <config>Rate limiting enabled</config>
      <config>HTTPS enforcement</config>
    </environment>
  </deployment>
</code-generation>`,
};

async function runTest(name, template, parserConfig = {}) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST: ${name.toUpperCase()}`);
  console.log(`${'='.repeat(60)}\n`);

  // Create parser with custom configuration
  const parser = new LLMStreamParser({
    enableNested: true,
    maxDepth: 10,
    caseSensitive: false,
    bufferSize: 8192,
    ...parserConfig,
  });

  const events = [];
  const errors = [];
  const completedTags = [];

  parser.on('tag_opened', tag => {
    events.push({ type: 'opened', tag: tag.tagName, depth: parser.getCurrentDepth() });
    console.log(`🔓 Tag opened: <${tag.tagName}> (depth: ${parser.getCurrentDepth()})`);
  });

  parser.on('tag_completed', tag => {
    events.push({ type: 'completed', tag: tag.tagName, contentLength: tag.content?.length || 0 });
    completedTags.push(tag);
    console.log(`✅ Tag completed: <${tag.tagName}> with ${tag.content?.length || 0} chars`);

    if (tag.attributes && Object.keys(tag.attributes).length > 0) {
      console.log(`   📋 Attributes:`, JSON.stringify(tag.attributes, null, 2));
    }
    if (tag.content && tag.content.length > 50) {
      console.log(`   📝 Content preview: "${tag.content.substring(0, 50)}..."`);
    } else if (tag.content) {
      console.log(`   📝 Content: "${tag.content}"`);
    }
  });

  parser.on('parsing_complete', tags => {
    events.push({ type: 'complete', totalTags: tags.length });
    console.log(`🎉 Parsing complete! Total tags: ${tags.length}`);
  });

  parser.on('parse_error', error => {
    errors.push(error);
    console.log(`❌ Parse error: ${error.message}`);
  });

  if (name.includes('chat') || name.includes('conversation')) {
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
  } else if (name.includes('reasoning')) {
    parser.defineTag({
      tagName: 'reasoning',
      transformAttributes: AttributeTransformers.convertTypes({
        confidence: 'number',
        complexity: 'string',
      }),
    });
    parser.defineTag({ tagName: 'problem' });
    parser.defineTag({ tagName: 'analysis' });
    parser.defineTag({ tagName: 'factor' });
    parser.defineTag({ tagName: 'evidence' });
    parser.defineTag({ tagName: 'counterpoint' });
    parser.defineTag({ tagName: 'synthesis' });
    parser.defineTag({ tagName: 'approach' });
    parser.defineTag({ tagName: 'benefits' });
    parser.defineTag({ tagName: 'benefit' });
    parser.defineTag({ tagName: 'risks' });
    parser.defineTag({ tagName: 'risk' });
    parser.defineTag({ tagName: 'conclusion' });
    parser.defineTag({ tagName: 'recommendation' });
    parser.defineTag({ tagName: 'timeline' });
    parser.defineTag({ tagName: 'phase' });
    parser.defineTag({ tagName: 'success-metrics' });
    parser.defineTag({ tagName: 'metric' });
  } else if (name.includes('code')) {
    parser.defineTag({ tagName: 'code-generation' });
    parser.defineTag({ tagName: 'requirements' });
    parser.defineTag({ tagName: 'requirement' });
    parser.defineTag({ tagName: 'architecture' });
    parser.defineTag({ tagName: 'layer' });
    parser.defineTag({ tagName: 'component' });
    parser.defineTag({ tagName: 'implementation' });
    parser.defineTag({ tagName: 'file' });
    parser.defineTag({ tagName: 'imports' });
    parser.defineTag({ tagName: 'import' });
    parser.defineTag({ tagName: 'class' });
    parser.defineTag({ tagName: 'method' });
    parser.defineTag({ tagName: 'parameter' });
    parser.defineTag({ tagName: 'body' });
    parser.defineTag({ tagName: 'testing' });
    parser.defineTag({ tagName: 'test-case' });
    parser.defineTag({ tagName: 'setup' });
    parser.defineTag({ tagName: 'action' });
    parser.defineTag({ tagName: 'expected' });
    parser.defineTag({ tagName: 'deployment' });
    parser.defineTag({ tagName: 'environment' });
    parser.defineTag({ tagName: 'config' });
  }

  console.log(`📋 Registered ${parser.getRegisteredTags().length} tag types\n`);

  console.log(`🌊 Starting streaming simulation...\n`);
  const startTime = Date.now();

  const chunks = [];
  const chunkSize = Math.floor(Math.random() * 20) + 10; // 10-30 characters per chunk

  for (let i = 0; i < template.length; i += chunkSize) {
    chunks.push(template.slice(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i++) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10)); // 10-40ms delay

    console.log(`📦 Chunk ${i + 1}/${chunks.length}: "${chunks[i].replace(/\n/g, '\\n')}"`);
    parser.parse(chunks[i]);
  }

  parser.finalize();
  const endTime = Date.now();

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 RESULTS SUMMARY`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`⏱️  Processing time: ${endTime - startTime}ms`);
  console.log(`📦 Total chunks: ${chunks.length}`);
  console.log(`📝 Content length: ${template.length} characters`);
  console.log(`🏷️  Tags completed: ${completedTags.length}`);
  console.log(`🚨 Errors: ${errors.length}`);
  console.log(`📈 Events fired: ${events.length}`);

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
  const sampleTags = completedTags.slice(0, 3);
  sampleTags.forEach((tag, index) => {
    console.log(`\n   ${index + 1}. <${tag.tagName}>`);
    if (tag.attributes && Object.keys(tag.attributes).length > 0) {
      console.log(`      Attributes: ${JSON.stringify(tag.attributes, null, 6)}`);
    }
    if (tag.content) {
      const preview =
        tag.content.length > 100 ? tag.content.substring(0, 100) + '...' : tag.content;
      console.log(`      Content: "${preview}"`);
    }
  });

  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.message}`);
    });
  }

  return {
    completedTags,
    events,
    errors,
    stats,
    processingTime: endTime - startTime,
    chunks: chunks.length,
  };
}

async function main() {
  try {
    console.log('Starting comprehensive real-world tests...\n');

    const results = {};

    results.chat = await runTest('Chat Conversation Support', templates.chatConversation, {
      caseSensitive: false,
    });

    results.reasoning = await runTest('AI Reasoning Analysis', templates.aiReasoning, {
      maxDepth: 15,
    });

    results.code = await runTest('Code Generation System', templates.codeGeneration, {
      bufferSize: 16384,
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 OVERALL TEST SUMMARY`);
    console.log(`${'='.repeat(60)}`);

    const totalTags = Object.values(results).reduce(
      (sum, result) => sum + result.completedTags.length,
      0
    );
    const totalErrors = Object.values(results).reduce(
      (sum, result) => sum + result.errors.length,
      0
    );
    const avgProcessingTime =
      Object.values(results).reduce((sum, result) => sum + result.processingTime, 0) /
      Object.keys(results).length;

    console.log(`📋 Tests completed: ${Object.keys(results).length}`);
    console.log(`🏷️  Total tags parsed: ${totalTags}`);
    console.log(`🚨 Total errors: ${totalErrors}`);
    console.log(`⚡ Average processing time: ${Math.round(avgProcessingTime)}ms`);
    console.log(`✅ Success rate: ${((totalTags / (totalTags + totalErrors)) * 100).toFixed(1)}%`);

    console.log(`\n🎉 All real-world tests completed successfully!`);
  } catch (error) {
    console.error(`💥 Test execution failed:`, error);
    process.exit(1);
  }
}

main();
