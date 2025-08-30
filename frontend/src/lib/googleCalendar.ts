import { Event, Company } from '@/types';
import { format } from 'date-fns';

interface CalendarEventData {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

/**
 * GoogleカレンダーのイベントURL形式に変換
 * @param eventData カレンダーイベントデータ
 * @returns GoogleカレンダーのイベントURL
 */
export function generateGoogleCalendarUrl(eventData: CalendarEventData): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  
  // 日時をGoogleカレンダー形式に変換
  // Googleカレンダーは日付のみの場合と時刻を含む場合で異なる形式を期待
  const formatDateTime = (date: Date): string => {
    // 日本時間でのローカル時刻をそのまま使用
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = '00'; // 秒は常に00に固定
    
    // Googleカレンダーの時刻付きイベント形式: YYYYMMDDTHHMMSS
    const formatted = `${year}${month}${day}T${hours}${minutes}${seconds}`;
    console.log(`日時変換: ${date.toISOString()} -> ${formatted}`);
    return formatted;
  };

  const startFormatted = formatDateTime(eventData.start);
  const endFormatted = formatDateTime(eventData.end);
  const datesParam = `${startFormatted}/${endFormatted}`;
  
  console.log(`Googleカレンダー用日時: ${datesParam}`);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    dates: datesParam,
    details: eventData.description || '',
    location: eventData.location || '',
    ctz: 'Asia/Tokyo', // 明示的に日本時間を指定
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log(`生成されたURL: ${url}`);
  
  return url;
}

/**
 * 就活イベントからGoogleカレンダー用データを生成
 * @param event 就活イベント
 * @param company 企業情報
 * @returns カレンダーイベントデータ
 */
export function createCalendarEventFromJobEvent(
  event: Event, 
  company: Company
): CalendarEventData | null {
  if (!event.confirmedSlot) {
    return null; // 確定していない場合はnull
  }

  const eventTypeLabels: Record<string, string> = {
    interview: '面接',
    info_session: '説明会',
    group_discussion: 'グループディスカッション',
    final_interview: '最終面接'
  };

  const eventTypeLabel = eventTypeLabels[event.type] || event.type;
  const title = `【${eventTypeLabel}】${company.name}`;

  // 説明文を作成
  const description = [
    `企業名: ${company.name}`,
    `業界: ${company.industry}`,
    `職種: ${company.position}`,
    `イベント: ${event.title}`,
    `形式: ${event.isOnline ? 'オンライン' : 'オフライン'}`,
    event.location ? `場所: ${event.location}` : '',
    event.notes ? `備考: ${event.notes}` : '',
    '',
    '※この予定は就活スケジュール管理アプリから登録されました',
  ].filter(Boolean).join('\n');

  return {
    title,
    start: event.confirmedSlot.startTime,
    end: event.confirmedSlot.endTime,
    description,
    location: event.isOnline ? 'オンライン' : (event.location || ''),
  };
}

/**
 * 就活イベントをGoogleカレンダーに登録
 * @param event 就活イベント
 * @param company 企業情報
 * @returns GoogleカレンダーのURL（新しいタブで開かれる）
 */
export function exportToGoogleCalendar(event: Event, company: Company): boolean {
  const calendarEvent = createCalendarEventFromJobEvent(event, company);
  
  if (!calendarEvent) {
    console.error('確定していないイベントはGoogleカレンダーに登録できません');
    return false;
  }

  const url = generateGoogleCalendarUrl(calendarEvent);
  
  try {
    // 新しいタブでGoogleカレンダーを開く
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  } catch (error) {
    console.error('Googleカレンダーを開けませんでした:', error);
    return false;
  }
}

/**
 * 複数のイベントを一括でGoogleカレンダーに登録
 * @param events 就活イベントの配列
 * @param companies 企業情報の配列
 * @returns 成功した件数
 */
export function exportMultipleToGoogleCalendar(
  events: Event[], 
  companies: Company[]
): number {
  let successCount = 0;
  
  const confirmedEvents = events.filter(event => event.confirmedSlot);
  
  confirmedEvents.forEach((event, index) => {
    const company = companies.find(c => c.id === event.companyId);
    if (company) {
      // 少し間隔を開けて連続でタブを開く
      setTimeout(() => {
        if (exportToGoogleCalendar(event, company)) {
          successCount++;
        }
      }, index * 500); // 500ms間隔
    }
  });

  return confirmedEvents.length;
}

/**
 * Googleカレンダーの利用可能性をチェック
 * @returns Googleカレンダーが利用可能かどうか
 */
export function isGoogleCalendarAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.open === 'function';
}

/**
 * デバッグ用：日時変換のテスト
 * @param testDate テスト用の日時
 */
export function debugDateConversion(testDate: Date): void {
  console.log('=== 日時変換デバッグ ===');
  console.log(`元の日時: ${testDate.toString()}`);
  console.log(`ローカル文字列: ${testDate.toLocaleString('ja-JP')}`);
  console.log(`年: ${testDate.getFullYear()}`);
  console.log(`月: ${testDate.getMonth() + 1}`);
  console.log(`日: ${testDate.getDate()}`);
  console.log(`時: ${testDate.getHours()}`);
  console.log(`分: ${testDate.getMinutes()}`);
  
  const year = testDate.getFullYear();
  const month = String(testDate.getMonth() + 1).padStart(2, '0');
  const day = String(testDate.getDate()).padStart(2, '0');
  const hours = String(testDate.getHours()).padStart(2, '0');
  const minutes = String(testDate.getMinutes()).padStart(2, '0');
  const seconds = String(testDate.getSeconds()).padStart(2, '0');
  
  const formatted = `${year}${month}${day}T${hours}${minutes}${seconds}`;
  console.log(`フォーマット済み: ${formatted}`);
  console.log('========================');
}
