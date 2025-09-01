import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { SelectionStage } from '@/types';

interface AddCompanyFormProps {
  onAddCompany: (company: {
    name: string;
    industry: string;
    position: string;
    current_stage: SelectionStage;
  }) => void;
}

const industries = [
  'IT・ソフトウェア',
  'コンサルティング',
  '金融・保険',
  'メーカー・製造業',
  '商社・流通',
  'マスコミ・広告',
  '不動産・建設',
  'サービス・小売',
  '医療・福祉',
  '教育・学習支援',
  '公務・団体',
  'その他'
];

const stages: { value: SelectionStage; label: string }[] = [
  { value: 'document_review', label: '書類選考' },
  { value: 'first_interview', label: '一次面接' },
  { value: 'second_interview', label: '二次面接' },
  { value: 'final_interview', label: '最終面接' },
  { value: 'offer', label: '内定' },
  { value: 'rejected', label: '不合格' }
];

export const AddCompanyForm = ({ onAddCompany }: AddCompanyFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    position: '',
    current_stage: 'document_review' as SelectionStage
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.industry || !formData.position) return;
    
    onAddCompany(formData);
    setFormData({
      name: '',
      industry: '',
      position: '',
      current_stage: 'document_review'
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          企業を追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新しい企業を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">企業名</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="株式会社○○"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">業界</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="業界を選択" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">応募職種</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="エンジニア、営業、企画など"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stage">現在のステージ</Label>
            <Select
              value={formData.current_stage}
              onValueChange={(value: SelectionStage) => setFormData(prev => ({ ...prev, current_stage: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" className="flex-1">
              追加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};