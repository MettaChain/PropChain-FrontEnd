"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Distribution } from "../RentalIncomeDistribution";

interface DistributionCalendarProps {
  distributions: Distribution[];
}

const DistributionCalendar = ({ distributions }: DistributionCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const distributionsByDate = useMemo(() => {
    const map = new Map<string, Distribution[]>();
    distributions.forEach((dist) => {
      const dateStr = dist.timestamp.toISOString().split("T")[0];
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(dist);
    });
    return map;
  }, [distributions]);

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const days = Array.from({ length: daysInMonth(currentDate) }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth(currentDate) });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution Calendar</CardTitle>
        <CardDescription>View distributions by date</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-lg">{monthName}</h3>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayDistributions = distributionsByDate.get(dateStr) || [];
              const totalAmount = dayDistributions.reduce((sum, d) => sum + d.amount, 0);

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border p-2 text-xs flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    dayDistributions.length > 0
                      ? "bg-primary/10 border-primary hover:bg-primary/20"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  title={dayDistributions.length > 0 ? `$${totalAmount.toLocaleString()}` : ""}
                >
                  <div className="font-semibold">{day}</div>
                  {dayDistributions.length > 0 && (
                    <div className="text-xs font-bold text-primary mt-1">
                      {dayDistributions.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-sm font-semibold">Legend</p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-primary/10 border border-primary" />
              <span>Has distributions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DistributionCalendar;
