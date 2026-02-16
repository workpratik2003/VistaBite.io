'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, ExternalLink } from 'lucide-react';
import type { Reel } from '@/lib/mock-data';
import Image from 'next/image';

interface ReelCardProps {
  reel: Reel;
}

export function ReelCard({ reel }: ReelCardProps) {
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const handleReelClick = () => {
    setShowRedirectModal(true);
  };

  const handleRedirect = () => {
    window.open(reel.instagramUrl, '_blank', 'noopener,noreferrer');
    setShowRedirectModal(false);
  };

  return (
    <>
      <Card
        className="group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300"
        onClick={handleReelClick}
      >
        <div className="relative aspect-[9/16] overflow-hidden bg-muted">
          <Image
            src={reel.thumbnailUrl}
            alt={reel.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <div className="flex items-start gap-2 mb-2">
              <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white">
                {reel.creatorType === 'owner' ? 'Owner' : 'Creator'}
              </Badge>
              {reel.mealTypes.slice(0, 2).map((type) => (
                <Badge key={type} variant="secondary" className="bg-primary/90 text-primary-foreground capitalize">
                  {type}
                </Badge>
              ))}
            </div>
            
            <h3 className="font-semibold text-white mb-1 line-clamp-2 text-balance">
              {reel.title}
            </h3>
            
            <p className="text-sm text-white/90 font-medium mb-2">
              {reel.restaurantName}
            </p>
            
            <div className="flex items-center justify-between text-xs text-white/80">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{reel.location.address}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Eye className="h-3 w-3" />
                <span>{reel.views}</span>
              </div>
            </div>
            
            <p className="text-xs text-white/70 mt-1">
              by @{reel.creatorName}
            </p>
          </div>

          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1" />
            </div>
          </div>
        </div>
      </Card>

      {/* Redirect confirmation modal */}
      {showRedirectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowRedirectModal(false)}
        >
          <Card
            className="max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shrink-0">
                <ExternalLink className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Open in Instagram?</h3>
                <p className="text-sm text-muted-foreground">
                  This will open the reel in Instagram
                </p>
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-3 mb-4">
              <p className="text-sm font-medium mb-1">{reel.title}</p>
              <p className="text-xs text-muted-foreground">
                {reel.restaurantName} • @{reel.creatorName}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRedirectModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedirect}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Open Instagram
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
