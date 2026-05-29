'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Users } from 'lucide-react'

type Role = 'content_maker' | 'user'

export function RoleSelectionModal() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRoleSelect = async (role: Role) => {
    setSelectedRole(role)
    setLoading(true)

    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      const response = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to set role')
        setSelectedRole(null)
        setLoading(false)
        return
      }

      // Update localStorage
      localStorage.setItem('userRole', role)

      // Redirect to home
      router.push('/')
    } catch (err) {
      setError('Failed to set role. Please try again.')
      setSelectedRole(null)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-2xl relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Welcome to Vistabite</CardTitle>
          <CardDescription className="text-lg">
            Tell us your role to get started
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-3">
            This helps us personalize your experience. You can change this later in settings.
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Maker Option */}
            <button
              onClick={() => handleRoleSelect('content_maker')}
              disabled={loading}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedRole === 'content_maker'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border-gray-200 dark:border-gray-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full">
                    <Sparkles className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Content Creator</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your food videos, build a community, and reach food lovers
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Upload food videos</li>
                  <li>✓ Public creator profile</li>
                  <li>✓ Gain followers</li>
                  <li>✓ Track analytics</li>
                </ul>
              </div>

              {selectedRole === 'content_maker' && (
                <Button 
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Continue as Creator'}
                </Button>
              )}
            </button>

            {/* Regular User Option */}
            <button
              onClick={() => handleRoleSelect('user')}
              disabled={loading}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedRole === 'user'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Food Explorer</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover amazing food videos and connect with creators
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Discover food videos</li>
                  <li>✓ Follow creators</li>
                  <li>✓ Save favorites</li>
                  <li>✓ Private profile</li>
                </ul>
              </div>

              {selectedRole === 'user' && (
                <Button 
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Continue as Explorer'}
                </Button>
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-600 text-sm p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800 mt-6">
              {error}
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground mt-6">
            This choice will be visible in your profile settings and cannot be undone immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
