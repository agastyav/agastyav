import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { StarIcon, ChatBubbleLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import apiClient, { Arc, Rating } from '../lib/api'

const mediumLabels = {
  light_novel: 'Light Novel',
  web_novel: 'Web Novel',
  manga: 'Manga',
  anime: 'Anime',
}

export default function ArcPage() {
  const { id: arcId } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'overview' | 'discussion' | 'ratings'>('overview')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: arc, isLoading: arcLoading } = useQuery(
    ['arc', arcId],
    () => apiClient.getArcById(arcId!),
    {
      enabled: !!arcId,
    }
  )

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery(
    ['arc-ratings', arcId],
    () => apiClient.getArcRatings(arcId!),
    {
      enabled: !!arcId,
    }
  )

  const createRatingMutation = useMutation(
    (data: { arc_id: string; medium: string; stars: number; comment?: string }) =>
      apiClient.createRating(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['arc-ratings', arcId])
        toast.success('Rating submitted successfully!')
        setRating(0)
        setComment('')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit rating')
      },
    }
  )

  const handleSubmitRating = (medium: string) => {
    if (!rating) {
      toast.error('Please select a rating')
      return
    }
    createRatingMutation.mutate({
      arc_id: arcId!,
      medium,
      stars: rating,
      comment: comment || undefined,
    })
  }

  const getAverageRating = (medium: string) => {
    const mediumRatings = ratings.filter(r => r.medium === medium)
    if (mediumRatings.length === 0) return 0
    return mediumRatings.reduce((sum, r) => sum + r.stars, 0) / mediumRatings.length
  }

  const getUserRating = (medium: string) => {
    return ratings.find(r => r.medium === medium && r.user_id === user?.id)
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'discussion', name: 'Discussion', icon: ChatBubbleLeftIcon },
    { id: 'ratings', name: 'Ratings', icon: StarIcon },
  ]

  if (arcLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading arc...</p>
        </div>
      </div>
    )
  }

  if (!arc) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Arc not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The arc you're looking for doesn't exist.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900">{arc.name}</h1>
        {arc.description && (
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            {arc.description}
          </p>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card"
      >
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="card-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Arc Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Unit</dt>
                    <dd className="text-sm text-gray-900">Chapter/Episode {arc.start_unit_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Unit</dt>
                    <dd className="text-sm text-gray-900">Chapter/Episode {arc.end_unit_id}</dd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Ratings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(mediumLabels).map(([medium, label]) => {
                    const avgRating = getAverageRating(medium)
                    const userRating = getUserRating(medium)
                    return (
                      <div key={medium} className="border border-gray-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-900 mb-2">{label}</div>
                        <div className="flex items-center space-x-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`h-4 w-4 ${
                                star <= avgRating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-600">
                          {avgRating > 0 ? `${avgRating.toFixed(1)}/5` : 'No ratings'}
                        </div>
                        {userRating && (
                          <div className="text-xs text-gray-500 mt-1">
                            Your rating: {userRating.stars}/5
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Discussion Tab */}
          {activeTab === 'discussion' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-8"
            >
              <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Discussion Coming Soon</h3>
              <p className="mt-1 text-sm text-gray-500">
                Discussion threads will be available in a future update.
              </p>
            </motion.div>
          )}

          {/* Ratings Tab */}
          {activeTab === 'ratings' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {user ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate This Arc</h3>
                  <div className="space-y-4">
                    {Object.entries(mediumLabels).map(([medium, label]) => {
                      const userRating = getUserRating(medium)
                      return (
                        <div key={medium} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{label}</h4>
                            {userRating && (
                              <span className="text-sm text-gray-500">
                                Your rating: {userRating.stars}/5
                              </span>
                            )}
                          </div>
                          
                          {!userRating ? (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="text-2xl text-gray-300 hover:text-yellow-400 transition-colors"
                                  >
                                    {star <= rating ? (
                                      <StarIconSolid className="text-yellow-400" />
                                    ) : (
                                      <StarIcon />
                                    )}
                                  </button>
                                ))}
                              </div>
                              <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment (optional)..."
                                rows={2}
                                className="input"
                              />
                              <button
                                onClick={() => handleSubmitRating(medium)}
                                disabled={!rating || createRatingMutation.isLoading}
                                className="btn-primary"
                              >
                                {createRatingMutation.isLoading ? 'Submitting...' : 'Submit Rating'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              {userRating.comment && (
                                <p className="mb-2">"{userRating.comment}"</p>
                              )}
                              <p className="text-gray-500">
                                Rated on {new Date(userRating.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">Sign in to rate</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You need to be signed in to rate this arc.
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Ratings</h3>
                {ratingsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : ratings.length > 0 ? (
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {mediumLabels[rating.medium]}
                            </span>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= rating.stars ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-600">"{rating.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No ratings yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Be the first to rate this arc!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}