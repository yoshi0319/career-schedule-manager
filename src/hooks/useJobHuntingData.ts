import { useState, useCallback } from 'react';
import { Company, Event, EventStatus, SelectionStage } from '@/types';

// Mock data for initial development
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'テックカンパニー株式会社',
    industry: 'IT・ソフトウェア',
    position: 'フロントエンドエンジニア',
    currentStage: 'first_interview',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: '株式会社データソリューション',
    industry: 'IT・データ分析',
    position: 'データサイエンティスト',
    currentStage: 'document_review',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  }
];

const mockEvents: Event[] = [
  {
    id: '1',
    companyId: '1',
    companyName: 'テックカンパニー株式会社',
    title: '一次面接',
    type: 'interview',
    status: 'candidate',
    candidateDates: [
      new Date('2024-02-01T10:00:00'),
      new Date('2024-02-02T14:00:00'),
      new Date('2024-02-05T10:30:00')
    ],
    location: '東京オフィス',
    isOnline: false,
    notes: '履歴書とポートフォリオを持参',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    companyId: '2',
    companyName: '株式会社データソリューション',
    title: '会社説明会',
    type: 'info_session',
    status: 'confirmed',
    candidateDates: [new Date('2024-02-03T13:00:00')],
    confirmedDate: new Date('2024-02-03T13:00:00'),
    isOnline: true,
    notes: 'Zoomリンクは後日送付',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-22'),
  }
];

export const useJobHuntingData = () => {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [events, setEvents] = useState<Event[]>(mockEvents);

  const addCompany = useCallback((company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCompany: Company = {
      ...company,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCompanies(prev => [...prev, newCompany]);
    return newCompany;
  }, []);

  const updateCompanyStage = useCallback((companyId: string, stage: SelectionStage) => {
    setCompanies(prev => prev.map(company => 
      company.id === companyId 
        ? { ...company, currentStage: stage, updatedAt: new Date() }
        : company
    ));
  }, []);

  const addEvent = useCallback((event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateEventStatus = useCallback((eventId: string, status: EventStatus, confirmedDate?: Date) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, status, confirmedDate, updatedAt: new Date() }
        : event
    ));
  }, []);

  const getUpcomingEvents = useCallback(() => {
    const now = new Date();
    return events
      .filter(event => {
        const eventDate = event.confirmedDate || event.candidateDates[0];
        return eventDate && eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = a.confirmedDate || a.candidateDates[0];
        const dateB = b.confirmedDate || b.candidateDates[0];
        return dateA.getTime() - dateB.getTime();
      });
  }, [events]);

  return {
    companies,
    events,
    addCompany,
    updateCompanyStage,
    addEvent,
    updateEventStatus,
    getUpcomingEvents,
  };
};