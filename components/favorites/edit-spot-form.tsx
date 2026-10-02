'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SavedSpot } from '@/lib/v2-types';

interface EditSpotFormProps {
  spot: SavedSpot;
}

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'bar', label: 'Bar' },
  { value: 'other', label: 'Other' },
];

export function EditSpotForm({ spot }: EditSpotFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: spot.name,
    business_type: spot.business_type ?? '',
    cuisine: spot.cuisine ?? '',
    address: spot.address ?? '',
    city: spot.city ?? '',
    state: spot.state ?? '',
    country: spot.country ?? '',
    latitude: spot.latitude !== null ? String(spot.latitude) : '',
    longitude: spot.longitude !== null ? String(spot.longitude) : '',
    notes: spot.notes ?? '',
  });

  function handleChange(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: Record<string, unknown> = {
      name: form.name,
      business_type: form.business_type || undefined,
      cuisine: form.cuisine || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      notes: form.notes || undefined,
    };

    // Only send coordinates if both are provided
    const lat = form.latitude.trim() !== '' ? parseFloat(form.latitude) : null;
    const lon = form.longitude.trim() !== '' ? parseFloat(form.longitude) : null;
    if (lat !== null && !isNaN(lat)) payload.latitude = lat;
    if (lon !== null && !isNaN(lon)) payload.longitude = lon;
    if (lat === null) payload.latitude = null;
    if (lon === null) payload.longitude = null;

    try {
      const res = await fetch(`/api/favorites/spots/${spot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save changes');
        return;
      }

      router.push(`/favorites/${spot.id}`);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-name">Name *</Label>
        <Input
          id="edit-name"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          placeholder="e.g. Kolhapuri Wada Misal"
        />
      </div>

      {/* Type + Cuisine */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-business-type">Type</Label>
          <Select
            value={form.business_type}
            onValueChange={(v) => handleChange('business_type', v)}
          >
            <SelectTrigger id="edit-business-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-cuisine">Cuisine</Label>
          <Input
            id="edit-cuisine"
            value={form.cuisine}
            onChange={(e) => handleChange('cuisine', e.target.value)}
            placeholder="e.g. South Indian"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-address">Address</Label>
        <Input
          id="edit-address"
          value={form.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="e.g. FC Road"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-city">City</Label>
          <Input
            id="edit-city"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="e.g. Pune"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-state">State</Label>
          <Input
            id="edit-state"
            value={form.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="e.g. Maharashtra"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-country">Country</Label>
          <Input
            id="edit-country"
            value={form.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="e.g. India"
          />
        </div>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-latitude">Latitude</Label>
          <Input
            id="edit-latitude"
            type="number"
            step="any"
            min="-90"
            max="90"
            value={form.latitude}
            onChange={(e) => handleChange('latitude', e.target.value)}
            placeholder="e.g. 18.5204"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-longitude">Longitude</Label>
          <Input
            id="edit-longitude"
            type="number"
            step="any"
            min="-180"
            max="180"
            value={form.longitude}
            onChange={(e) => handleChange('longitude', e.target.value)}
            placeholder="e.g. 73.8567"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea
          id="edit-notes"
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Anything worth remembering about this spot…"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving} className="gap-2" id="edit-spot-save">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
