import { useState, useCallback } from 'react';
import { Company, Event, EventStatus, SelectionStage, TimeSlot } from '@/types';

// Mock data for initial development
const mockCompanies: Company[] = [
  {
    id: '1',
    name: '株式会社テックソリューション',
    industry: 'IT・ソフトウェア',
    position: 'フロントエンドエンジニア',
    current_stage: 'first_interview',
    notes: '技術面接でReactの実装について質問される予定',
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-20'),
  }
];

const mockEvents: Event[] = [
  {
    id: '1',
    company_id: '1',
    company_name: '株式会社テックソリューション',
    title: '一次面接',
    type: 'interview',
    status: 'confirmed',
    candidate_slots: [{
      start_time: new Date('2024-02-01T10:00:00'),
      end_time: new Date('2024-02-01T11:00:00')
    }],
    confirmed_slot: {
      start_time: new Date('2024-02-01T10:00:00'),
      end_time: new Date('2024-02-01T11:00:00')
    },
    is_online: false,
    location: '東京都渋谷区',
    notes: '技術面接。事前課題の説明を準備',
    created_at: new Date('2024-01-18'),
    updated_at: new Date('2024-01-22'),
  },
  {
    id: '2',
    company_id: '2',
    company_name: '株式会社データソリューション',
    title: '会社説明会',
    type: 'info_session',
    status: 'confirmed',
    candidate_slots: [{
      start_time: new Date('2024-02-03T13:00:00'),
      end_time: new Date('2024-02-03T15:00:00')
    }],
    confirmed_slot: {
      start_time: new Date('2024-02-03T13:00:00'),
      end_time: new Date('2024-02-03T15:00:00')
    },
    is_online: true,
    notes: 'Zoomリンクは後日送付',
    created_at: new Date('2024-01-18'),
    updated_at: new Date('2024-01-22'),
  }
];

export const useJobHuntingData = () => {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [events, setEvents] = useState<Event[]>(mockEvents);

  const addCompany = useCallback((company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    const newCompany: Company = {
      ...company,
      id: Date.now().toString(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    setCompanies(prev => [...prev, newCompany]);
    return newCompany;
  }, []);

  const updateCompanyStage = useCallback((companyId: string, stage: SelectionStage) => {
    setCompanies(prev => prev.map(company => 
      company.id === companyId 
        ? { ...company, current_stage: stage, updated_at: new Date() }
        : company
    ));
  }, []);

  const deleteCompany = useCallback((companyId: string) => {
    setCompanies(prev => prev.filter(company => company.id !== companyId));
    setEvents(prev => prev.filter(event => event.company_id !== companyId));
  }, []);

  const addEvent = useCallback((event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateEventStatus = useCallback((eventId: string, status: EventStatus, confirmedSlot?: TimeSlot) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, status, confirmedSlot, updated_at: new Date() }
        : event
    ));
  }, []);

  const updateEvent = useCallback((eventId: string, eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...eventData, id: eventId, created_at: event.created_at, updated_at: new Date() }
        : event
    ));
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  const getUpcomingEvents = useCallback(() => {
    const now = new Date();
    return events
      .filter(event => {
        const eventTime = event.confirmed_slot?.start_time || event.candidate_slots[0]?.start_time;
        return eventTime && eventTime >= now;
      })
      .sort((a, b) => {
        const timeA = a.confirmed_slot?.start_time || a.candidate_slots[0]?.start_time;
        const timeB = b.confirmed_slot?.start_time || b.candidate_slots[0]?.start_time;
        return (timeA?.getTime() || 0) - (timeB?.getTime() || 0);
      });
  }, [events]);

  return {
    companies,
    events,
    addCompany,
    updateCompanyStage,
    deleteCompany,
    addEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    getUpcomingEvents,
  };
};