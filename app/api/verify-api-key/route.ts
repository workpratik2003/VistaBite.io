import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiEndpoint, apiHost, hashtag } = await request.json()

    if (!apiKey || !apiEndpoint || !apiHost) {
      return NextResponse.json(
        { error: 'Missing apiKey, apiEndpoint, or apiHost' },
        { status: 400 }
      )
    }

    console.log('[v0] Testing API with:')
    console.log('[v0] Endpoint:', apiEndpoint)
    console.log('[v0] Host:', apiHost)
    console.log('[v0] Hashtag:', hashtag || 'foodpune')

    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost,
      },
      next: { revalidate: 0 },
    })

    const data = await response.json()

    console.log('[v0] API Response Status:', response.status)
    console.log('[v0] API Response Data Keys:', Object.keys(data))

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      message: response.ok ? 'API key and endpoint are working!' : 'API returned an error',
      responseKeys: Object.keys(data),
      sampleData: JSON.stringify(data).substring(0, 500),
    })
  } catch (error) {
    console.error('[v0] API test error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Test failed',
        details: error,
      },
      { status: 500 }
    )
  }
}
