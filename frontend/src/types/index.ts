export type EventStatus = 'candidate' | 'confirmed' | 'rejected';
export type EventType = 'meeting' | 'interview' | 'info_session' | 'group_discussion' | 'final_interview';
export type SelectionStage = 'entry' | 'document_review' | 'first_interview' | 'second_interview' | 'final_interview' | 'offer' | 'rejected';

export interface Company {
  id: string;
  name: string;
  industry: string;
  position: string;
  current_stage: SelectionStage;
  notes?: string;
  is_archived: boolean;
  archived_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TimeSlot {
  start_time: Date;
  end_time: Date;
}

// 候補時間帯（企業が提示した調整可能な時間範囲）
export interface CandidateTimeSlot {
  start_time: Date;
  end_time: Date;
}

// 面接時間（候補時間帯から選んだ具体的な面接時間）
export interface InterviewTimeSlot {
  start_time: Date;
  end_time: Date;
}

export interface Event {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  type: EventType;
  status: EventStatus;
  candidate_slots: CandidateTimeSlot[];  // 候補時間帯
  confirmed_slot?: InterviewTimeSlot;    // 確定した面接時間
  interview_duration: number;            // 予定時間（分）
  custom_email_format?: string;          // カスタムメールフォーマット
  location?: string;
  is_online: boolean;
  notes?: string;
  is_archived: boolean;
  archived_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ConflictCheck {
  has_conflict: boolean;
  conflicting_events: Event[];
  suggested_alternatives?: Date[];
}
