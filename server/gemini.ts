import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import { promisify } from "util";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

// Text generation schemas
const textGenerationRequestSchema = z.object({
  assetId: z.string().uuid(),
  count: z.number().min(1).max(10).default(3),
  constraints: z.object({
    headlineMaxWords: z.number().optional(),
    subheadlineMaxChars: z.number().optional(),
    ctaPhrasesAllowed: z.array(z.string()).optional(),
    tone: z.enum(["conversational", "direct", "playful", "formal"]).optional(),
    bannedPhrases: z.array(z.string()).optional(),
  }).optional(),
});

const textVariantSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  cta: z.string(),
});

const textGenerationResponseSchema = z.object({
  variants: z.array(textVariantSchema),
});

// Image generation schemas
const imageGenerationRequestSchema = z.object({
  assetId: z.string().uuid(),
  count: z.number().min(1).max(5).default(1),
  seedImageUrl: z.string().url().optional(),
});

export type TextGenerationRequest = z.infer<typeof textGenerationRequestSchema>;
export type ImageGenerationRequest = z.infer<typeof imageGenerationRequestSchema>;
export type TextVariant = z.infer<typeof textVariantSchema>;

export async function generateTextVariants(
  request: TextGenerationRequest,
  assetContext: {
    name: string;
    defaultBindings: any;
    styleHints: any;
    projectName: string;
    clientName: string;
  }
): Promise<TextVariant[]> {
  try {
    const { count, constraints } = request;
    
    const systemPrompt = `You are an expert copywriter creating ad variants. 
Generate ${count} different text variants for an advertisement based on the provided context.
Each variant should include a headline, subheadline, and call-to-action (CTA).

Context:
- Asset: ${assetContext.name}
- Project: ${assetContext.projectName}
- Client: ${assetContext.clientName}
- Default bindings: ${JSON.stringify(assetContext.defaultBindings)}
- Style hints: ${JSON.stringify(assetContext.styleHints)}

Constraints:
${constraints?.headlineMaxWords ? `- Headline: max ${constraints.headlineMaxWords} words` : ''}
${constraints?.subheadlineMaxChars ? `- Subheadline: max ${constraints.subheadlineMaxChars} characters` : ''}
${constraints?.tone ? `- Tone: ${constraints.tone}` : ''}
${constraints?.ctaPhrasesAllowed ? `- Allowed CTA phrases: ${constraints.ctaPhrasesAllowed.join(', ')}` : ''}
${constraints?.bannedPhrases ? `- Banned phrases: ${constraints.bannedPhrases.join(', ')}` : ''}

Respond with valid JSON only in this exact format:
{"variants": [{"headline": "...", "subheadline": "...", "cta": "..."}, ...]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            variants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  subheadline: { type: "string" },
                  cta: { type: "string" },
                },
                required: ["headline", "subheadline", "cta"],
              },
            },
          },
          required: ["variants"],
        },
      },
      contents: systemPrompt,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = textGenerationResponseSchema.parse(JSON.parse(rawJson));
    return parsed.variants;
  } catch (error) {
    throw new Error(`Failed to generate text variants: ${error}`);
  }
}

export async function generateImages(
  request: ImageGenerationRequest,
  assetContext: {
    name: string;
    styleHints: any;
    projectName: string;
    clientName: string;
  }
): Promise<string[]> {
  try {
    const { count, seedImageUrl } = request;
    
    const basePrompt = `Create a professional advertisement background image for:
- Asset: ${assetContext.name}
- Project: ${assetContext.projectName}
- Client: ${assetContext.clientName}
- Style hints: ${JSON.stringify(assetContext.styleHints)}

Requirements:
- High quality, professional advertisement background
- Suitable for text overlay (ensure text-safe areas)
- Match the brand palette and style hints provided
- No embedded text or typography in the image
- Maintain visual hierarchy for headline, subheadline, and CTA placement
- Clean, modern aesthetic suitable for digital advertising

${seedImageUrl ? `Reference image style: ${seedImageUrl}` : ''}`;

    const imageUrls: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-preview-image-generation",
          contents: [{ role: "user", parts: [{ text: basePrompt }] }],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        });

        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
          continue;
        }

        const content = candidates[0].content;
        if (!content || !content.parts) {
          continue;
        }

        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            // In a real implementation, you would upload this to GCS
            // For now, we'll create a data URL
            const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            imageUrls.push(dataUrl);
            break;
          }
        }
      } catch (error) {
        console.error(`Failed to generate image ${i + 1}:`, error);
      }
    }

    if (imageUrls.length === 0) {
      throw new Error("Failed to generate any images");
    }

    return imageUrls;
  } catch (error) {
    throw new Error(`Failed to generate images: ${error}`);
  }
}

export function validateTextGenerationRequest(data: unknown): TextGenerationRequest {
  return textGenerationRequestSchema.parse(data);
}

export function validateImageGenerationRequest(data: unknown): ImageGenerationRequest {
  return imageGenerationRequestSchema.parse(data);
}

// Template generation schemas
const templateGenerationResponseSchema = z.object({
  templateSvg: z.string(),
  templateFonts: z.array(z.object({
    family: z.string(),
    url: z.string().optional(),
    weight: z.string().optional(),
    style: z.string().optional(),
  })),
  defaultBindings: z.object({
    headline: z.string(),
    subheadline: z.string(),
    cta: z.string(),
    image: z.string().optional(),
  }),
  styleHints: z.object({
    palette: z.array(z.string()),
    brand: z.string(),
    notes: z.string(),
  }),
});

export type TemplateGenerationResponse = z.infer<typeof templateGenerationResponseSchema>;

// Helper function to download and convert image to base64
async function downloadImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    https.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64Data = buffer.toString('base64');
        const contentType = response.headers['content-type'] || 'image/jpeg';
        resolve({ data: base64Data, mimeType: contentType });
      });
    }).on('error', reject);
  });
}

// Analyze master asset image and generate SVG template
export async function generateTemplateFromMasterAsset(
  masterAssetUrl: string,
  assetName: string,
  projectContext: {
    name: string;
    brief?: string;
    clientName: string;
  }
): Promise<TemplateGenerationResponse> {
  try {
    // Download and convert image to base64
    const { data: imageData, mimeType } = await downloadImageAsBase64(masterAssetUrl);

    const analysisPrompt = `Analyze this image and create an SVG template that mimics its layout and design for advertisement variants.

Context:
- Asset name: ${assetName}
- Project: ${projectContext.name}
- Client: ${projectContext.clientName}
${projectContext.brief ? `- Brief: ${projectContext.brief}` : ''}

Instructions:
1. Analyze the image's composition, layout, colors, typography, and visual hierarchy
2. Create an SVG template (400x300 or similar aspect ratio) that captures the design essence
3. Use token placeholders like {{headline}}, {{subheadline}}, {{cta}} for text content
4. Extract the main color palette from the image
5. Suggest appropriate fonts based on the visual style
6. Provide default text bindings that match the content type/industry
7. Include style hints describing the brand personality and design approach

The SVG should be production-ready with proper text positioning, colors, and layout structure.
Respond with valid JSON only in this exact format:
{
  "templateSvg": "<svg>...</svg>",
  "templateFonts": [{"family": "Arial", "url": "", "weight": "normal", "style": "normal"}],
  "defaultBindings": {"headline": "...", "subheadline": "...", "cta": "...", "image": ""},
  "styleHints": {"palette": ["#color1", "#color2"], "brand": "description", "notes": "design notes"}
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            templateSvg: { type: "string" },
            templateFonts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  family: { type: "string" },
                  url: { type: "string" },
                  weight: { type: "string" },
                  style: { type: "string" }
                },
                required: ["family"]
              }
            },
            defaultBindings: {
              type: "object",
              properties: {
                headline: { type: "string" },
                subheadline: { type: "string" },
                cta: { type: "string" },
                image: { type: "string" }
              },
              required: ["headline", "subheadline", "cta"]
            },
            styleHints: {
              type: "object",
              properties: {
                palette: { 
                  type: "array",
                  items: { type: "string" }
                },
                brand: { type: "string" },
                notes: { type: "string" }
              },
              required: ["palette", "brand", "notes"]
            }
          },
          required: ["templateSvg", "templateFonts", "defaultBindings", "styleHints"]
        }
      },
      contents: [
        {
          inlineData: {
            data: imageData,
            mimeType: mimeType,
          },
        },
        analysisPrompt,
      ],
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    console.log(`Template Generation Response: ${rawJson}`);

    const parsedResponse = JSON.parse(rawJson);
    return templateGenerationResponseSchema.parse(parsedResponse);

  } catch (error) {
    console.error("Template generation error:", error);
    throw new Error(`Failed to generate template from master asset: ${error}`);
  }
}
