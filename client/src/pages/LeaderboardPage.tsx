import { useQuery } from 'react-query'
import { TrophyIcon, StarIcon, UserIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import apiClient, { User } from '../lib/api'

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

export default function LeaderboardPage() {
  const { data: leaderboard = [], isLoading } = useQuery(
    ['leaderboard'],
    apiClient.getLeaderboard,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="h-6 w-6 text-yellow-500" />
      case 2:
        return <TrophyIcon className="h-6 w-6 text-gray-400" />
      case 3:
        return <TrophyIcon className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500'
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700'
      default:
        return 'bg-white'
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="mt-2 text-gray-600">
          Top contributors who help the community with accurate mappings
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card">
          <div className="card-body text-center">
            <TrophyIcon className="mx-auto h-8 w-8 text-yellow-500" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {leaderboard.length}
            </div>
            <div className="text-sm text-gray-600">Total Contributors</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <StarIcon className="mx-auto h-8 w-8 text-primary-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {leaderboard.reduce((sum, user) => sum + user.points, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Points Earned</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <UserIcon className="mx-auto h-8 w-8 text-secondary-600" />
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {leaderboard.filter(user => user.role === 'moderator' || user.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">Moderators & Admins</div>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Top Contributors</h2>
          <p className="mt-1 text-sm text-gray-500">
            Ranked by total points earned through contributions
          </p>
        </div>

        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index < 3 ? 'border-2' : 'border-gray-200'
                  } ${getRankColor(index + 1)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.display_name}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`badge ${roleColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {user.points.toLocaleString()} points
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {user.points.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No contributors yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Be the first to contribute and climb the leaderboard!
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* How to Earn Points */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="card"
      >
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">How to Earn Points</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Point System</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="text-success-600 font-medium">+10</span>
                  <span>Submit a mapping</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-success-600 font-medium">+40</span>
                  <span>Mapping approved</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-danger-600 font-medium">-20</span>
                  <span>Mapping rejected</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Role Progression</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <strong>Contributor → Moderator:</strong> 500+ points & 80%+ approval rate
                </li>
                <li>
                  <strong>Badges:</strong> Earn special badges for achievements
                </li>
                <li>
                  <strong>Leaderboard:</strong> Compete with other contributors
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}