import * as React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "日時を選択",
  disabled = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [selectedHour, setSelectedHour] = React.useState<string>(
    date ? date.getHours().toString().padStart(2, "0") : "09"
  );
  const [selectedMinute, setSelectedMinute] = React.useState<string>(() => {
    if (!date) return "00";
    const minutes = Math.floor(date.getMinutes() / 5) * 5;
    return minutes === 0 ? "00" : minutes.toString().padStart(2, "0");
  });

  React.useEffect(() => {
    if (selectedDate && selectedHour && selectedMinute) {
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(selectedHour));
      newDate.setMinutes(parseInt(selectedMinute));
      onDateChange(newDate);
    }
  }, [selectedDate, selectedHour, selectedMinute, onDateChange]);

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setSelectedHour(date.getHours().toString().padStart(2, "0"));
      const minutes = Math.floor(date.getMinutes() / 5) * 5;
      setSelectedMinute(minutes === 0 ? "00" : minutes.toString().padStart(2, "0"));
    }
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const adjustedDate = new Date(newDate);
      adjustedDate.setHours(parseInt(selectedHour));
      adjustedDate.setMinutes(parseInt(selectedMinute));
      setSelectedDate(adjustedDate);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    if (type === "hour") {
      setSelectedHour(value);
    } else {
      setSelectedMinute(value);
    }
  };

  // 5分刻みの分オプションを生成
  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minute = i * 5;
    return {
      value: minute.toString().padStart(2, "0"),
      label: minute.toString().padStart(2, "0")
    };
  });

  // 時間オプションを生成（9:00-21:00）
  const hourOptions = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 9;
    return {
      value: hour.toString().padStart(2, "0"),
      label: hour.toString().padStart(2, "0")
    };
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "yyyy年MM月dd日 HH:mm", { locale: ja })
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">日付を選択</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              locale={ja}
              className="rounded-md border"
            />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">時間を選択</h3>
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedHour} onValueChange={(value) => handleTimeChange("hour", value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}時
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-lg">:</span>
              <Select value={selectedMinute} onValueChange={(value) => handleTimeChange("minute", value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}分
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
