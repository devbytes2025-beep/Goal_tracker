import React, { useState } from 'react';
import { useApp } from '../App';
import { Card, Button, Modal } from '../components/UI';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isFuture, isToday, subDays, addMonths, subMonths, getDay, isAfter, isBefore, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { playSound } from '../constants';

const CalendarPage: React.FC = () => {
  const { data } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getDayStats = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Completed count: Number of logs for habits/goals on this day
      const completedLogs = data.logs.filter(l => l.date === dateStr && l.completed);
      const completedCount = completedLogs.length;

      // Active Habits/Goals count for this day
      // A task is active if:
      // 1. It is a 'habit' OR 'goal'
      // 2. createdAt <= date
      // 3. startDate <= date
      // 4. (endDate >= date OR no endDate)
      
      const activeTasks = data.tasks.filter(t => {
          // Include both habits and goals
          if (t.category !== 'habit' && t.category !== 'goal') return false;
          
          const start = parseISO(t.startDate);
          const end = t.endDate ? parseISO(t.endDate) : null;
          
          if (isAfter(start, date)) return false; // Started after this date
          if (end && isBefore(end, date)) return false; // Ended before this date
          
          return true;
      });

      const totalCount = activeTasks.length;
      
      return { completedCount, totalCount, logs: completedLogs };
  };

  const isDateLocked = (date: Date) => {
    if (isFuture(date) && !isToday(date)) return true;
    return false;
  };
  
  const handleDateClick = (date: Date) => {
      if (isFuture(date) && !isToday(date)) {
          alert("Future days are locked!");
          playSound('error');
          return;
      }
      setSelectedDate(date);
      playSound('click');
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
           <h2 className="text-3xl font-bold text-white">Calendar</h2>
           <div className="flex items-center gap-4">
               <Button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} variant="ghost"><ChevronLeft /></Button>
               <span className="text-xl font-medium min-w-[150px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
               <Button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} variant="ghost"><ChevronRight /></Button>
           </div>
       </div>

       <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-7 bg-white/5 border-b border-white/10">
              {weekDays.map(d => (
                  <div key={d} className="p-4 text-center font-bold text-gray-400">{d}</div>
              ))}
          </div>
          <div className="grid grid-cols-7">
              {/* Padding for start of month */}
              {Array.from({ length: getDay(daysInMonth[0]) }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[120px] bg-black/20 border border-white/5"></div>
              ))}
              
              {daysInMonth.map(date => {
                  const { completedCount, totalCount } = getDayStats(date);
                  const locked = isFuture(date) && !isToday(date);
                  
                  // Color coding based on completion
                  let statusColor = "text-gray-400";
                  if (totalCount > 0) {
                      const ratio = completedCount / totalCount;
                      if (ratio === 1) statusColor = "text-green-400";
                      else if (ratio > 0.5) statusColor = "text-yellow-400";
                      else if (ratio > 0) statusColor = "text-orange-400";
                  }
                  
                  return (
                      <div 
                        key={date.toString()} 
                        onClick={() => handleDateClick(date)}
                        className={`
                            min-h-[120px] p-2 border border-white/5 relative transition-colors cursor-pointer group flex flex-col justify-between
                            ${isToday(date) ? 'bg-indigo-900/30' : 'hover:bg-white/5'}
                            ${locked ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                          <div className="flex justify-between items-start">
                              <span className={`text-sm font-medium ${isToday(date) ? 'text-indigo-400' : 'text-gray-400'}`}>
                                  {format(date, 'd')}
                              </span>
                              {locked && <Lock size={12} className="text-gray-600" />}
                          </div>
                          
                          {!locked && totalCount > 0 && (
                              <div className="self-end mt-2">
                                  <span className={`text-xl font-bold ${statusColor}`}>
                                      {completedCount}/{totalCount}
                                  </span>
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
       </Card>
       
       {selectedDate && (
           <Card>
               <h3 className="text-xl font-bold mb-4">Summary for {format(selectedDate, 'MMM do, yyyy')}</h3>
               <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                       <h4 className="font-bold text-green-400 mb-2">Completed</h4>
                       <ul className="list-disc list-inside text-sm text-gray-300">
                           {getDayStats(selectedDate).logs.map((l, i) => {
                               const task = data.tasks.find(t => t.id === l.taskId);
                               const taskName = task?.name || 'Unknown Task';
                               return <li key={i}>{taskName} <span className="text-xs text-gray-500">({task?.category})</span></li>;
                           })}
                           {getDayStats(selectedDate).logs.length === 0 && <li>No tasks completed.</li>}
                       </ul>
                   </div>
                   <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <h4 className="font-bold text-red-400 mb-2">Completion Rate</h4>
                        <p className="text-2xl font-bold">
                            {(() => {
                                const { completedCount, totalCount } = getDayStats(selectedDate);
                                return totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : 'N/A';
                            })()}
                        </p>
                   </div>
               </div>
           </Card>
       )}
    </div>
  );
};

export default CalendarPage;
