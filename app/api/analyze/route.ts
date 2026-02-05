import { NextRequest, NextResponse } from 'next/server';

interface VLMessage {
  role: 'system' | 'user';
  content: string | Array<{ type: string; image?: string; text?: string }>;
}

interface VLRequest {
  model: string;
  messages: VLMessage[];
}

interface ParsedPrompt {
  subject?: string;
  environment?: string;
  composition?: string;
  lighting?: string;
  mood?: string;
  style?: string;
  camera?: string;
  color?: string;
}

const SYSTEM_PROMPT = `Analyze this image and extract the following visual elements:
- Subject: Main subject or focus of the image
- Environment: Background setting or scene
- Composition: How elements are arranged (rule of thirds, center, etc.)
- Lighting: Light sources and quality (soft, harsh, backlit, etc.)
- Mood: Emotional atmosphere or feeling
- Style: Artistic style (photorealistic, anime, oil painting, etc.)
- Camera: Camera settings if apparent (lens, aperture, focal length)
- Color: Color palette and grading

Return ONLY a JSON object with these fields. Use empty string if not applicable.`;

async function callQwenVL(imageBase64: string, apiKey: string): Promise<ParsedPrompt> {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-vl-plus',
      input: {
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              { image: imageBase64 },
              { text: 'Analyze this image and return structured prompt data as JSON.' },
            ],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.output?.choices?.[0]?.message?.content || '';
  
  // Try to parse JSON from the response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback to raw text parsing
  }

  return parseRawText(content);
}

async function callKimiVL(imageBase64: string, apiKey: string): Promise<ParsedPrompt> {
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'kimi-k2.5',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageBase64 } },
            { type: 'text', text: 'Analyze this image and return structured prompt data as JSON.' },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback to raw text parsing
  }

  return parseRawText(content);
}

function parseRawText(text: string): ParsedPrompt {
  const result: ParsedPrompt = {};
  
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^[-*]?\s*(\w+):\s*(.+)$/i);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      if (key in result || ['subject', 'environment', 'composition', 'lighting', 'mood', 'style', 'camera', 'color'].includes(key)) {
        (result as Record<string, string>)[key] = value;
      }
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, model = 'qwen' } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Validate model
    if (!['qwen', 'kimi'].includes(model)) {
      return NextResponse.json(
        { error: 'Invalid model. Use "qwen" or "kimi"' },
        { status: 400 }
      );
    }

    // Get API key based on model
    const apiKey = model === 'qwen' 
      ? process.env.QWEN_API_KEY 
      : process.env.KIMI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: `${model.toUpperCase()}_API_KEY not configured` },
        { status: 500 }
      );
    }

    // Call appropriate API
    let result: ParsedPrompt;
    try {
      result = model === 'qwen'
        ? await callQwenVL(image, apiKey)
        : await callKimiVL(image, apiKey);
    } catch (apiError) {
      console.error('API call failed:', apiError);
      return NextResponse.json(
        { error: 'Failed to analyze image', details: (apiError as Error).message },
        { status: 502 }
      );
    }

    // Generate natural language prompt
    const naturalPrompt = Object.entries(result)
      .filter(([, value]) => value && value.trim())
      .map(([, value]) => value)
      .join(', ');

    return NextResponse.json({
      success: true,
      data: {
        parsed: result,
        natural: naturalPrompt,
      },
      model,
    });

  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Rate limiting - simple in-memory implementation
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}
