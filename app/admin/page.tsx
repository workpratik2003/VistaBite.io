'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Clock, ExternalLink, Trash2 } from 'lucide-react'

interface Submission {
  id: string
  restaurant_name: string
  creator_name: string
  creator_email: string
  instagram_url: string
  meal_types: string[]
  city: string
  restaurant_address: string
  reel_description: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/submissions')
      if (!response.ok) throw new Error('Failed to fetch submissions')
      const data = await response.json()
      setSubmissions(data.submissions || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id)
      const response = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to approve')
      
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'approved' } : s))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id)
      const response = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to reject')
      
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredSubmissions = submissions.filter((s) =>
    filter === 'all' ? true : s.status === filter
  )

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container px-4 md:px-6 py-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage submitted food reels</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 md:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Submissions</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 border-b-2 transition-colors capitalize ${
                filter === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} submissions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{submission.restaurant_name}</h3>
                      <p className="text-sm text-muted-foreground">{submission.city}</p>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Creator</span>
                        <p className="text-sm">{submission.creator_name}</p>
                        <p className="text-xs text-muted-foreground">{submission.creator_email}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Location</span>
                      <p className="text-sm">{submission.restaurant_address}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Meal Types</span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {submission.meal_types.map((type) => (
                          <span key={type} className="px-2 py-1 bg-secondary rounded-full text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    {submission.reel_description && (
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Description</span>
                        <p className="text-sm mt-1">{submission.reel_description}</p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Submitted: {new Date(submission.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Right Column - Actions */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-muted rounded-lg p-4 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Instagram URL</p>
                      <a
                        href={submission.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all flex items-center gap-2"
                      >
                        View Reel
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
                      {submission.status === 'pending' && (
                        <>
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-600">Pending Review</span>
                        </>
                      )}
                      {submission.status === 'approved' && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Approved</span>
                        </>
                      )}
                      {submission.status === 'rejected' && (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Rejected</span>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {submission.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(submission.id)}
                          disabled={actionLoading === submission.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(submission.id)}
                          disabled={actionLoading === submission.id}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
