'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Check, AlertCircle } from 'lucide-react'

const MEAL_TYPES = ['breakfast', 'brunch', 'lunch', 'dinner', 'cafe', 'dessert']

export default function SubmitReelForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    restaurant_name: '',
    creator_name: '',
    creator_email: '',
    instagram_url: '',
    meal_types: [] as string[],
    location_city: '',
    location_address: '',
    description: '',
  })

  const handleMealTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      meal_types: prev.meal_types.includes(type)
        ? prev.meal_types.filter((t) => t !== type)
        : [...prev.meal_types, type],
    }))
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log('[v0] Submitting form with data:', formData)
      
      const response = await fetch('/api/submit-reel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log('[v0] Submit response:', { status: response.status, data })

      if (!response.ok) {
        console.error('[v0] Submit failed:', data)
        throw new Error(data.error || `Failed to submit reel (Status: ${response.status})`)
      }

      setSubmitted(true)
      setFormData({
        restaurant_name: '',
        creator_name: '',
        creator_email: '',
        instagram_url: '',
        meal_types: [],
        location_city: '',
        location_address: '',
        description: '',
      })

      setTimeout(() => {
        setSubmitted(false)
        setIsOpen(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Submit Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow z-40 flex items-center gap-2 font-semibold"
      >
        <Upload className="h-5 w-5" />
        <span className="hidden sm:inline">Share Your Reel</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !isLoading && setIsOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Share Your Food Reel</h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                <p className="text-muted-foreground">
                  Your reel has been submitted for review. We'll notify you once it's approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {/* Restaurant Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Restaurant Name *
                  </label>
                  <Input
                    type="text"
                    name="restaurant_name"
                    value={formData.restaurant_name}
                    onChange={handleInputChange}
                    placeholder="e.g., The Food Corner"
                    required
                  />
                </div>

                {/* Creator Name & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Name *
                    </label>
                    <Input
                      type="text"
                      name="creator_name"
                      value={formData.creator_name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Email *
                    </label>
                    <Input
                      type="email"
                      name="creator_email"
                      value={formData.creator_email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Instagram URL */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Instagram Reel URL *
                  </label>
                  <Input
                    type="url"
                    name="instagram_url"
                    value={formData.instagram_url}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/p/..."
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Copy the link from your Instagram reel
                  </p>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City *
                    </label>
                    <Input
                      type="text"
                      name="location_city"
                      value={formData.location_city}
                      onChange={handleInputChange}
                      placeholder="e.g., Pune"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Address
                    </label>
                    <Input
                      type="text"
                      name="location_address"
                      value={formData.location_address}
                      onChange={handleInputChange}
                      placeholder="e.g., Karvenagar"
                    />
                  </div>
                </div>

                {/* Meal Types */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Meal Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MEAL_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleMealTypeToggle(type)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          formData.meal_types.includes(type)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us about this reel (optional)"
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Submitting...' : 'Submit Reel'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your submission will be reviewed and approved within 24 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
