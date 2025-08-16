'use client'

import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Model } from '@/types/models'
import { Eye, Plus, Minus, ChevronRight, Info } from 'lucide-react'
import { FEATURED_MODELS, LATEST_MODELS, MODEL_BADGES } from '@/constants/models'

interface SwipeableModelCardProps {
  model: Model
  isSelected: boolean
  onViewDetails: () => void
  onToggleComparison: () => void
  comparisonDisabled?: boolean
}

export function SwipeableModelCard({
  model,
  isSelected,
  onViewDetails,
  onToggleComparison,
  comparisonDisabled = false
}: SwipeableModelCardProps) {
  const [showQuickActions, setShowQuickActions] = useState(false)
  const isFeatured = FEATURED_MODELS.includes(model.name)
  const isLatest = LATEST_MODELS.includes(model.name)

  const handlers = useSwipeable({
    onSwipedLeft: () => setShowQuickActions(true),
    onSwipedRight: () => setShowQuickActions(false),
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  })

  return (
    <div {...handlers} className="relative overflow-hidden touch-pan-y">
      <motion.div
        animate={{ x: showQuickActions ? -80 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative"
      >
        <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer touch-manipulation">
          <CardHeader onClick={onViewDetails}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  {model.name}
                  {isLatest && (
                    <Badge className={`${MODEL_BADGES.NEW.className} text-xs`}>
                      {MODEL_BADGES.NEW.label}
                    </Badge>
                  )}
                  {isFeatured && !isLatest && (
                    <Badge className={`${MODEL_BADGES.FEATURED.className} text-xs`}>
                      {MODEL_BADGES.FEATURED.label}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  by {model.provider?.name || model.providerId}
                </CardDescription>
              </div>
              <Badge 
                variant={model.isActive ? 'success' : 'secondary'}
                className="text-xs"
              >
                {model.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {isSelected && (
              <Badge variant="default" className="mt-2 bg-blue-600 text-xs">
                Selected for comparison
              </Badge>
            )}
          </CardHeader>
          
          <CardContent className="space-y-3">
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {model.description || 'No description available'}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {model.modalities && model.modalities.length > 0 && (
                <>
                  {model.modalities.slice(0, 2).map(modality => (
                    <Badge key={modality} variant="outline" className="text-xs px-2 py-0.5">
                      {modality}
                    </Badge>
                  ))}
                  {model.modalities.length > 2 && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      +{model.modalities.length - 2}
                    </Badge>
                  )}
                </>
              )}
            </div>

            <div className="pt-3 border-t flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 text-xs sm:text-sm min-h-[40px]"
                onClick={onViewDetails}
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Details
                <ChevronRight className="w-3 h-3 ml-auto" />
              </Button>
              <Button
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className={`min-w-[40px] min-h-[40px] p-0 ${
                  isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleComparison()
                }}
                disabled={comparisonDisabled && !isSelected}
              >
                {isSelected ? (
                  <Minus className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions Panel (revealed on swipe) */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-blue-500 to-blue-600 flex items-center justify-center"
            onClick={() => {
              onViewDetails()
              setShowQuickActions(false)
            }}
          >
            <Info className="w-6 h-6 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}