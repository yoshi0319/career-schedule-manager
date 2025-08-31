export type EventStatus = 'candidate' | 'confirmed' | 'rejected';
export type EventType = 'interview' | 'info_session' | 'group_discussion' | 'final_interview';
export type SelectionStage = 'document_review' | 'first_interview' | 'second_interview' | 'final_interview' | 'offer' | 'rejected';

export interface Company {
  id: string;
  name: string;
  industry: string;
  position: string;
  current_stage: SelectionStage;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TimeSlot {
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
  candidate_slots: TimeSlot[];
  confirmed_slot?: TimeSlot;
  location?: string;
  is_online: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConflictCheck {
  has_conflict: boolean;
  conflicting_events: Event[];
  suggested_alternatives?: Date[];
}