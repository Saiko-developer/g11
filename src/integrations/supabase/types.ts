export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_credit_control: {
        Row: {
          daily_requests: number
          enabled: boolean
          id: boolean
        }
        Insert: {
          daily_requests?: number
          enabled?: boolean
          id?: boolean
        }
        Update: {
          daily_requests?: number
          enabled?: boolean
          id?: boolean
        }
        Relationships: []
      }
      ai_credit_ledger: {
        Row: {
          amount: number
          created_at: string
          event: string
          id: number
          request_id: string | null
          source: string
          topup_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          event: string
          id?: never
          request_id?: string | null
          source: string
          topup_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          event?: string
          id?: never
          request_id?: string | null
          source?: string
          topup_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_requests: {
        Row: {
          created_at: string
          day: string
          operation: string
          request_id: string
          settled_at: string | null
          source: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          operation: string
          request_id: string
          settled_at?: string | null
          source: string
          state?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          operation?: string
          request_id?: string
          settled_at?: string | null
          source?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          body: string
          created_at: string
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      class_chat_reads: {
        Row: {
          classroom_id: string
          last_read_at: string
          thread: string
          user_id: string
        }
        Insert: {
          classroom_id: string
          last_read_at?: string
          thread: string
          user_id: string
        }
        Update: {
          classroom_id?: string
          last_read_at?: string
          thread?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_chat_reads_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      class_exam_ai_control: {
        Row: {
          id: boolean
          paused: boolean
          reason: string | null
          status_code: number | null
        }
        Insert: {
          id?: boolean
          paused?: boolean
          reason?: string | null
          status_code?: number | null
        }
        Update: {
          id?: boolean
          paused?: boolean
          reason?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
      class_exam_ai_drafts: {
        Row: {
          attempt_id: string
          error: string | null
          lease_until: string | null
          result: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_id: string
          error?: string | null
          lease_until?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          error?: string | null
          lease_until?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_exam_ai_drafts_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "class_exam_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      class_exam_attempts: {
        Row: {
          assignment_id: string
          graded_at: string | null
          id: string
          image_paths: string[]
          result: Json | null
          score: number | null
          started_at: string
          student_id: string
          submitted_at: string | null
          teacher_feedback: string
          total_marks: number | null
        }
        Insert: {
          assignment_id: string
          graded_at?: string | null
          id?: string
          image_paths?: string[]
          result?: Json | null
          score?: number | null
          started_at?: string
          student_id: string
          submitted_at?: string | null
          teacher_feedback?: string
          total_marks?: number | null
        }
        Update: {
          assignment_id?: string
          graded_at?: string | null
          id?: string
          image_paths?: string[]
          result?: Json | null
          score?: number | null
          started_at?: string
          student_id?: string
          submitted_at?: string | null
          teacher_feedback?: string
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_exam_attempts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "classroom_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      class_exam_marking_guides: {
        Row: {
          assignment_id: string
          files: Json
        }
        Insert: {
          assignment_id: string
          files?: Json
        }
        Update: {
          assignment_id?: string
          files?: Json
        }
        Relationships: [
          {
            foreignKeyName: "class_exam_marking_guides_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "classroom_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      class_messages: {
        Row: {
          body: string
          classroom_id: string
          created_at: string
          id: string
          peer_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          classroom_id: string
          created_at?: string
          id?: string
          peer_id?: string | null
          sender_id?: string
        }
        Update: {
          body?: string
          classroom_id?: string
          created_at?: string
          id?: string
          peer_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_messages_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      class_posts: {
        Row: {
          author_id: string
          body: string
          classroom_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string
          body: string
          classroom_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          classroom_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_posts_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_assignments: {
        Row: {
          classroom_id: string
          created_at: string
          created_by: string
          due_at: string | null
          duration_minutes: number
          id: string
          instructions: string
          kind: string
          paper_data: Json | null
          title: string
          unit: number
        }
        Insert: {
          classroom_id: string
          created_at?: string
          created_by?: string
          due_at?: string | null
          duration_minutes?: number
          id?: string
          instructions?: string
          kind?: string
          paper_data?: Json | null
          title: string
          unit?: number
        }
        Update: {
          classroom_id?: string
          created_at?: string
          created_by?: string
          due_at?: string | null
          duration_minutes?: number
          id?: string
          instructions?: string
          kind?: string
          paper_data?: Json | null
          title?: string
          unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "classroom_assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_audio: {
        Row: {
          attempts: number
          bytes: number | null
          created_at: string
          generation_token: string | null
          hash: string
          last_error: string | null
          lease_until: string | null
          lesson_id: string
          state: string
          storage_path: string
          version: string
        }
        Insert: {
          attempts?: number
          bytes?: number | null
          created_at?: string
          generation_token?: string | null
          hash: string
          last_error?: string | null
          lease_until?: string | null
          lesson_id: string
          state?: string
          storage_path: string
          version: string
        }
        Update: {
          attempts?: number
          bytes?: number | null
          created_at?: string
          generation_token?: string | null
          hash?: string
          last_error?: string | null
          lease_until?: string | null
          lesson_id?: string
          state?: string
          storage_path?: string
          version?: string
        }
        Relationships: []
      }
      classroom_live_settings: {
        Row: {
          id: boolean
          live_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: boolean
          live_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: boolean
          live_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      classroom_members: {
        Row: {
          classroom_id: string
          display_name: string
          joined_at: string
          student_id: string
        }
        Insert: {
          classroom_id: string
          display_name?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          classroom_id?: string
          display_name?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_members_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_progress: {
        Row: {
          audio_offset: number
          completed: number[]
          cursor: number
          lesson_id: string
          revision: number
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          audio_offset?: number
          completed?: number[]
          cursor?: number
          lesson_id: string
          revision?: number
          updated_at?: string
          user_id: string
          version: string
        }
        Update: {
          audio_offset?: number
          completed?: number[]
          cursor?: number
          lesson_id?: string
          revision?: number
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      classroom_publications: {
        Row: {
          content_hash: string
          lesson_id: string
          reviewed_at: string
          reviewed_by: string
          version: string
        }
        Insert: {
          content_hash: string
          lesson_id: string
          reviewed_at?: string
          reviewed_by: string
          version: string
        }
        Update: {
          content_hash?: string
          lesson_id?: string
          reviewed_at?: string
          reviewed_by?: string
          version?: string
        }
        Relationships: []
      }
      classrooms: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          subject: string
          teacher_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          subject?: string
          teacher_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          teacher_id?: string
        }
        Relationships: []
      }
      daily_class_completions: {
        Row: {
          completed_on: string
          created_at: string
          grade: number
          plan_version: string
          session_index: number
          user_id: string
        }
        Insert: {
          completed_on?: string
          created_at?: string
          grade: number
          plan_version: string
          session_index: number
          user_id: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          grade?: number
          plan_version?: string
          session_index?: number
          user_id?: string
        }
        Relationships: []
      }
      exam_generations: {
        Row: {
          created_at: string
          id: string
          paper: Json
          unit: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paper: Json
          unit: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paper?: Json
          unit?: number
          user_id?: string
        }
        Relationships: []
      }
      exam_submissions: {
        Row: {
          created_at: string
          id: string
          image_paths: string[]
          page_count: number
          paper_title: string | null
          result: Json | null
          score: number | null
          total_marks: number | null
          unit: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_paths?: string[]
          page_count?: number
          paper_title?: string | null
          result?: Json | null
          score?: number | null
          total_marks?: number | null
          unit?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_paths?: string[]
          page_count?: number
          paper_title?: string | null
          result?: Json | null
          score?: number | null
          total_marks?: number | null
          unit?: number
          user_id?: string
        }
        Relationships: []
      }
      exam_uploads: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      grade11_grammar_audio: {
        Row: {
          attempts: number
          bytes: number
          content_type: string
          created_at: string
          hash: string
          hit_count: number
          last_error: string | null
          lease_until: string | null
          status: string
          storage_path: string | null
          unit: number
          updated_at: string
        }
        Insert: {
          attempts?: number
          bytes?: number
          content_type?: string
          created_at?: string
          hash: string
          hit_count?: number
          last_error?: string | null
          lease_until?: string | null
          status?: string
          storage_path?: string | null
          unit: number
          updated_at?: string
        }
        Update: {
          attempts?: number
          bytes?: number
          content_type?: string
          created_at?: string
          hash?: string
          hit_count?: number
          last_error?: string | null
          lease_until?: string | null
          status?: string
          storage_path?: string | null
          unit?: number
          updated_at?: string
        }
        Relationships: []
      }
      grade11_grammar_audio_stats: {
        Row: {
          day: string
          errors: number
          generated: number
          hits: number
          misses: number
        }
        Insert: {
          day?: string
          errors?: number
          generated?: number
          hits?: number
          misses?: number
        }
        Update: {
          day?: string
          errors?: number
          generated?: number
          hits?: number
          misses?: number
        }
        Relationships: []
      }
      grade11_speaking_requests: {
        Row: {
          claim: string
          created_at: string
          lease_until: string
          operation: string
          request_id: string
          session_id: string
          state: string
          user_id: string
        }
        Insert: {
          claim: string
          created_at?: string
          lease_until?: string
          operation: string
          request_id: string
          session_id: string
          state?: string
          user_id: string
        }
        Update: {
          claim?: string
          created_at?: string
          lease_until?: string
          operation?: string
          request_id?: string
          session_id?: string
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade11_speaking_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "grade11_speaking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      grade11_speaking_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          exercise: string | null
          expires_at: string | null
          feedback: Json | null
          history: Json
          id: string
          latest_reply: Json | null
          practice_day: string
          revision: number
          started_at: string | null
          state: string
          unit: number
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          exercise?: string | null
          expires_at?: string | null
          feedback?: Json | null
          history?: Json
          id?: string
          latest_reply?: Json | null
          practice_day?: string
          revision?: number
          started_at?: string | null
          state?: string
          unit: number
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          exercise?: string | null
          expires_at?: string | null
          feedback?: Json | null
          history?: Json
          id?: string
          latest_reply?: Json | null
          practice_day?: string
          revision?: number
          started_at?: string | null
          state?: string
          unit?: number
          user_id?: string
        }
        Relationships: []
      }
      grammar_generated_questions: {
        Row: {
          batch: number
          created_at: string
          id: string
          questions: Json
          section_id: string
          unit: number
        }
        Insert: {
          batch: number
          created_at?: string
          id?: string
          questions?: Json
          section_id: string
          unit: number
        }
        Update: {
          batch?: number
          created_at?: string
          id?: string
          questions?: Json
          section_id?: string
          unit?: number
        }
        Relationships: []
      }
      lesson_mp3_catalog: {
        Row: {
          approved_version: string | null
          created_at: string
          grade: number
          id: string
          lesson_id: string
          script_hash: string
          script_version: string
          section: string
          segment_id: string
          segment_order: number
          unit: number
        }
        Insert: {
          approved_version?: string | null
          created_at?: string
          grade: number
          id: string
          lesson_id: string
          script_hash: string
          script_version: string
          section: string
          segment_id: string
          segment_order: number
          unit: number
        }
        Update: {
          approved_version?: string | null
          created_at?: string
          grade?: number
          id?: string
          lesson_id?: string
          script_hash?: string
          script_version?: string
          section?: string
          segment_id?: string
          segment_order?: number
          unit?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_mp3_approved_fk"
            columns: ["approved_version"]
            isOneToOne: false
            referencedRelation: "lesson_mp3_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_mp3_control: {
        Row: {
          blocked_until: string | null
          id: number
          lease_until: string | null
          next_request_at: string | null
          provider_next: Json
        }
        Insert: {
          blocked_until?: string | null
          id: number
          lease_until?: string | null
          next_request_at?: string | null
          provider_next?: Json
        }
        Update: {
          blocked_until?: string | null
          id?: number
          lease_until?: string | null
          next_request_at?: string | null
          provider_next?: Json
        }
        Relationships: []
      }
      lesson_mp3_events: {
        Row: {
          created_at: string
          detail: string | null
          http_status: number | null
          id: string
          input_tokens_estimate: number | null
          kind: string
          model: string | null
          provider: string | null
          version_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          http_status?: number | null
          id?: string
          input_tokens_estimate?: number | null
          kind: string
          model?: string | null
          provider?: string | null
          version_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          http_status?: number | null
          id?: string
          input_tokens_estimate?: number | null
          kind?: string
          model?: string | null
          provider?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_mp3_events_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "lesson_mp3_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_mp3_jobs: {
        Row: {
          allow_generation: boolean
          attempts: number
          clip_id: string
          created_at: string
          id: string
          lease_until: string | null
          regenerate: boolean
          state: string
          token: string | null
          updated_at: string
          version_id: string
        }
        Insert: {
          allow_generation?: boolean
          attempts?: number
          clip_id: string
          created_at?: string
          id?: string
          lease_until?: string | null
          regenerate?: boolean
          state?: string
          token?: string | null
          updated_at?: string
          version_id: string
        }
        Update: {
          allow_generation?: boolean
          attempts?: number
          clip_id?: string
          created_at?: string
          id?: string
          lease_until?: string | null
          regenerate?: boolean
          state?: string
          token?: string | null
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_mp3_jobs_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "lesson_mp3_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_mp3_jobs_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: true
            referencedRelation: "lesson_mp3_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_mp3_versions: {
        Row: {
          bytes: number
          clip_id: string
          created_at: string
          created_by: string | null
          duration: number | null
          format: string
          id: string
          last_error: string | null
          model: string | null
          provider: string | null
          raw_bytes: number
          raw_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          script_hash: string
          script_version: string
          status: string
          storage_path: string | null
          updated_at: string
          voice: string
        }
        Insert: {
          bytes?: number
          clip_id: string
          created_at?: string
          created_by?: string | null
          duration?: number | null
          format?: string
          id?: string
          last_error?: string | null
          model?: string | null
          provider?: string | null
          raw_bytes?: number
          raw_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          script_hash: string
          script_version: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          voice?: string
        }
        Update: {
          bytes?: number
          clip_id?: string
          created_at?: string
          created_by?: string | null
          duration?: number | null
          format?: string
          id?: string
          last_error?: string | null
          model?: string | null
          provider?: string | null
          raw_bytes?: number
          raw_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          script_hash?: string
          script_version?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          voice?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_mp3_versions_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "lesson_mp3_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          account_name: string | null
          contact: string | null
          exam_packages: Json
          id: number
          kpay: string | null
          packages: Json
          updated_at: string
          wavepay: string | null
        }
        Insert: {
          account_name?: string | null
          contact?: string | null
          exam_packages?: Json
          id: number
          kpay?: string | null
          packages?: Json
          updated_at?: string
          wavepay?: string | null
        }
        Update: {
          account_name?: string | null
          contact?: string | null
          exam_packages?: Json
          id?: number
          kpay?: string | null
          packages?: Json
          updated_at?: string
          wavepay?: string | null
        }
        Relationships: []
      }
      practice_attempts: {
        Row: {
          answer: string
          correct: boolean
          id: string
          question_key: string
          skill: string
          unit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string
          correct?: boolean
          id?: string
          question_key: string
          skill: string
          unit: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          answer?: string
          correct?: boolean
          id?: string
          question_key?: string
          skill?: string
          unit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_seen_at: string
          status: string
          suspended_until: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_seen_at?: string
          status?: string
          suspended_until?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string
          status?: string
          suspended_until?: string | null
        }
        Relationships: []
      }
      speaking_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          turns: number
          unit: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          turns?: number
          unit: number
          user_id?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          turns?: number
          unit?: number
          user_id?: string
        }
        Relationships: []
      }
      study_enrollments: {
        Row: {
          created_at: string
          grade: number
          user_id: string
        }
        Insert: {
          created_at?: string
          grade: number
          user_id: string
        }
        Update: {
          created_at?: string
          grade?: number
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          from_admin: boolean
          id: string
          read_by_admin: boolean
          read_by_user: boolean
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          from_admin?: boolean
          id?: string
          read_by_admin?: boolean
          read_by_user?: boolean
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          from_admin?: boolean
          id?: string
          read_by_admin?: boolean
          read_by_user?: boolean
          user_id?: string
        }
        Relationships: []
      }
      teacher_requests: {
        Row: {
          created_at: string
          id: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      topup_requests: {
        Row: {
          created_at: string
          credits: number
          id: string
          kind: string
          method: string
          price: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          txn_ref: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          kind?: string
          method: string
          price: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          txn_ref: string
          user_id?: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          kind?: string
          method?: string
          price?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          txn_ref?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_chats: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_usage: {
        Row: {
          day: string
          used: number
          user_id: string
        }
        Insert: {
          day: string
          used?: number
          user_id: string
        }
        Update: {
          day?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      tutor_wallets: {
        Row: {
          bonus_left: number
          exam_bonus_left: number
          scholarship: string
          scholarship_note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_left?: number
          exam_bonus_left?: number
          scholarship?: string
          scholarship_note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_left?: number
          exam_bonus_left?: number
          scholarship?: string
          scholarship_note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unit_homework: {
        Row: {
          answers: Json
          assigned_at: string
          course_version: string
          feedback: Json | null
          grade: number
          submitted_at: string | null
          unit: number
          user_id: string
        }
        Insert: {
          answers?: Json
          assigned_at?: string
          course_version: string
          feedback?: Json | null
          grade: number
          submitted_at?: string | null
          unit: number
          user_id: string
        }
        Update: {
          answers?: Json
          assigned_at?: string
          course_version?: string
          feedback?: Json | null
          grade?: number
          submitted_at?: string | null
          unit?: number
          user_id?: string
        }
        Relationships: []
      }
      unit_section_learning: {
        Row: {
          answers: Json
          completed_at: string | null
          content_hash: string
          course_version: string
          grade: number
          lesson_version: string
          practised: boolean
          skill: string
          unit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          content_hash: string
          course_version: string
          grade: number
          lesson_version: string
          practised?: boolean
          skill: string
          unit: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          content_hash?: string
          course_version?: string
          grade?: number
          lesson_version?: string
          practised?: boolean
          skill?: string
          unit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_account_summaries: { Args: never; Returns: Json }
      admin_exam_credit: {
        Args: { _add: number; _user: string }
        Returns: undefined
      }
      admin_review_teacher: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      admin_review_topup: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      admin_tutor_update: {
        Args: { _add_bonus: number; _scholarship: string; _user: string }
        Returns: undefined
      }
      claim_class_exam_ai: {
        Args: { _attempt: string; _force?: boolean }
        Returns: boolean
      }
      claim_classroom_audio: {
        Args: {
          p_hash: string
          p_lesson: string
          p_path: string
          p_version: string
        }
        Returns: boolean
      }
      claim_classroom_audio_lease: {
        Args: {
          p_hash: string
          p_lesson: string
          p_path: string
          p_token: string
          p_version: string
        }
        Returns: boolean
      }
      class_chat: {
        Args: { _cid: string; _peer: string }
        Returns: {
          body: string
          created_at: string
          id: string
          is_teacher: boolean
          sender_id: string
          sender_name: string
        }[]
      }
      class_chat_mark_read: {
        Args: { _cid: string; _thread: string }
        Returns: undefined
      }
      class_chat_send: {
        Args: { _body: string; _cid: string; _peer: string }
        Returns: string
      }
      class_chat_unread: {
        Args: { _cid: string }
        Returns: {
          thread: string
          unread: number
        }[]
      }
      class_exam_grade: {
        Args: {
          _attempt: string
          _feedback: string
          _result: Json
          _score: number
          _total: number
        }
        Returns: undefined
      }
      class_exam_open: { Args: { _aid: string }; Returns: Json }
      class_exam_roster: {
        Args: { _aid: string }
        Returns: {
          attempt_id: string
          display_name: string
          graded_at: string
          image_paths: string[]
          result: Json
          score: number
          started_at: string
          student_id: string
          submitted_at: string
          teacher_feedback: string
          total_marks: number
        }[]
      }
      class_exam_submit: {
        Args: { _aid: string; _paths: string[] }
        Returns: undefined
      }
      class_feed: {
        Args: { _cid: string }
        Returns: {
          author_id: string
          author_name: string
          body: string
          created_at: string
          id: string
          is_teacher: boolean
        }[]
      }
      classroom_roster: {
        Args: { _cid: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          joined_at: string
          student_id: string
        }[]
      }
      classroom_roster_named: {
        Args: { _cid: string }
        Returns: {
          display_name: string
          email: string
          full_name: string
          joined_at: string
          student_id: string
        }[]
      }
      consume_tutor_message: { Args: never; Returns: Json }
      create_classroom: {
        Args: { _name: string; _subject: string }
        Returns: {
          code: string
          created_at: string
          id: string
          name: string
          subject: string
          teacher_id: string
        }
        SetofOptions: {
          from: "*"
          to: "classrooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      exam_quota: { Args: never; Returns: Json }
      finish_daily_class: {
        Args: {
          p_end: number
          p_grade: number
          p_lesson: string
          p_lesson_version: string
          p_session: number
          p_start: number
          p_user: string
          p_version: string
        }
        Returns: Json
      }
      grade11_audio_claim: {
        Args: { p_hash: string; p_unit: number }
        Returns: string
      }
      grade11_audio_stat: {
        Args: { p_hash?: string; p_kind: string }
        Returns: undefined
      }
      grade11_speaking_complete: {
        Args: {
          p_claim: string
          p_history: Json
          p_reply: Json
          p_request: string
          p_success: boolean
        }
        Returns: Json
      }
      grade11_speaking_end: { Args: { p_session: string }; Returns: Json }
      grade11_speaking_payload: {
        Args: {
          s: Database["public"]["Tables"]["grade11_speaking_sessions"]["Row"]
        }
        Returns: Json
      }
      grade11_speaking_prepare: {
        Args: {
          p_claim: string
          p_exercise: string
          p_operation: string
          p_request: string
          p_revision: number
          p_session: string
          p_unit: number
        }
        Returns: Json
      }
      grade11_speaking_status: { Args: { p_unit: number }; Returns: Json }
      grade11_speaking_validate: {
        Args: { p_session: string; p_unit: number }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_ai_account: { Args: never; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_class_member: { Args: { _cid: string }; Returns: boolean }
      is_class_teacher: { Args: { _cid: string }; Returns: boolean }
      is_main_admin: { Args: { _user_id: string }; Returns: boolean }
      join_classroom: { Args: { _code: string }; Returns: string }
      join_classroom_named: {
        Args: { _code: string; _name: string }
        Returns: string
      }
      lesson_mp3_backoff: {
        Args: {
          p_job: string
          p_provider: string
          p_seconds: number
          p_token: string
        }
        Returns: boolean
      }
      lesson_mp3_checkpoint: {
        Args: { p_job: string; p_patch: Json; p_token: string }
        Returns: boolean
      }
      lesson_mp3_claim: {
        Args: never
        Returns: {
          allow_generation: boolean
          attempts: number
          clip_id: string
          created_at: string
          id: string
          lease_until: string | null
          regenerate: boolean
          state: string
          token: string | null
          updated_at: string
          version_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "lesson_mp3_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      lesson_mp3_enqueue: {
        Args: { p_clip: string; p_regenerate?: boolean; p_user: string }
        Returns: string
      }
      lesson_mp3_reserve: {
        Args: {
          p_daily: number
          p_interval: number
          p_job: string
          p_model: string
          p_provider: string
          p_token: string
          p_tokens: number
          p_tpm: number
        }
        Returns: Json
      }
      lesson_mp3_review: {
        Args: { p_action: string; p_user: string; p_version: string }
        Returns: undefined
      }
      lesson_mp3_stats: { Args: never; Returns: Json }
      mm_today: { Args: never; Returns: string }
      my_access: { Args: never; Returns: Json }
      my_classes: {
        Args: never
        Returns: {
          code: string
          id: string
          joined_at: string
          name: string
          subject: string
          teacher_name: string
        }[]
      }
      my_name: { Args: never; Returns: string }
      record_exam_generation: {
        Args: { _paper: Json; _unit: number }
        Returns: Json
      }
      request_scholarship: { Args: { _note: string }; Returns: undefined }
      request_teacher_role: {
        Args: { _note: string; _school: string; _subject: string }
        Returns: undefined
      }
      reserve_ai_credit: {
        Args: { p_operation: string; p_request: string; p_user: string }
        Returns: Json
      }
      save_classroom_progress: {
        Args: {
          p_completed: number[]
          p_cursor: number
          p_lesson: string
          p_offset: number
          p_revision: number
          p_steps: number
          p_user: string
          p_version: string
        }
        Returns: Json
      }
      save_unit_section: {
        Args: {
          p_answers: Json
          p_finish: boolean
          p_hash: string
          p_lesson_version: string
          p_practised: boolean
          p_skill: string
          p_user: string
        }
        Returns: Json
      }
      set_member_name: {
        Args: { _cid: string; _name: string; _sid: string }
        Returns: undefined
      }
      set_my_name: { Args: { _name: string }; Returns: undefined }
      settle_ai_credit: {
        Args: { p_request: string; p_success: boolean; p_user: string }
        Returns: undefined
      }
      speaking_turn: { Args: { p_session: string }; Returns: Json }
      speaking_unit_status: { Args: { p_unit: number }; Returns: Json }
      start_speaking_session: { Args: { p_unit: number }; Returns: Json }
      strip_answers: { Args: { j: Json }; Returns: Json }
      tutor_quota: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "student" | "teacher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student", "teacher"],
    },
  },
} as const
