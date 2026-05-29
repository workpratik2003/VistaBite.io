import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Share2, Video } from 'lucide-react'

export const metadata = {
  title: 'Creator Profile - Vistabite',
  description: 'View creator profile and videos',
}

interface Props {
  params: {
    userId: string
  }
}

export default function ProfilePage({ params }: Props) {
  // This will fetch actual creator data from database
  // For now, showing placeholder
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Header Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-4xl text-white font-bold">
                  C
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">Creator Name</h1>
                <p className="text-muted-foreground mb-4">
                  Food enthusiast sharing delicious moments from around the city
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-xs text-muted-foreground">Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">1.2K</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">3.5K</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Follow
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Videos
            </CardTitle>
            <CardDescription>All videos from this creator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-video bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 cursor-pointer transition-colors"
                >
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
