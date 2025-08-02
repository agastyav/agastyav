import { useState } from 'react'
import { useQuery } from 'react-query'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowRightIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import apiClient, { JumpResult, ContentUnit } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import ContributeModal from '../components/ContributeModal'

const mediumLabels = {
  light_novel: 'Light Novel',
  web_novel: 'Web Novel',
  manga: 'Manga',
  anime: 'Anime',
}

const confidenceColors = {
  high: 'confidence-high',
  medium: 'confidence-medium',
  low: 'confidence-low',
}

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 80) return 'high'
  if (confidence >= 50) return 'medium'
  return 'low'
}

export default function JumpResultPage() {
  const { id: seriesId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [showContributeModal, setShowContributeModal] = useState(false)
  const { user } = useAuth()

  const medium = searchParams.get('medium') as keyof typeof mediumLabels
  const number = searchParams.get('number')

  const { data: jumpResult, isLoading, error } = useQuery(
    ['jump', seriesId, medium, number],
    () => apiClient.getJumpPoint(seriesId!, medium!, parseInt(number!)),
    {
      enabled: !!seriesId && !!medium && !!number,
    }
  )

  const { data: series } = useQuery(
    ['series', seriesId],
    () => apiClient.getSeriesById(seriesId!),
    {
      enabled: !!seriesId,
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding your jump point...</p>
        </div>
      </div>
    )
  }

  if (error || !jumpResult) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No mappings found</h3>
        <p className="mt-1 text-sm text-gray-500">
          We couldn't find any mappings for this location. Be the first to contribute!
        </p>
        {user && (
          <div className="mt-6">
            <button
              onClick={() => setShowContributeModal(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Contribute Mapping
            </button>
          </div>
        )}
      </div>
    )
  }

  const sourceUnit = jumpResult.source_unit
  const mappings = jumpResult.mappings

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Link
          to={`/series/${seriesId}`}
          className="text-primary-600 hover:text-primary-500 text-sm font-medium"
        >
          ← Back to {series?.title}
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Jump Point Results
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          You are at {mediumLabels[medium]} {sourceUnit.number}
        </p>
      </div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card"
      >
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Continue Reading</h2>
              <p className="mt-1 text-sm text-gray-500">
                Here are the corresponding locations in other media formats
              </p>
            </div>
            {user && (
              <button
                onClick={() => setShowContributeModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Contribute
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {Object.keys(mappings).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(mappings).map(([targetMedium, mediumMappings]) => (
                <div key={targetMedium} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {mediumLabels[targetMedium as keyof typeof mediumLabels]}
                  </h3>
                  <div className="space-y-3">
                    {mediumMappings.map((mapping, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <ArrowRightIcon className="h-5 w-5 text-primary-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {mediumLabels[targetMedium as keyof typeof mediumLabels]} {mapping.unit.number}
                            </div>
                            {mapping.unit.title && (
                              <div className="text-sm text-gray-500">{mapping.unit.title}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`badge ${confidenceColors[getConfidenceLevel(mapping.confidence)]}`}>
                            {mapping.confidence}% confidence
                          </span>
                          {mapping.notes && (
                            <div className="text-sm text-gray-600 max-w-xs">
                              "{mapping.notes}"
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No mappings available</h3>
              <p className="mt-1 text-sm text-gray-500">
                No one has mapped this location yet. Be the first to contribute!
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">
              {Object.keys(mappings).length}
            </div>
            <div className="text-sm text-gray-600">Media Formats</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">
              {Object.values(mappings).reduce((acc, curr) => acc + curr.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Mappings</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">
              {Math.round(
                Object.values(mappings)
                  .flat()
                  .reduce((acc, curr) => acc + curr.confidence, 0) / 
                  Math.max(Object.values(mappings).flat().length, 1)
              )}%
            </div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
        </div>
      </motion.div>

      {/* Contribute Modal */}
      {showContributeModal && (
        <ContributeModal
          open={showContributeModal}
          onClose={() => setShowContributeModal(false)}
          seriesId={seriesId!}
          sourceUnit={sourceUnit}
        />
      )}
    </div>
  )
}