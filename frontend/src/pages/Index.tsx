import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Building2, Clock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/useCompanies';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useConfirmEvent } from '@/hooks/useEvents';
import { CompanyCard } from '@/components/CompanyCard';
import { EventCard } from '@/components/EventCard';
import { AddCompanyForm } from '@/components/AddCompanyForm';
import { AddEventForm } from '@/components/AddEventForm';
import { CompanyDetailModal } from '@/components/CompanyDetailModal';
import { JobCalendar } from '@/components/JobCalendar';
import { formatTimeSlotWithDate } from '@/lib/conflictDetection';
import { Company, SelectionStage, Event, EventStatus } from '@/types';

const Index = () => {
  const { user, loading, signOut } = useAuth();

  // API データ取得（フック順序を維持）
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  
  // API ミューテーション
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const confirmEventMutation = useConfirmEvent();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // 認証チェック（フック後に実行）
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // データローディング状態
  if (companiesLoading || eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // 今後の予定を取得（ローカル計算）
  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => {
        const eventTime = event.confirmed_slot?.start_time || event.candidate_slots[0]?.start_time;
        return eventTime && new Date(eventTime) >= now;
      })
      .sort((a, b) => {
        const timeA = new Date(a.confirmed_slot?.start_time || a.candidate_slots[0]?.start_time || '');
        const timeB = new Date(b.confirmed_slot?.start_time || b.candidate_slots[0]?.start_time || '');
        return timeA.getTime() - timeB.getTime();
      })
      .slice(0, 5);
  };

  const upcomingEvents = getUpcomingEvents();
  const confirmedEventsCount = events.filter(e => e.status === 'confirmed').length;
  const candidateEventsCount = events.filter(e => e.status === 'candidate').length;

  const handleViewCompanyDetails = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyDetail(true);
  };

  const handleUpdateCompanyStage = (companyId: string, stage: SelectionStage) => {
    updateCompanyMutation.mutate({ id: companyId, company: { current_stage: stage } });
  };

  const handleDeleteCompany = (companyId: string) => {
    deleteCompanyMutation.mutate(companyId);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleCloseEditEvent = () => {
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('この予定を削除しますか？')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleAddCompany = (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    createCompanyMutation.mutate(companyData);
  };

  const handleAddEvent = (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    createEventMutation.mutate(eventData);
  };

  const handleUpdateEvent = (eventId: string, eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    updateEventMutation.mutate({ id: eventId, event: eventData });
    setEditingEvent(null);
  };

  const handleUpdateEventStatus = (eventId: string, status: EventStatus, confirmed_slot?: any) => {
    if (confirmed_slot) {
      confirmEventMutation.mutate({ id: eventId, confirmedSlot: confirmed_slot, status });
    } else {
      updateEventMutation.mutate({ id: eventId, event: { status } });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">就活ダッシュボード</h1>
              <p className="text-muted-foreground mt-1">あなたの就活を効率的に管理</p>
              <p className="text-sm text-muted-foreground mt-1">
                ようこそ、{user.email} さん
              </p>
            </div>
            <div className="flex items-center gap-4">
              <AddCompanyForm onAddCompany={handleAddCompany} />
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総企業数</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground">応募・選考中</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">確定予定</CardTitle>
              <Calendar className="h-4 w-4 text-confirmed" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-confirmed">{confirmedEventsCount}</div>
              <p className="text-xs text-muted-foreground">確定した面接・説明会</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">候補日</CardTitle>
              <Clock className="h-4 w-4 text-candidate" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-candidate">{candidateEventsCount}</div>
              <p className="text-xs text-muted-foreground">調整中の予定</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="companies">企業一覧</TabsTrigger>
            <TabsTrigger value="events">予定一覧</TabsTrigger>
            <TabsTrigger value="calendar">カレンダー</TabsTrigger>
          </TabsList>
          
          <TabsContent value="companies" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">応募企業 ({companies.length}社)</h2>
              {companies.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">まだ企業が登録されていません</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      最初の企業を追加して就活管理を始めましょう
                    </p>
                    <AddCompanyForm onAddCompany={handleAddCompany} />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companies.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      events={events}
                      onViewDetails={() => handleViewCompanyDetails(company)}
                      onUpdateStage={handleUpdateCompanyStage}
                      onDeleteCompany={handleDeleteCompany}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">予定一覧</h2>
                <AddEventForm 
                  key="add-event-form"
                  companies={companies}
                  events={events}
                  onAddEvent={handleAddEvent} 
                />
                {editingEvent && (
                  <AddEventForm 
                    key={`edit-event-form-${editingEvent.id}`}
                    companies={companies}
                    events={events}
                    editEvent={editingEvent}
                    onAddEvent={(eventData) => handleUpdateEvent(editingEvent.id, eventData)}
                    onUpdateEvent={handleUpdateEvent}
                    onClose={handleCloseEditEvent}
                  />
                )}
              </div>
              {events.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">まだ予定がありません</h3>
                    <p className="text-muted-foreground text-center">
                      企業を追加して面接や説明会の予定を管理しましょう
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      allEvents={events}
                      companies={companies}
                      onUpdateStatus={handleUpdateEventStatus}
                      onEditEvent={handleEditEvent}
                      onDeleteEvent={handleDeleteEvent}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <JobCalendar events={events} companies={companies} />
          </TabsContent>
        </Tabs>
      </main>

      {/* 企業詳細モーダル */}
      {selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          events={events}
          isOpen={showCompanyDetail}
          onClose={() => {
            setShowCompanyDetail(false);
            setSelectedCompany(null);
          }}
          onUpdateStage={handleUpdateCompanyStage}
          onDeleteCompany={handleDeleteCompany}
        />
      )}
    </div>
  );
};

export default Index;

