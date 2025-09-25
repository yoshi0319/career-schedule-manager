import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Building2, Calendar, MapPin, Clock, Edit3, Save, X, AlertTriangle } from 'lucide-react';
import { Company, Event, SelectionStage } from '@/types';
import { cn } from '@/lib/utils';
import { formatTimeSlotWithDate } from '@/lib/conflictDetection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CompanyDetailModalProps {
  company: Company;
  events: Event[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStage: (companyId: string, stage: SelectionStage) => void;
  onDeleteCompany: (companyId: string) => void;
}

const stageLabels: Record<SelectionStage, string> = {
  entry: 'エントリー',
  document_review: '書類選考',
  first_interview: '一次面接',
  second_interview: '二次面接',
  final_interview: '最終面接',
  offer: '内定',
  rejected: '不合格'
};

const stageColors: Record<SelectionStage, string> = {
  entry: 'bg-stone-100 text-stone-700 hover:bg-stone-200',
  document_review: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
  first_interview: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  second_interview: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  final_interview: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  offer: 'bg-green-100 text-green-700 hover:bg-green-200',
  rejected: 'bg-red-100 text-red-700 hover:bg-red-200'
};

// 選択時のステージ色を取得
const getSelectedStageColor = (stage: SelectionStage): string => {
  switch (stage) {
    case 'entry':
      return 'bg-stone-200 text-stone-900 hover:bg-stone-300';
    case 'document_review':
      return 'bg-slate-300 text-slate-900 hover:bg-slate-400'; // 少し濃いグレー背景 + 濃いグレー文字
    case 'first_interview':
      return 'bg-blue-200 text-blue-800 hover:bg-blue-300'; // 少し濃い青背景 + 濃い青文字
    case 'second_interview':
      return 'bg-orange-200 text-orange-800 hover:bg-orange-300'; // 少し濃いオレンジ背景 + 濃いオレンジ文字
    case 'final_interview':
      return 'bg-purple-200 text-purple-800 hover:bg-purple-300'; // 少し濃い紫背景 + 濃い紫文字
    case 'offer':
      return 'bg-green-200 text-green-800 hover:bg-green-300'; // 少し濃い緑背景 + 濃い緑文字
    case 'rejected':
      return 'bg-red-200 text-red-800 hover:bg-red-300'; // 少し濃い赤背景 + 濃い赤文字
    default:
      return 'bg-slate-200 text-slate-800 hover:bg-slate-300';
  }
};



export const CompanyDetailModal = ({ 
  company, 
  events, 
  isOpen, 
  onClose, 
  onUpdateStage,
  onDeleteCompany 
}: CompanyDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentStage, setCurrentStage] = useState<SelectionStage>(company.current_stage);
  const [notes, setNotes] = useState(company.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 編集開始時の元の値を保存
  const [originalStage, setOriginalStage] = useState<SelectionStage>(company.current_stage);
  const [originalNotes, setOriginalNotes] = useState(company.notes || '');

  // companyプロパティが変更された際にローカル状態を更新
  useEffect(() => {
    setCurrentStage(company.current_stage);
    setNotes(company.notes || '');
    setOriginalStage(company.current_stage);
    setOriginalNotes(company.notes || '');
  }, [company.current_stage, company.notes]);

  const companyEvents = events.filter(event => event.company_id === company.id);
  const confirmedEvents = companyEvents.filter(event => event.status === 'confirmed');
  const candidateEvents = companyEvents.filter(event => event.status === 'candidate');

  const handleSave = () => {
    if (currentStage !== company.current_stage) {
      onUpdateStage(company.id, currentStage);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDeleteCompany(company.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {company.name}
            </DialogTitle>
            <div className="flex items-center gap-2 pr-5">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    // キャンセル時に元の値に戻す
                    setCurrentStage(originalStage);
                    setNotes(originalNotes);
                    setIsEditing(false);
                  }}>
                    <X className="h-4 w-4 mr-1" />
                    キャンセル
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => {
                  // 編集開始時に元の値を保存
                  setOriginalStage(company.current_stage);
                  setOriginalNotes(company.notes || '');
                  setCurrentStage(company.current_stage);
                  setNotes(company.notes || '');
                  setIsEditing(true);
                }}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  編集
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">業界</Label>
              <div className="text-base mt-1">{company.industry}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">応募職種</Label>
              <div className="text-base mt-1">{company.position}</div>
            </div>
          </div>

          {/* 選考ステージ */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              選考ステージ
            </Label>
            {isEditing ? (
              <div className="mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(stageLabels).map(([key, label]) => {
                    const isSelected = currentStage === key;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setCurrentStage(key as SelectionStage)}
                        className={cn(
                          "relative p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105",
                          "flex flex-col items-center justify-center gap-2 min-h-[80px]",
                          isSelected 
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" 
                            : "border-border"
                        )}
                      >

                        
                        {/* ステージバッジ */}
                        <Badge 
                          className={cn(
                            "text-xs px-3 py-1",
                            isSelected 
                              ? getSelectedStageColor(key as SelectionStage)
                              : stageColors[key as SelectionStage]
                          )}
                        >
                          {label}
                        </Badge>
                        

                      </button>
                    );
                  })}
                </div>
                
                {/* 現在のステージ表示 */}
                <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-primary">
                      現在のステージ: {stageLabels[currentStage]}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <Badge className={cn(stageColors[currentStage], "text-sm px-3 py-1")}>
                  {stageLabels[currentStage]}
                </Badge>
              </div>
            )}
          </div>

          {/* 日程情報 */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              日程情報
            </Label>
            <div className="mt-2 space-y-3">
              {confirmedEvents.length > 0 ? (
                // 確定日程がある場合
                <div className="space-y-2">
                  <div className="text-sm font-medium text-confirmed">確定済み日程</div>
                  {confirmedEvents.map((event, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-confirmed/10 border border-confirmed/20 rounded-lg">
                      <Clock className="h-4 w-4 text-confirmed" />
                      <div className="flex-1">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.confirmed_slot && formatTimeSlotWithDate(event.confirmed_slot)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : candidateEvents.length > 0 ? (
                // 候補日程のみの場合
                <div className="space-y-2">
                  <div className="text-sm font-medium text-candidate">候補日程</div>
                  {candidateEvents.map((event, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-candidate/10 border border-candidate/20 rounded-lg">
                      <Clock className="h-4 w-4 text-candidate" />
                      <div className="flex-1">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.candidate_slots.length}件の候補日
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  予定はありません
                </div>
              )}
            </div>
          </div>

          {/* メモ */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">メモ</Label>
            {isEditing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="企業に関するメモを入力してください"
                className="mt-1"
                rows={3}
              />
            ) : (
              <div className="mt-1 p-3 bg-muted/30 rounded-lg min-h-[60px]">
                {notes || 'メモはありません'}
              </div>
            )}
          </div>
        </div>

        {/* 削除ボタン */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            企業を削除
          </Button>
        </div>
      </DialogContent>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              企業の削除
            </AlertDialogTitle>
            <AlertDialogDescription>
              この企業を削除しますか？関連する予定も全て削除されます。
              <br />
              <span className="font-medium text-destructive">
                この操作は取り消すことができません。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
