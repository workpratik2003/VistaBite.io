'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ApiTestPage() {
  const [apiKey, setApiKey] = useState('')
  const [apiEndpoint, setApiEndpoint] = useState('https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag')
  const [apiHost, setApiHost] = useState('instagram-scraper-api2.p.rapidapi.com')
  const [hashtag, setHashtag] = useState('foodpune')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/verify-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          apiEndpoint: `${apiEndpoint}?hashtag=${hashtag}`,
          apiHost,
          hashtag,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'API test failed')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">RapidAPI Key Tester</h1>

        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div>
            <label className="block text-sm font-medium mb-2">Your RapidAPI Key</label>
            <Input
              type="password"
              placeholder="f299fd0caamsh3adb9635d60466cp198412jsnc8df1ad7c5da"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">API Endpoint</label>
            <Input
              placeholder="https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get this from your RapidAPI API documentation page
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">API Host</label>
            <Input
              placeholder="instagram-scraper-api2.p.rapidapi.com"
              value={apiHost}
              onChange={(e) => setApiHost(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get this from your RapidAPI API documentation page
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Test Hashtag</label>
            <Input
              placeholder="foodpune"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
            />
          </div>

          <Button
            onClick={handleTest}
            disabled={!apiKey || loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test API Key'}
          </Button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">Success! ✓</p>
            <p className="text-green-700 mt-1">Status: {result.status}</p>
            <p className="text-green-700">Message: {result.message}</p>
            <div className="mt-3 bg-white p-3 rounded border text-sm font-mono">
              <p className="font-semibold mb-2">Response Keys:</p>
              <p>{result.responseKeys?.join(', ')}</p>
              <p className="font-semibold mt-2 mb-2">Sample Data:</p>
              <p className="whitespace-pre-wrap text-xs">{result.sampleData}</p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="font-semibold text-blue-900 mb-3">How to get these details:</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Go to <a href="https://rapidapi.com/hub" target="_blank" rel="noopener noreferrer" className="underline">rapidapi.com/hub</a></li>
            <li>Find your Instagram API subscription</li>
            <li>Click on it and look for "Endpoints" tab</li>
            <li>Copy the endpoint URL and host from the documentation</li>
            <li>Paste them above and test</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
