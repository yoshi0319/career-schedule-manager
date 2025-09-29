import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Building2, Clock, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';

// スケルトンローディングコンポーネント
const LoadingSkeleton = () => (
  <div className="min-h-screen p-4 space-y-6">
    {/* ヘッダースケルトン */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    {/* 統計カードスケルトン */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    {/* タブスケルトン */}
    <Tabs defaultValue="companies" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </TabsList>
      
      <TabsContent value="companies" className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </TabsContent>
    </Tabs>
  </div>
);

const Index = () => {
  const { user, loading, signOut } = useAuth();

  // タブ状態を永続化
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return localStorage.getItem('csm_active_tab') || 'companies';
    } catch {
      return 'companies';
    }
  });

  const [companyFilter, setCompanyFilter] = useState<'active' | 'offers' | 'archived'>('active');
  const [companySort, setCompanySort] = useState<'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc' | 'stage_asc' | 'stage_desc'>('updated_desc');

  useEffect(() => {
    try {
      localStorage.setItem('csm_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

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

  const filteredCompanies = useMemo(() => {
    switch (companyFilter) {
      case 'active':
        return companies.filter(company => !company.is_archived && company.current_stage !== 'offer');
      case 'offers':
        return companies.filter(company => !company.is_archived && company.current_stage === 'offer');
      case 'archived':
        return companies.filter(company => company.is_archived);
      default:
        return companies.filter(company => !company.is_archived && company.current_stage !== 'offer');
    }
  }, [companies, companyFilter]);

  const sortedCompanies = useMemo(() => {
    const list = [...filteredCompanies];
    const stageOrder: Record<SelectionStage, number> = {
      entry: 1,
      document_review: 2,
      first_interview: 3,
      second_interview: 4,
      final_interview: 5,
      offer: 6,
      rejected: 7,
    };
    switch (companySort) {
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'stage_asc':
        return list.sort((a, b) => stageOrder[a.current_stage] - stageOrder[b.current_stage]);
      case 'stage_desc':
        return list.sort((a, b) => stageOrder[b.current_stage] - stageOrder[a.current_stage]);
      case 'updated_asc':
        return list.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      case 'updated_desc':
      default:
        return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
  }, [filteredCompanies, companySort]);

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

  // 統計データをメモ化して再計算を防ぐ（フック順序を維持）
  const upcomingEvents = useMemo(() => getUpcomingEvents(), [events]);
  const confirmedEventsCount = useMemo(() => events.filter(e => e.status === 'confirmed').length, [events]);
  const candidateEventsCount = useMemo(() => events.filter(e => e.status === 'candidate').length, [events]);

  // 認証チェック（フック後に実行）
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return <AuthForm />;
  }

  // データローディング状態（スケルトンローディングを表示）
  if (companiesLoading || eventsLoading) {
    return <LoadingSkeleton />;
  }

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

  const handleArchiveCompany = async (companyId: string) => {
    try {
      await apiClient.archiveCompany(companyId);
      // アーカイブタブに自動移動
      setCompanyFilter('archived');
      // データを再取得
      window.location.reload();
    } catch (error) {
      console.error('Failed to archive company:', error);
      alert('アーカイブに失敗しました。');
    }
  };

  const handleUnarchiveCompany = async (companyId: string) => {
    try {
      await apiClient.unarchiveCompany(companyId);
      // 応募中タブに自動移動
      setCompanyFilter('active');
      // データを再取得
      window.location.reload();
    } catch (error) {
      console.error('Failed to unarchive company:', error);
      alert('復元に失敗しました。');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleCloseEditEvent = () => {
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEventMutation.mutate(eventId);
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
      if (status === 'candidate' || status === 'rejected') {
        updateEventMutation.mutate({ id: eventId, event: { status, confirmed_slot: null as any } });
      } else {
        updateEventMutation.mutate({ id: eventId, event: { status } });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          {/* スマホ用レイアウト */}
          <div className="block sm:hidden relative">
            {/* ログアウトボタン - 右上に固定（スマホのみ） */}
            <div className="absolute top-0 right-0 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await signOut()
                  } catch (error) {
                    if (import.meta.env.DEV) {
                      console.error('Logout failed:', error)
                    }
                    // エラーが発生しても強制的にログアウト状態にする
                    window.location.reload()
                  }
                }}
                disabled={false}
                className="h-8 px-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            
            {/* メインコンテンツ（スマホ） */}
            <div className="flex flex-col space-y-4">
              {/* タイトル部分 */}
              <div className="flex-1 min-w-0 pr-20">
                <h1 className="text-2xl font-bold text-foreground leading-tight">
                  就活ダッシュボード
                </h1>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  あなたの就活を効率的に管理
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  ようこそ、{user.email} さん
                </p>
              </div>
              
              {/* 企業を追加ボタン - 左下に配置（スマホ） */}
              <div className="flex justify-start">
                <AddCompanyForm onAddCompany={handleAddCompany} />
              </div>
            </div>
          </div>
          
          {/* PC用レイアウト */}
          <div className="hidden sm:flex items-center justify-between">
            {/* タイトル部分 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-foreground leading-tight">
                就活ダッシュボード
              </h1>
              <p className="text-base text-muted-foreground mt-1 leading-relaxed">
                あなたの就活を効率的に管理
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                ようこそ、{user.email} さん
              </p>
            </div>
            
            {/* ボタン部分 - 横並び（PC） */}
            <div className="flex items-center gap-4">
              <AddCompanyForm onAddCompany={handleAddCompany} />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await signOut()
                  } catch (error) {
                    if (import.meta.env.DEV) {
                      console.error('Logout failed:', error)
                    }
                    // エラーが発生しても強制的にログアウト状態にする
                    window.location.reload()
                  }
                }}
                disabled={false}
                className="h-9 px-3"
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
        {/* スマホ用：横型コンパクト表示 */}
        <div className="block sm:hidden mb-4">
          <div className="flex gap-2">
            <div className="flex-1 bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">総企業数</span>
                <Building2 className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-lg font-bold">{companies.length}</div>
            </div>
            
            <div className="flex-1 bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">候補日</span>
                <Clock className="h-3 w-3 text-candidate" />
              </div>
              <div className="text-lg font-bold text-candidate">{candidateEventsCount}</div>
            </div>
            
            <div className="flex-1 bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">確定予定</span>
                <Calendar className="h-3 w-3 text-confirmed" />
              </div>
              <div className="text-lg font-bold text-confirmed">{confirmedEventsCount}</div>
            </div>
          </div>
        </div>
        
        {/* PC用：従来通りの縦型カード */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
              <CardTitle className="text-sm font-medium">確定予定</CardTitle>
              <Calendar className="h-4 w-4 text-confirmed" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-confirmed">{confirmedEventsCount}</div>
              <p className="text-xs text-muted-foreground">確定した面接・説明会</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="companies" className="text-xs sm:text-sm">企業一覧</TabsTrigger>
            <TabsTrigger value="events" className="text-xs sm:text-sm">予定一覧</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm">カレンダー</TabsTrigger>
          </TabsList>
          
          <TabsContent value="companies" className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={companyFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setCompanyFilter('active')}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  応募中 ({companies.filter(c => !c.is_archived && c.current_stage !== 'offer').length})
                </Button>
                <Button
                  variant={companyFilter === 'offers' ? 'default' : 'outline'}
                  onClick={() => setCompanyFilter('offers')}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  内定 ({companies.filter(c => !c.is_archived && c.current_stage === 'offer').length})
                </Button>
                <Button
                  variant={companyFilter === 'archived' ? 'default' : 'outline'}
                  onClick={() => setCompanyFilter('archived')}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  アーカイブ ({companies.filter(c => c.is_archived).length})
                </Button>
                <div className="ml-auto w-full sm:w-64 mt-2 sm:mt-0">
                  <Select value={companySort} onValueChange={(v) => setCompanySort(v as any)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="並び替え" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated_desc">更新日が新しい順</SelectItem>
                      <SelectItem value="updated_asc">更新日が古い順</SelectItem>
                      <SelectItem value="name_asc">名前の昇順</SelectItem>
                      <SelectItem value="name_desc">名前の降順</SelectItem>
                      <SelectItem value="stage_asc">ステージの昇順</SelectItem>
                      <SelectItem value="stage_desc">ステージの降順</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <h2 className="text-lg sm:text-xl font-semibold mb-4">応募企業 ({filteredCompanies.length}社)</h2>
              {filteredCompanies.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <Building2 className="h-8 sm:h-12 w-8 sm:w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">まだ企業が登録されていません</h3>
                    <p className="text-muted-foreground text-center mb-4 text-sm sm:text-base">
                      最初の企業を追加して就活管理を始めましょう
                    </p>
                    <AddCompanyForm onAddCompany={handleAddCompany} />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sortedCompanies.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      events={events}
                      onViewDetails={() => handleViewCompanyDetails(company)}
                      onUpdateStage={handleUpdateCompanyStage}
                      onDeleteCompany={handleDeleteCompany}
                      onArchiveCompany={handleArchiveCompany}
                      onUnarchiveCompany={handleUnarchiveCompany}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">予定一覧</h2>
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
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <Calendar className="h-8 sm:h-12 w-8 sm:w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">まだ予定がありません</h3>
                    <p className="text-muted-foreground text-center text-sm sm:text-base">
                      企業を追加して面接や説明会の予定を管理しましょう
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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

