import { useQuery } from 'react-query'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpenIcon, CalendarIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline'
import apiClient, { Series, ContentUnit } from '../lib/api'

const mediumLabels = {
  light_novel: 'Light Novel',
  web_novel: 'Web Novel',
  manga: 'Manga',
  anime: 'Anime',
}

const mediumColors = {
  light_novel: 'bg-blue-100 text-blue-800',
  web_novel: 'bg-green-100 text-green-800',
  manga: 'bg-purple-100 text-purple-800',
  anime: 'bg-red-100 text-red-800',
}

export default function SeriesPage() {
  const { id: seriesId } = useParams<{ id: string }>()

  const { data: series, isLoading: seriesLoading } = useQuery(
    ['series', seriesId],
    () => apiClient.getSeriesById(seriesId!),
    {
      enabled: !!seriesId,
    }
  )

  const { data: units = [], isLoading: unitsLoading } = useQuery(
    ['series-units', seriesId],
    () => apiClient.getSeriesUnits(seriesId!),
    {
      enabled: !!seriesId,
    }
  )

  if (seriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading series...</p>
        </div>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Series not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The series you're looking for doesn't exist.
        </p>
      </div>
    )
  }

  // Group units by medium
  const unitsByMedium = units.reduce((acc, unit) => {
    if (!acc[unit.medium]) {
      acc[unit.medium] = []
    }
    acc[unit.medium].push(unit)
    return acc
  }, {} as Record<string, ContentUnit[]>)

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900">{series.title}</h1>
        {series.title_english && series.title_english !== series.title && (
          <p className="mt-2 text-xl text-gray-600">{series.title_english}</p>
        )}
        <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500">
          {series.author && (
            <div className="flex items-center space-x-1">
              <UserIcon className="h-4 w-4" />
              <span>{series.author}</span>
            </div>
          )}
          {series.start_year && (
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{series.start_year}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <BookOpenIcon className="h-4 w-4" />
            <span className="capitalize">{series.status}</span>
          </div>
        </div>
        {series.tags && series.tags.length > 0 && (
          <div className="mt-4 flex items-center justify-center space-x-2">
            <TagIcon className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap justify-center gap-2">
              {series.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Jump */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Quick Jump</h2>
          <p className="mt-1 text-sm text-gray-500">
            Find where to continue reading in other media formats
          </p>
        </div>
        <div className="card-body">
          <Link
            to="/"
            className="btn-primary w-full"
          >
            Find Jump Point
          </Link>
        </div>
      </motion.div>

      {/* Content Units by Medium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        {Object.entries(unitsByMedium).map(([medium, mediumUnits]) => (
          <div key={medium} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`badge ${mediumColors[medium as keyof typeof mediumColors]}`}>
                    {mediumLabels[medium as keyof typeof mediumLabels]}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {mediumLabels[medium as keyof typeof mediumLabels]} Chapters/Episodes
                  </h3>
                </div>
                <span className="text-sm text-gray-500">
                  {mediumUnits.length} total
                </span>
              </div>
            </div>
            <div className="card-body">
              {unitsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading units...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {mediumUnits.slice(0, 24).map((unit) => (
                    <Link
                      key={unit.id}
                      to={`/series/${seriesId}/jump?medium=${medium}&number=${unit.number}`}
                      className="block p-2 text-center border border-gray-200 rounded hover:bg-gray-50 hover:border-primary-300 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {unit.number}
                      </div>
                      {unit.title && (
                        <div className="text-xs text-gray-500 truncate" title={unit.title}>
                          {unit.title}
                        </div>
                      )}
                    </Link>
                  ))}
                  {mediumUnits.length > 24 && (
                    <div className="col-span-full text-center py-4">
                      <span className="text-sm text-gray-500">
                        And {mediumUnits.length - 24} more...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="card">
          <div className="card-body text-center">
            <BookOpenIcon className="mx-auto h-8 w-8 text-primary-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {Object.keys(unitsByMedium).length}
            </div>
            <div className="text-sm text-gray-600">Media Formats</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <CalendarIcon className="mx-auto h-8 w-8 text-success-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {units.length}
            </div>
            <div className="text-sm text-gray-600">Total Units</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <UserIcon className="mx-auto h-8 w-8 text-warning-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {series.author ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Author Info</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <TagIcon className="mx-auto h-8 w-8 text-secondary-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {series.tags?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Tags</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}