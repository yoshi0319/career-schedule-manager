import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, MapPin, Clock, MoreVertical, X } from 'lucide-react';
import { Company, SelectionStage, Event } from '@/types';
import { cn } from '@/lib/utils';
import { formatTimeSlotWithDate } from '@/lib/conflictDetection';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CompanyCardProps {
  company: Company;
  events: Event[];
  onViewDetails: () => void;
  onUpdateStage: (companyId: string, stage: SelectionStage) => void;
  onDeleteCompany: (companyId: string) => void;
}

const stageLabels: Record<SelectionStage, string> = {
  document_review: '書類選考',
  first_interview: '一次面接',
  second_interview: '二次面接',
  final_interview: '最終面接',
  offer: '内定',
  rejected: '不合格'
};

const stageColors: Record<SelectionStage, string> = {
  document_review: 'bg-pending text-pending-foreground',
  first_interview: 'bg-candidate text-candidate-foreground',
  second_interview: 'bg-candidate text-candidate-foreground',
  final_interview: 'bg-candidate text-candidate-foreground',
  offer: 'bg-confirmed text-confirmed-foreground',
  rejected: 'bg-rejected text-rejected-foreground'
};

export const CompanyCard = ({ company, events, onViewDetails, onUpdateStage, onDeleteCompany }: CompanyCardProps) => {
  const companyEvents = events.filter(event => event.companyId === company.id);
  const confirmedEvents = companyEvents.filter(event => event.status === 'confirmed');
  const eventCount = companyEvents.length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{company.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(stageColors[company.currentStage])}>
              {stageLabels[company.currentStage]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Building2 className="h-4 w-4 mr-2" />
                  詳細を表示
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdateStage(company.id, company.currentStage)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  選考ステージを変更
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDeleteCompany(company.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  企業を削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {company.industry}
        </div>
        <div className="text-sm font-medium">
          {company.position}
        </div>
        
        {/* 確定日程がある場合のみ表示 */}
        {confirmedEvents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-confirmed">確定済み日程</div>
            {confirmedEvents.slice(0, 2).map((event, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-confirmed/10 border border-confirmed/20 rounded-lg">
                <Clock className="h-4 w-4 text-confirmed" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {event.confirmedSlot && formatTimeSlotWithDate(event.confirmedSlot)}
                  </div>
                </div>
              </div>
            ))}
            {confirmedEvents.length > 2 && (
              <div className="text-xs text-muted-foreground text-center">
                他 {confirmedEvents.length - 2}件
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{eventCount}件の予定</span>
          </div>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            詳細を見る
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};