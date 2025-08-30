import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, Building2, Clock } from 'lucide-react';
import { useJobHuntingData } from '@/hooks/useJobHuntingData';
import { CompanyCard } from '@/components/CompanyCard';
import { EventCard } from '@/components/EventCard';
import { AddCompanyForm } from '@/components/AddCompanyForm';
import { AddEventForm } from '@/components/AddEventForm';
import { CompanyDetailModal } from '@/components/CompanyDetailModal';
import { formatTimeSlotWithDate } from '@/lib/conflictDetection';
import { Company, SelectionStage, Event } from '@/types';

const Index = () => {
  const { 
    companies, 
    events, 
    addCompany, 
    addEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus, 
    updateCompanyStage,
    deleteCompany,
    getUpcomingEvents 
  } = useJobHuntingData();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const upcomingEvents = getUpcomingEvents();
  const confirmedEventsCount = events.filter(e => e.status === 'confirmed').length;
  const candidateEventsCount = events.filter(e => e.status === 'candidate').length;
  const pendingEventsCount = events.filter(e => e.status === 'pending').length;

  const handleViewCompanyDetails = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyDetail(true);
  };

  const handleUpdateCompanyStage = (companyId: string, stage: SelectionStage) => {
    updateCompanyStage(companyId, stage);
  };

  const handleDeleteCompany = (companyId: string) => {
    deleteCompany(companyId);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleCloseEditEvent = () => {
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('この予定を削除しますか？')) {
      deleteEvent(eventId);
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
            </div>
            <AddCompanyForm onAddCompany={addCompany} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">返信待ち</CardTitle>
              <TrendingUp className="h-4 w-4 text-pending" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pending">{pendingEventsCount}</div>
              <p className="text-xs text-muted-foreground">企業からの返信待ち</p>
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
                    <AddCompanyForm onAddCompany={addCompany} />
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
                  onAddEvent={addEvent} 
                />
                {editingEvent && (
                  <AddEventForm 
                    key={`edit-event-form-${editingEvent.id}`}
                    companies={companies}
                    events={events}
                    editEvent={editingEvent}
                    onAddEvent={addEvent}
                    onUpdateEvent={updateEvent}
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
                      onUpdateStatus={updateEventStatus}
                      onEditEvent={handleEditEvent}
                      onDeleteEvent={handleDeleteEvent}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">今後の予定</h2>
              <Card>
                <CardContent className="p-6">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">今後の予定はありません</h3>
                      <p className="text-muted-foreground">
                        新しい面接や説明会の予定を追加してみましょう
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingEvents.slice(0, 10).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">{event.companyName}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatTimeSlotWithDate(
                                event.confirmedSlot || event.candidateSlots[0]
                              ).split(' ')[0]} {/* Date part */}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTimeSlotWithDate(
                                event.confirmedSlot || event.candidateSlots[0]
                              ).split(' ')[1]} {/* Time part */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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

