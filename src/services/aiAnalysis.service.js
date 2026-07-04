const { generate } = require('./gemini.service');

function parseAIResponse(text) {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find the first { and last } to extract just the JSON
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');

  return JSON.parse(cleaned.slice(start, end + 1));
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

module.exports = {
  analyzeLogs,
  generateIncidentSummary,
  generateRecommendations,
  explainError,
};