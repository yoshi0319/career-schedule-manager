import { Event, TimeSlot } from '@/types';

// Add 30 minutes buffer before and after events
const BUFFER_MINUTES = 30;

export function addBufferToTimeSlot(slot: TimeSlot): TimeSlot {
  return {
    startTime: new Date(slot.startTime.getTime() - BUFFER_MINUTES * 60 * 1000),
    endTime: new Date(slot.endTime.getTime() + BUFFER_MINUTES * 60 * 1000)
  };
}

export function checkTimeSlotConflict(
  newSlot: TimeSlot,
  existingEvents: Event[]
): { hasConflict: boolean; conflictingEvents: Event[] } {
  const conflictingEvents: Event[] = [];
  
  for (const event of existingEvents) {
    // Check against confirmed slots
    if (event.confirmedSlot) {
      const bufferedSlot = addBufferToTimeSlot(event.confirmedSlot);
      if (timeSlotsOverlap(newSlot, bufferedSlot)) {
        conflictingEvents.push(event);
      }
    }
    
    // Check against candidate slots
    for (const candidateSlot of event.candidateSlots) {
      const bufferedSlot = addBufferToTimeSlot(candidateSlot);
      if (timeSlotsOverlap(newSlot, bufferedSlot)) {
        conflictingEvents.push(event);
        break; // Only add the event once
      }
    }
  }
  
  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents
  };
}

function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime;
}

export function formatTimeSlot(slot: TimeSlot): string {
  const startTime = slot.startTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const endTime = slot.endTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `${startTime}〜${endTime}`;
}

export function formatTimeSlotWithDate(slot: TimeSlot): string {
  const date = slot.startTime.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
  
  return `${date} ${formatTimeSlot(slot)}`;
}