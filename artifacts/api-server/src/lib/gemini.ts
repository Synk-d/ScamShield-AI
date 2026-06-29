import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY must be set.");
}

export const ai = new GoogleGenAI({ apiKey });

export interface ScamAnalysisResult {
  riskScore: number;
  scamType: string;
  severity: "low" | "medium" | "high" | "critical";
  redFlags: string[];
  explanation: string;
  recommendations: string[];
  attackerGoal: string;
}

function buildPrompt(inputType: string, content: string, simpleMode: boolean): string {
  const audienceNote = simpleMode
    ? "Explain everything as if talking to a 60-year-old with no tech background. Use simple, plain language. No jargon."
    : "Provide a detailed technical analysis suitable for a security-aware user.";

  const basePrompt = `You are an expert cybersecurity fraud analyst. Analyze the following ${inputType} submission for potential scams, phishing attempts, fraud, or malicious intent.

${audienceNote}

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "riskScore": <integer 0-100, where 0=completely safe, 100=definite scam>,
  "scamType": <string, one of: "Safe", "Phishing", "Job Scam", "UPI Fraud", "Investment Scam", "QR Code Scam", "Romance Scam", "Lottery Scam", "Tech Support Scam", "Identity Theft", "Malware Link", "Unknown Scam">,
  "severity": <"low" | "medium" | "high" | "critical">,
  "redFlags": <array of specific red flags found, empty array if none>,
  "explanation": <string explaining what this is and why it is or isn't a scam>,
  "recommendations": <array of action items for the user>,
  "attackerGoal": <string describing what the attacker is trying to achieve, or "N/A" if safe>
}

Severity guide:
- low: riskScore 0-29 (likely safe or very minor concern)
- medium: riskScore 30-59 (suspicious, proceed with caution)
- high: riskScore 60-79 (likely a scam, avoid)
- critical: riskScore 80-100 (definite scam, immediate danger)

Content to analyze:
${content}`;

  return basePrompt;
}

export async function analyzeContent(
  inputType: string,
  content: string,
  simpleMode: boolean
): Promise<ScamAnalysisResult> {
  const prompt = buildPrompt(inputType, content, simpleMode);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });

    const text = response.text ?? "";
    // Strip any markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned) as ScamAnalysisResult;
    return parsed;
  } catch (err) {
    logger.error({ err }, "Failed to analyze content with Gemini");
    throw new Error("AI analysis failed. Please try again.");
  }
}

export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  simpleMode: boolean
): Promise<ScamAnalysisResult> {
  const audienceNote = simpleMode
    ? "Explain everything as if talking to a 60-year-old with no tech background. Use simple, plain language. No jargon."
    : "Provide a detailed technical analysis suitable for a security-aware user.";

  const prompt = `You are an expert cybersecurity fraud analyst. Analyze this screenshot or image for potential scams, phishing, QR code fraud, fake websites, or malicious content.

${audienceNote}

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "riskScore": <integer 0-100>,
  "scamType": <"Safe" | "Phishing" | "Job Scam" | "UPI Fraud" | "Investment Scam" | "QR Code Scam" | "Romance Scam" | "Lottery Scam" | "Tech Support Scam" | "Identity Theft" | "Malware Link" | "Unknown Scam">,
  "severity": <"low" | "medium" | "high" | "critical">,
  "redFlags": <array of specific red flags visible in the image>,
  "explanation": <string explaining what you see and why it is or isn't suspicious>,
  "recommendations": <array of action items for the user>,
  "attackerGoal": <string describing attacker intent, or "N/A" if safe>
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: { maxOutputTokens: 8192 },
    });

    const text = response.text ?? "";
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned) as ScamAnalysisResult;
    return parsed;
  } catch (err) {
    logger.error({ err }, "Failed to analyze image with Gemini");
    throw new Error("AI image analysis failed. Please try again.");
  }
}
