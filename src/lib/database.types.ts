export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          is_admin?: boolean
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          group: string | null
          matchday_round: number | null
          stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
          home_team: string
          away_team: string
          kickoff_time: string
          home_score: number | null
          away_score: number | null
          status: 'scheduled' | 'locked' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          group?: string | null
          matchday_round?: number | null
          stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
          home_team: string
          away_team: string
          kickoff_time: string
          home_score?: number | null
          away_score?: number | null
          status?: 'scheduled' | 'locked' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          group?: string | null
          matchday_round?: number | null
          stage?: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
          home_team?: string
          away_team?: string
          kickoff_time?: string
          home_score?: number | null
          away_score?: number | null
          status?: 'scheduled' | 'locked' | 'completed'
          created_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          match_id: string
          predicted_home: number
          predicted_away: number
          submitted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          predicted_home: number
          predicted_away: number
          submitted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string
          predicted_home?: number
          predicted_away?: number
          submitted_at?: string
        }
      }
      points: {
        Row: {
          id: string
          user_id: string
          match_id: string
          points_awarded: number
          is_exact_score: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          points_awarded: number
          is_exact_score: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string
          points_awarded?: number
          is_exact_score?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          id: string
          display_name: string
          total_points: number
          exact_scores: number
          rank: number
        }
      }
    }
    Functions: {
      calculate_points_for_match: {
        Args: { p_match_id: string }
        Returns: void
      }
      lock_due_rounds: {
        Args: Record<string, never>
        Returns: void
      }
    }
  }
}

export type Match = Database['public']['Tables']['matches']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']
export type Points = Database['public']['Tables']['points']['Row']
export type UserProfile = Database['public']['Tables']['users']['Row']
export type LeaderboardRow = Database['public']['Views']['leaderboard']['Row']
