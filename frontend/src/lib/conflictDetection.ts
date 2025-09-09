import { Event, TimeSlot, InterviewTimeSlot } from '@/types';

// Add 30 minutes buffer before and after events
const BUFFER_MINUTES = 30;

export function addBufferToTimeSlot(slot: TimeSlot | InterviewTimeSlot): TimeSlot {
  return {
    start_time: new Date(slot.start_time.getTime() - BUFFER_MINUTES * 60 * 1000),
    end_time: new Date(slot.end_time.getTime() + BUFFER_MINUTES * 60 * 1000)
  };
}

// 候補時間帯の追加時は、確定済み面接時間との競合のみをチェック
export function checkCandidateTimeSlotConflict(
  newSlot: TimeSlot,
  existingEvents: Event[]
): { hasConflict: boolean; conflictingEvents: Event[] } {
  const conflictingEvents: Event[] = [];
  
  for (const event of existingEvents) {
    // 確定済みの面接時間のみをチェック（候補時間帯は競合判定に使わない）
    if (event.confirmed_slot) {
      const bufferedSlot = addBufferToTimeSlot(event.confirmed_slot);
      if (timeSlotsOverlap(newSlot, bufferedSlot)) {
        conflictingEvents.push(event);
      }
    }
  }
  
  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents
  };
}

// 面接時間確定時は、確定済み面接時間との競合をチェック
export function checkInterviewTimeConflict(
  newSlot: InterviewTimeSlot,
  existingEvents: Event[]
): { hasConflict: boolean; conflictingEvents: Event[] } {
  const conflictingEvents: Event[] = [];
  
  for (const event of existingEvents) {
    // 確定済みの面接時間との競合をチェック
    if (event.confirmed_slot) {
      const bufferedSlot = addBufferToTimeSlot(event.confirmed_slot);
      if (timeSlotsOverlap(newSlot, bufferedSlot)) {
        conflictingEvents.push(event);
      }
    }
  }
  
  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents
  };
}

// 確定済みイベントのみとの重複をチェックする関数（後方互換性のため残す）
export function checkConfirmedEventConflict(
  newSlot: TimeSlot,
  existingEvents: Event[]
): { hasConflict: boolean; conflictingEvents: Event[] } {
  return checkInterviewTimeConflict(newSlot, existingEvents);
}

function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.start_time < slot2.end_time && slot1.end_time > slot2.start_time;
}

export function formatTimeSlot(slot: TimeSlot): string {
  const startTime = slot.start_time.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const endTime = slot.end_time.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `${startTime}〜${endTime}`;
}

export function formatTimeSlotWithDate(slot: TimeSlot): string {
  const date = slot.start_time.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
  
  return `${date} ${formatTimeSlot(slot)}`;
}
