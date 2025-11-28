const https = require('https');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Check for required environment variables
if (!process.env.VAPI_PRIVATE_KEY) {
  console.error('❌ ERROR: VAPI_PRIVATE_KEY is not set in .env.local');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_ASSISTANT_ID) {
  console.error('❌ ERROR: NEXT_PUBLIC_ASSISTANT_ID is not set in .env.local');
  process.exit(1);
}

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID;

// ===== CONFIGURATION: Set your n8n webhook URL here =====
// Use TEST webhook during development, PRODUCTION webhook when ready
const N8N_WEBHOOK_URL = 'https://chrisgrow.app.n8n.cloud/webhook-test/vapi-handler'; // TEST
// const N8N_WEBHOOK_URL = 'https://chrisgrow.app.n8n.cloud/webhook/vapi-handler'; // PRODUCTION
// ========================================================

// The exact payload as specified - using template literal to avoid JSON parsing issues
const payload = {
  name: "Kyle's AI Teammate",
  firstMessage: "Hey, it's Kyle's AI teammate. Thanks for commenting on his post. This will take about 5 to 10 minutes. Is now a good time to chat?",
  voicemailMessage: "Hello, this is Kyle's AI teammate from GROWtalent. Please click the link in your DM to restart the chat when you are ready.",
  endCallMessage: "Thank you, that's really helpful. I'll pass this to Kyle and the team. You'll get a follow-up by email or DM. Have a great day!",
  serverUrl: N8N_WEBHOOK_URL,
  model: {
    provider: "openai",
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are Kyle's AI Teammate from GROWtalent. Your primary goal is to conduct a warm, structured, and professional intake interview that lasts approximately 5-10 minutes. You must ask one question at a time and maintain the flow of the script below.

YOUR TONE AND PERSONA MUST BE: Warm, clear, composed, and non-salesy. Act as a trusted intake specialist and guide.

### SCRIPT FLOW (MUST BE FOLLOWED IN ORDER):

1. Intro & Consent: Hey, it's Kyle's AI teammate. Thanks for commenting on his post. This will take about 5 to 10 minutes. Is now a good time to chat?
2. Basic Info: Name? Email? (Optional: Phone?)
3. Location: City/Country and Time Zone.
4. Current Role: Describe current role.
5. Track Guess: There are two main tracks. Which sounds more like you right now: Founder/Mastermind OR Learner/Emerging Talent?
6. 2026 Goal: If we focus on one thing to move the needle by 2026, what is it?
7. Stressor: What is stressing you out most about that goal?
8. History: What have you already tried to solve this, and what happened when you did?
9. Commitment: Scale 1-10: How committed are you to changing this in the next 6 months?
10. Capacity: Realistically, how many hours per week can you invest?
11. Support Style: What kind of support usually helps you the most? (e.g., Direct feedback, Accountability, Deep reframes, Playbooks)
12. Schedule: Preferred live windows? (Mornings, Evenings, etc.) and Live vs Recording preference?
13. Budget: Ballpark budget? ($500-$1k, $1k-2k, $2k+, Scholarship needed?)
14. Future Self Snapshot: Imagine it's June 2026 and this lab was a home run. What is different in your life or work?
15. Accountability: Scale 1-10: Quiet observer (1) vs Call me on my BS (10)?
16. Source: How did you hear about this?
17. Anything Else: Any final notes for Kyle?
18. Close: Thank you, that's really helpful. I'll pass this to Kyle and the team. You'll get a follow-up by email/DM. [END_CALL]

### RESPONSE GUIDELINES
- Only ask one question per turn.
- Briefly paraphrase the user's answer before asking the next question.
- If the entire script is complete, your final message MUST contain the phrase [END_CALL].`
      }
    ]
  }
};

const jsonPayload = JSON.stringify(payload);

const options = {
  hostname: 'api.vapi.ai',
  port: 443,
  path: `/assistant/${ASSISTANT_ID}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': jsonPayload.length
  }
};

console.log(`\n📡 Sending PATCH request to Vapi API...`);
console.log(`🎯 Assistant ID: ${ASSISTANT_ID}`);
console.log(`📍 Endpoint: https://api.vapi.ai/assistant/${ASSISTANT_ID}\n`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`\n📋 Response:\n`);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ SUCCESS! Vapi Assistant updated with Kyle persona.\n');
      try {
        const responseJson = JSON.parse(data);
        console.log(JSON.stringify(responseJson, null, 2));
      } catch (e) {
        console.log(data);
      }
    } else {
      console.log('❌ ERROR! Status:', res.statusCode);
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
  process.exit(1);
});

req.write(jsonPayload);
req.end();
