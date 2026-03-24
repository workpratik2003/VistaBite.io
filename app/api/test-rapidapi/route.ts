import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

  if (!RAPIDAPI_KEY) {
    return NextResponse.json(
      { error: 'RAPIDAPI_KEY not set', status: 'MISSING_KEY' },
      { status: 400 }
    )
  }

  // Test the configured API
  const testConfigs = [
    {
      name: 'Instagram Scraper API 2',
      host: 'instagram-scraper-api2.p.rapidapi.com',
      url: 'https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=food',
    },
    {
      name: 'Instagram API (instagram47)',
      host: 'instagram47.p.rapidapi.com',
      url: 'https://instagram47.p.rapidapi.com/instagram_search_hashtag?ig_hashtag=food',
    },
    {
      name: 'Instagram Bulk Profile Scraper',
      host: 'instagram-bulk-profile-scrapper.p.rapidapi.com',
      url: 'https://instagram-bulk-profile-scrapper.p.rapidapi.com/search/hashtag?hashtag=food',
    },
  ]

  const results = []

  for (const config of testConfigs) {
    try {
      console.log(`[v0] Testing ${config.name}...`)

      const response = await fetch(config.url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': config.host,
        },
      })

      const data = await response.text()

      results.push({
        api: config.name,
        status: response.status,
        success: response.ok,
        dataPreview: data.substring(0, 200),
        fullStatus: response.statusText,
      })

      console.log(`[v0] ${config.name}: ${response.status}`)
    } catch (error) {
      results.push({
        api: config.name,
        status: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
      console.error(`[v0] ${config.name} error:`, error)
    }
  }

  return NextResponse.json({
    message: 'RapidAPI Diagnostic Results',
    rapidApiKeySet: !!RAPIDAPI_KEY,
    results,
    instructions: 'Check which API returns status 200 and use that configuration',
  })
}
