import { generateObject } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const analysisSchema = z.object({
  isRelevant: z.boolean().describe('Whether the content is relevant to the search query'),
  isFoodRelated: z.boolean().describe('Whether the content is food/restaurant related'),
  confidence: z.number().min(0).max(1).describe('Confidence score of the analysis'),
  mealTypes: z.array(z.string()).describe('Detected meal types: breakfast, brunch, lunch, dinner, cafe, dessert'),
  location: z.string().optional().describe('Detected location or city name'),
  restaurantName: z.string().optional().describe('Detected restaurant or cafe name'),
  reasoning: z.string().describe('Brief explanation of the analysis'),
})

export async function analyzeReelContent(
  caption: string,
  hashtags: string[],
  searchQuery: string,
  locationQuery: string,
  thumbnailUrl: string
): Promise<z.infer<typeof analysisSchema>> {
  const hashtagText = hashtags.join(', ')
  
  const prompt = `You are an expert at analyzing Instagram content for food and restaurant discovery.

User is searching for: "${searchQuery}"
User's location: "${locationQuery}"

Instagram Reel Details:
- Caption: "${caption}"
- Hashtags: ${hashtagText}
- Thumbnail URL: ${thumbnailUrl}

Analyze this reel and determine:
1. Is it food or restaurant-related?
2. Is it relevant to the user's search query and location?
3. What meal types does it represent (breakfast, brunch, lunch, dinner, cafe, dessert)?
4. Can you identify the restaurant name and specific location?
5. Your confidence level (0-1) that this is a good match

Be strict: Only mark as relevant if it's clearly about food/restaurants AND matches the search context.
Consider variations: "breakfast" matches "morning meal", "brunch", etc.
Location matching: Be flexible with location - if user searches "pune" and reel mentions "karvenagar pune", that's a match.`

  try {
    const { object } = await generateObject({
      model: groq('llama-3.2-90b-vision-preview'),
      schema: analysisSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: thumbnailUrl },
          ],
        },
      ],
    })

    return object
  } catch (error) {
    console.error('[v0] AI Analysis Error:', error)
    // Fallback to text-only analysis if vision fails
    return analyzeReelContentTextOnly(caption, hashtags, searchQuery, locationQuery)
  }
}

async function analyzeReelContentTextOnly(
  caption: string,
  hashtags: string[],
  searchQuery: string,
  locationQuery: string
): Promise<z.infer<typeof analysisSchema>> {
  const hashtagText = hashtags.join(', ')
  
  const prompt = `You are an expert at analyzing Instagram content for food and restaurant discovery.

User is searching for: "${searchQuery}"
User's location: "${locationQuery}"

Instagram Reel Details:
- Caption: "${caption}"
- Hashtags: ${hashtagText}

Analyze this reel and determine:
1. Is it food or restaurant-related?
2. Is it relevant to the user's search query and location?
3. What meal types does it represent (breakfast, brunch, lunch, dinner, cafe, dessert)?
4. Can you identify the restaurant name and specific location?
5. Your confidence level (0-1) that this is a good match

Be strict: Only mark as relevant if it's clearly about food/restaurants AND matches the search context.`

  const { object } = await generateObject({
    model: groq('llama-3.3-70b-versatile'),
    schema: analysisSchema,
    prompt,
  })

  return object
}
