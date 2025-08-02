import { useQuery, useMutation, useQueryClient } from 'react-query'
import { CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import apiClient, { Mapping } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const mediumLabels = {
  light_novel: 'Light Novel',
  web_novel: 'Web Novel',
  manga: 'Manga',
  anime: 'Anime',
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function ModerationPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: pendingMappings = [], isLoading } = useQuery(
    ['pending-mappings'],
    apiClient.getPendingMappings,
    {
      enabled: !!user,
    }
  )

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      apiClient.updateMappingStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['pending-mappings'])
        toast.success('Mapping status updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update mapping status')
      },
    }
  )

  const handleApprove = (mapping: Mapping) => {
    updateStatusMutation.mutate({ id: mapping.id, status: 'approved' })
  }

  const handleReject = (mapping: Mapping) => {
    updateStatusMutation.mutate({ id: mapping.id, status: 'rejected' })
  }

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <XMarkIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need moderator privileges to access this page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moderation Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Review and approve pending mapping submissions from the community.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card"
        >
          <div className="card-body text-center">
            <ClockIcon className="mx-auto h-8 w-8 text-warning-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {pendingMappings.length}
            </div>
            <div className="text-sm text-gray-600">Pending Reviews</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card"
        >
          <div className="card-body text-center">
            <CheckIcon className="mx-auto h-8 w-8 text-success-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {pendingMappings.filter(m => m.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved Today</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card"
        >
          <div className="card-body text-center">
            <XMarkIcon className="mx-auto h-8 w-8 text-danger-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {pendingMappings.filter(m => m.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected Today</div>
          </div>
        </motion.div>
      </div>

      {/* Pending Mappings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Pending Mappings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review submissions and approve or reject them based on accuracy.
          </p>
        </div>

        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading pending mappings...</p>
            </div>
          ) : pendingMappings.length > 0 ? (
            <div className="space-y-4">
              {pendingMappings.map((mapping, index) => (
                <motion.div
                  key={mapping.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {mediumLabels[mapping.from_unit!.medium]} {mapping.from_unit!.number}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm font-medium text-gray-900">
                            {mediumLabels[mapping.to_unit!.medium]} {mapping.to_unit!.number}
                          </span>
                        </div>
                        <span className={`badge ${statusColors[mapping.status]}`}>
                          {mapping.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <strong>Confidence:</strong> {mapping.confidence}%
                        </div>
                        {mapping.notes && (
                          <div className="text-sm text-gray-600">
                            <strong>Notes:</strong> {mapping.notes}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          Submitted by {mapping.creator?.display_name || 'Unknown'} on{' '}
                          {new Date(mapping.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(mapping)}
                        disabled={updateStatusMutation.isLoading}
                        className="btn-success"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(mapping)}
                        disabled={updateStatusMutation.isLoading}
                        className="btn-danger"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No pending mappings</h3>
              <p className="mt-1 text-sm text-gray-500">
                All submissions have been reviewed. Great job!
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Moderation Guidelines</h2>
        </div>
        <div className="card-body">
          <div className="prose prose-sm max-w-none">
            <ul className="space-y-2 text-gray-600">
              <li>
                <strong>Approve</strong> mappings that accurately represent the same story point across media formats.
              </li>
              <li>
                <strong>Reject</strong> mappings that are clearly incorrect or have very low confidence levels.
              </li>
              <li>
                Consider the confidence level and notes provided by the contributor.
              </li>
              <li>
                Be consistent with your decisions to maintain quality standards.
              </li>
              <li>
                Remember that contributors earn points for approved submissions and lose points for rejected ones.
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}