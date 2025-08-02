import { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, BookOpenIcon, MapIcon, TrophyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import apiClient, { Series } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [medium, setMedium] = useState<'light_novel' | 'web_novel' | 'manga' | 'anime'>('manga')
  const [number, setNumber] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: series = [], isLoading: seriesLoading } = useQuery(
    ['series'],
    apiClient.getSeries,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const filteredSeries = series.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.title_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFindJumpPoint = () => {
    if (!selectedSeries || !number) return
    
    navigate(`/series/${selectedSeries.id}/jump?medium=${medium}&number=${number}`)
  }

  const mediumOptions = [
    { value: 'light_novel', label: 'Light Novel' },
    { value: 'web_novel', label: 'Web Novel' },
    { value: 'manga', label: 'Manga' },
    { value: 'anime', label: 'Anime' },
  ]

  const features = [
    {
      icon: MapIcon,
      title: 'Jump Point Finder',
      description: 'Find exactly where to continue reading when switching between different media formats.',
    },
    {
      icon: BookOpenIcon,
      title: 'Crowd-Sourced Mapping',
      description: 'Community-driven mappings between light novels, web novels, manga, and anime.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Quality Control',
      description: 'Moderated submissions ensure accurate and reliable mapping data.',
    },
    {
      icon: TrophyIcon,
      title: 'Gamification',
      description: 'Earn points, badges, and climb the leaderboard by contributing to the community.',
    },
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          MangasManga Mapper
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
          Never lose your place again when switching between light novels, web novels, manga, and anime. 
          Find the perfect continuation point with our community-driven mapping system.
        </p>
      </motion.div>

      {/* Jump Point Finder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card max-w-4xl mx-auto"
      >
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Find Your Jump Point</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a series and your current location to find where to continue in other media formats.
          </p>
        </div>
        <div className="card-body space-y-6">
          {/* Series Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Series
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            {searchQuery && (
              <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {seriesLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading series...</div>
                ) : filteredSeries.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredSeries.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSeries(s)
                          setSearchQuery(s.title)
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="font-medium text-gray-900">{s.title}</div>
                        {s.author && (
                          <div className="text-sm text-gray-500">by {s.author}</div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">No series found</div>
                )}
              </div>
            )}
          </div>

          {/* Medium and Number Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medium
              </label>
              <select
                value={medium}
                onChange={(e) => setMedium(e.target.value as any)}
                className="input"
              >
                {mediumOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter/Episode Number
              </label>
              <input
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g., 145"
                className="input"
                min="1"
              />
            </div>
          </div>

          {/* Find Button */}
          <button
            onClick={handleFindJumpPoint}
            disabled={!selectedSeries || !number}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Find Jump Point
          </button>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="py-12"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose MangaMapper?</h2>
          <p className="mt-4 text-lg text-gray-600">
            Our platform provides everything you need to seamlessly switch between different media formats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 mb-4">
                <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center bg-primary-50 rounded-lg p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Join the Community
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Sign up to contribute mappings, earn points, and help other readers find their perfect continuation point.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">
              Get Started
            </button>
            <button className="btn-outline">
              Learn More
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}