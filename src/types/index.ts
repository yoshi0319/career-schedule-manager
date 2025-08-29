export type EventStatus = 'candidate' | 'confirmed' | 'pending' | 'rejected';
export type EventType = 'interview' | 'info_session' | 'group_discussion' | 'final_interview';
export type SelectionStage = 'document_review' | 'first_interview' | 'second_interview' | 'final_interview' | 'offer' | 'rejected';

export interface Company {
  id: string;
  name: string;
  industry: string;
  position: string;
  currentStage: SelectionStage;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  type: EventType;
  status: EventStatus;
  candidateDates: Date[];
  confirmedDate?: Date;
  location?: string;
  isOnline: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingEvents: Event[];
  suggestedAlternatives?: Date[];
}