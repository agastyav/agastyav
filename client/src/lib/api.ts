import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Types
export interface Series {
  id: string
  title: string
  title_romaji?: string
  title_english?: string
  author?: string
  status: string
  start_year?: number
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface ContentUnit {
  id: string
  series_id: string
  medium: 'light_novel' | 'web_novel' | 'manga' | 'anime'
  number: number
  title?: string
  release_date?: string
  created_at: string
  updated_at: string
}

export interface Mapping {
  id: string
  series_id: string
  from_unit_id: string
  to_unit_id: string
  confidence: number
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  created_by: string
  created_at: string
  moderated_by?: string
  moderated_at?: string
  updated_at: string
  from_unit?: ContentUnit
  to_unit?: ContentUnit
  creator?: { display_name: string }
}

export interface User {
  id: string
  email: string
  display_name: string
  role: 'visitor' | 'contributor' | 'moderator' | 'admin'
  points: number
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  user_id: string
  arc_id: string
  medium: 'light_novel' | 'web_novel' | 'manga' | 'anime'
  stars: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface Arc {
  id: string
  series_id: string
  name: string
  start_unit_id: string
  end_unit_id: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  icon_url?: string
  rule_description: string
  points_required: number
  created_at: string
}

export interface JumpResult {
  source_unit: ContentUnit
  mappings: {
    [key: string]: Array<{
      unit: ContentUnit
      confidence: number
      notes?: string
    }>
  }
}

// API functions
export const apiClient = {
  // Series
  getSeries: () => api.get<Series[]>('/series').then(res => res.data),
  getSeriesById: (id: string) => api.get<Series>(`/series/${id}`).then(res => res.data),
  getSeriesUnits: (seriesId: string) => api.get<ContentUnit[]>(`/series/${seriesId}/units`).then(res => res.data),

  // Jump point finder
  getJumpPoint: (seriesId: string, medium: string, number: number) =>
    api.get<JumpResult>(`/series/${seriesId}/jump`, {
      params: { medium, number }
    }).then(res => res.data),

  // Mappings
  createMapping: (data: {
    series_id: string
    from_unit_id: string
    to_unit_id: string
    confidence: number
    notes?: string
  }) => api.post<Mapping>('/mappings', data).then(res => res.data),

  getPendingMappings: () => api.get<Mapping[]>('/mappings/pending').then(res => res.data),

  updateMappingStatus: (id: string, status: 'approved' | 'rejected') =>
    api.patch<Mapping>(`/mappings/${id}/status`, { status }).then(res => res.data),

  // Ratings
  createRating: (data: {
    arc_id: string
    medium: 'light_novel' | 'web_novel' | 'manga' | 'anime'
    stars: number
    comment?: string
  }) => api.post<Rating>('/ratings', data).then(res => res.data),

  // Leaderboard
  getLeaderboard: () => api.get<User[]>('/leaderboard').then(res => res.data),

  // User profile
  getUserProfile: () => api.get<User>('/users/profile').then(res => res.data),

  // Arc routes
  getArcById: (id: string) => api.get<Arc>(`/arcs/${id}`).then(res => res.data),
  getArcRatings: (arcId: string) => api.get<Rating[]>(`/arcs/${arcId}/ratings`).then(res => res.data),

  // Health check
  healthCheck: () => api.get('/health').then(res => res.data),
}

export default apiClient