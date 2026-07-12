const { generate } = require('./gemini.service');

function parseAIResponse(text) {
  // Strip markdown fences
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Extract just the JSON object
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  cleaned = cleaned.slice(start, end + 1);

  // Fix escaped quotes inside values
  cleaned = cleaned.replace(/\\"/g, '"');

  return JSON.parse(cleaned);
}

async function analyzeLogs(logs, context = {}) {
  if (!logs?.length) throw new Error('No logs provided for analysis');

  const logSample = logs.slice(0, 30).map((l, i) =>
    `[${i + 1}] [${l.timestamp}] [${l.level?.toUpperCase()}] ${l.service} — ${l.message}` +
    (l.error    ? `\n     Error: ${l.error}` : '') +
    (l.endpoint ? `\n     Endpoint: ${l.method} ${l.endpoint} → ${l.statusCode}` : '')
  ).join('\n');

  const prompt = `You are an expert DevOps engineer. Analyze these application logs and provide a clear diagnosis.

SERVICE: ${context.service || 'unknown'}
TOTAL LOGS: ${logs.length}

LOGS:
${logSample}

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation. Start your response with { and end with }. Use this exact format:
{
  "summary": "2-3 sentence plain-English summary",
  "severity": "low | medium | high | critical",
  "rootCause": "your best assessment of the root cause",
  "affectedComponents": ["component1", "component2"],
  "immediateActions": ["action1", "action2"],
  "preventionTips": ["tip1", "tip2"]
}`;

  const raw = await generate(prompt, { temperature: 0.2 });
  try {
    return parseAIResponse(raw);
  } catch {
    return { summary: raw, parseError: true };
  }
}

async function generateIncidentSummary(incident, relatedLogs = []) {
  const logLines = relatedLogs.slice(0, 20)
    .map(l => `  - [${l.level}] ${l.message}`)
    .join('\n');

  const prompt = `You are an SRE writing an incident report.

INCIDENT:
Title: ${incident.title}
Severity: ${incident.severity}
Service: ${incident.service}
Description: ${incident.description}

${relatedLogs.length ? `RELATED LOGS:\n${logLines}` : ''}

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation. Start your response with { and end with }.
{
  "headline": "one sentence executive summary",
  "impact": "who/what was affected",
  "rootCause": "technical root cause",
  "resolution": "what should be done to resolve it",
  "lessonsLearned": "what can be improved"
}`;

  const raw = await generate(prompt, { temperature: 0.3, maxOutputTokens: 1500 });
  try {
    return parseAIResponse(raw);
  } catch {
    return { headline: raw, parseError: true };
  }
}

async function generateRecommendations(stats) {
  const prompt = `You are a senior backend engineer reviewing application performance data.

STATS (last 24 hours):
${JSON.stringify(stats, null, 2)}

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation. Start your response with { and end with }.

{
  "performance": [
    { "priority": "high|medium|low", "issue": "...", "recommendation": "..." }
  ],
  "security": [
    { "priority": "high|medium|low", "issue": "...", "recommendation": "..." }
  ],
  "reliability": [
    { "priority": "high|medium|low", "issue": "...", "recommendation": "..." }
  ]
}`;

  const raw = await generate(prompt, { temperature: 0.4, maxOutputTokens: 2000 });
  try {
    return parseAIResponse(raw);
  } catch {
    return { raw, parseError: true };
  }
}

async function explainError(error, context = {}) {
  const prompt = `Explain this error in plain English for a developer.

ERROR: ${error.message || error}
${error.stack  ? `STACK: ${error.stack.split('\n').slice(0, 5).join('\n')}` : ''}
${context.service  ? `SERVICE: ${context.service}` : ''}
${context.statusCode ? `STATUS: ${context.statusCode}` : ''}

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation. Start your response with { and end with }.
{
  "plainEnglish": "what happened in simple terms",
  "likelyCauses": ["cause1", "cause2"],
  "howToFix": ["step1", "step2", "step3"]
}`;

  const raw = await generate(prompt, { temperature: 0.2 });
  try {
    return parseAIResponse(raw);
  } catch {
    return { plainEnglish: raw, parseError: true };
  }
}

async function answerAssistantQuery(question, context = {}) {
  const { errorLogs = [], incidents = [], performanceSummary = {} } = context;

  const errorLogLines = errorLogs.slice(0, 20).map(l =>
    `- [${l.timestamp}] [${l.service}] ${l.message}`
  ).join('\n') || 'No recent error logs.';

  const incidentLines = incidents.slice(0, 10).map(i =>
    `- [${i.severity}] [${i.status}] ${i.title} (service: ${i.service}, created: ${i.createdAt})`
  ).join('\n') || 'No recent incidents.';

  const prompt = `You are an AI assistant embedded in a developer observability platform. A developer is asking you a natural language question about their system. Answer using ONLY the real data provided below — do not invent specifics that aren't present. If the data doesn't contain enough information to fully answer, say so honestly and suggest what to check next.

QUESTION: "${question}"

RECENT ERROR LOGS (last 24h, up to 20):
${errorLogLines}

RECENT INCIDENTS (up to 10):
${incidentLines}

PERFORMANCE SUMMARY (last 24h):
${JSON.stringify(performanceSummary, null, 2)}

Respond in plain, conversational English — like a helpful engineer explaining this to a colleague. Do not use JSON or markdown formatting. Keep it concise (3-6 sentences unless the question needs more detail).`;

  const answer = await generate(prompt, { temperature: 0.3, maxOutputTokens: 800 });
  return answer.trim();
}
module.exports = {
  analyzeLogs,
  generateIncidentSummary,
  generateRecommendations,
  explainError,
  answerAssistantQuery,
};