'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Heart } from 'lucide-react'
import Image from 'next/image'

interface Creator {
  id: string
  name: string
  bio: string
  profile_image_url: string | null
  follower_count: number
  video_count: number
}

export function CreatorSearchSidebar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchCreators = async () => {
      if (searchQuery.length < 2) {
        setCreators([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/creators/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setCreators(data.creators || [])
      } catch (error) {
        console.error('[v0] Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(searchCreators, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-4 w-4" />
          Find Creators
        </CardTitle>
        <CardDescription>Search by creator name</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {loading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Searching...</p>
          </div>
        )}

        {!loading && searchQuery.length >= 2 && creators.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No creators found</p>
          </div>
        )}

        {!loading && creators.length > 0 && (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {creators.map((creator) => (
              <a
                key={creator.id}
                href={`/creators/${creator.id}`}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-accent transition-colors block"
              >
                <div className="flex items-start gap-3">
                  {creator.profile_image_url ? (
                    <Image
                      src={creator.profile_image_url}
                      alt={creator.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                      {creator.name.charAt(0)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{creator.name}</p>
                    {creator.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {creator.bio}
                      </p>
                    )}
                    
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {creator.follower_count} followers
                      </span>
                      <span>{creator.video_count} videos</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {!loading && searchQuery.length < 2 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              Type at least 2 characters to search creators
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
