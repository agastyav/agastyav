import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { UserIcon, TrophyIcon, CalendarIcon, StarIcon } from '@heroicons/react/24/outline'
import apiClient from '../lib/api'

const roleColors = {
  visitor: 'bg-gray-100 text-gray-800',
  contributor: 'bg-blue-100 text-blue-800',
  moderator: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
}

const roleLabels = {
  visitor: 'Visitor',
  contributor: 'Contributor',
  moderator: 'Moderator',
  admin: 'Admin',
}

export default function ProfilePage() {
  const { user } = useAuth()

  const { data: profile, isLoading } = useQuery(
    ['user-profile'],
    apiClient.getUserProfile,
    {
      enabled: !!user,
    }
  )

  if (!user) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Please sign in</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need to be signed in to view your profile.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
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
        <div className="mx-auto h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <UserIcon className="h-12 w-12 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{profile?.display_name || user.email}</h1>
        <p className="mt-2 text-gray-600">{user.email}</p>
        <div className="mt-4 flex items-center justify-center space-x-2">
          <span className={`badge ${roleColors[profile?.role || 'contributor']}`}>
            {roleLabels[profile?.role || 'contributor']}
          </span>
          <span className="text-sm text-gray-500">
            Member since {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
          </span>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="card">
          <div className="card-body text-center">
            <TrophyIcon className="mx-auto h-8 w-8 text-primary-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {profile?.points || 0}
            </div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <StarIcon className="mx-auto h-8 w-8 text-success-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {profile?.contributions || 0}
            </div>
            <div className="text-sm text-gray-600">Contributions</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <CalendarIcon className="mx-auto h-8 w-8 text-warning-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {profile?.badges?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <UserIcon className="mx-auto h-8 w-8 text-secondary-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {profile?.role === 'moderator' || profile?.role === 'admin' ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Moderator</div>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      {profile?.badges && profile.badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Badges Earned</h2>
            <p className="mt-1 text-sm text-gray-500">
              Special achievements for your contributions
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.badges.map((userBadge: any) => (
                <div
                  key={userBadge.badge.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <TrophyIcon className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {userBadge.badge.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {userBadge.badge.rule_description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Earned {new Date(userBadge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Account Details</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                  <dd className="text-sm text-gray-900">{profile?.display_name || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="text-sm text-gray-900">
                    <span className={`badge ${roleColors[profile?.role || 'contributor']}`}>
                      {roleLabels[profile?.role || 'contributor']}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Statistics</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Points</dt>
                  <dd className="text-sm text-gray-900">{profile?.points || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contributions</dt>
                  <dd className="text-sm text-gray-900">{profile?.contributions || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Badges Earned</dt>
                  <dd className="text-sm text-gray-900">{profile?.badges?.length || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(profile?.updated_at || user.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="card bg-primary-50"
      >
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {profile?.role === 'contributor' && profile.points < 500 && (
              <p>
                • You need {500 - profile.points} more points to become a moderator
              </p>
            )}
            {profile?.role === 'contributor' && profile.points >= 500 && (
              <p>• You're eligible for moderator promotion! Contact an admin.</p>
            )}
            <p>• Continue contributing accurate mappings to earn more points</p>
            <p>• Check the leaderboard to see how you rank among other contributors</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}