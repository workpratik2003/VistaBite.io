'use client';

import { Coffee, Sunrise, Sun, Moon, UtensilsCrossed, Cake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MealType } from '@/lib/mock-data';

interface MealFilterProps {
  selectedMealTypes: MealType[];
  onMealTypeToggle: (mealType: MealType) => void;
}

const mealTypeConfig: Record<MealType, { label: string; icon: React.ReactNode }> = {
  breakfast: { label: 'Breakfast', icon: <Sunrise className="h-4 w-4" /> },
  brunch: { label: 'Brunch', icon: <Coffee className="h-4 w-4" /> },
  lunch: { label: 'Lunch', icon: <Sun className="h-4 w-4" /> },
  dinner: { label: 'Dinner', icon: <Moon className="h-4 w-4" /> },
  cafe: { label: 'Cafe', icon: <Coffee className="h-4 w-4" /> },
  dessert: { label: 'Dessert', icon: <Cake className="h-4 w-4" /> },
};

export function MealFilter({ selectedMealTypes, onMealTypeToggle }: MealFilterProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-3">Filter by meal type</h3>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(mealTypeConfig) as MealType[]).map((mealType) => {
          const isSelected = selectedMealTypes.includes(mealType);
          const config = mealTypeConfig[mealType];

          return (
            <Badge
              key={mealType}
              variant={isSelected ? 'default' : 'outline'}
              className={`cursor-pointer px-3 py-2 transition-all hover:scale-105 ${
                isSelected ? 'shadow-sm' : 'hover:bg-muted'
              }`}
              onClick={() => onMealTypeToggle(mealType)}
            >
              {config.icon}
              <span className="ml-1.5">{config.label}</span>
            </Badge>
          );
        })}
      </div>
      {selectedMealTypes.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {selectedMealTypes.length} filter{selectedMealTypes.length !== 1 ? 's' : ''} active
        </p>
      )}
    </div>
  );
}
