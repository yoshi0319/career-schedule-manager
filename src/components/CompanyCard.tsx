import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, MapPin } from 'lucide-react';
import { Company, SelectionStage } from '@/types';
import { cn } from '@/lib/utils';

interface CompanyCardProps {
  company: Company;
  eventCount: number;
  onViewDetails: () => void;
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

export const CompanyCard = ({ company, eventCount, onViewDetails }: CompanyCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{company.name}</CardTitle>
          </div>
          <Badge className={cn(stageColors[company.currentStage])}>
            {stageLabels[company.currentStage]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {company.industry}
        </div>
        <div className="text-sm font-medium">
          {company.position}
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{eventCount}件の予定</span>
          </div>
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}>
            詳細を見る
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};