import React, { useState } from 'react';
import { useApp } from '../App';
import { Card, Modal, Select, Input } from '../components/UI';
import { TaskLog } from '../types';

const ProofWall: React.FC = () => {
  const { data } = useApp();
  const [selectedLog, setSelectedLog] = useState<TaskLog | null>(null);
  const [filterTask, setFilterTask] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const logsWithImages = data.logs.filter(l => {
      // Check legacy `image` prop or new `images` prop
      const hasImages = (l.images && l.images.length > 0) || (l as any).image;
      if (!hasImages) return false;

      const matchesTask = filterTask === 'all' || l.taskId === filterTask;
      const matchesMonth = filterMonth ? l.date.startsWith(filterMonth) : true;
      const matchesDate = filterDate ? l.date === filterDate : true;

      return matchesTask && matchesMonth && matchesDate;
  });

  const getTaskName = (id: string) => data.tasks.find(t => t.id === id)?.name || 'Unknown';

  const getLogImages = (log: TaskLog): string[] => {
      if (log.images && log.images.length > 0) return log.images;
      if ((log as any).image) return [(log as any).image];
      return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-3xl font-bold">Proof Wall</h2>
        <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
           <Select value={filterTask} onChange={e => setFilterTask(e.target.value)} className="min-w-[150px]">
               <option value="all">All Habits</option>
               {data.tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
           </Select>
           <Input 
              type="month" 
              value={filterMonth} 
              onChange={e => { setFilterMonth(e.target.value); setFilterDate(''); }}
              className="w-full md:w-auto"
           />
           <Input 
              type="date"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setFilterMonth(''); }}
              className="w-full md:w-auto"
           />
        </div>
      </div>

      <div className="columns-1 md:columns-3 lg:columns-4 gap-4 space-y-4">
         {logsWithImages.map(log => {
             const images = getLogImages(log);
             return (
                 <div 
                   key={log.id} 
                   onClick={() => setSelectedLog(log)}
                   className="break-inside-avoid glass-panel rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                 >
                     <div className="relative">
                         <img src={images[0]} alt="Proof" className="w-full object-cover" />
                         {images.length > 1 && (
                             <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                 +{images.length - 1}
                             </div>
                         )}
                     </div>
                     <div className="p-3">
                         <p className="font-bold text-sm truncate">{getTaskName(log.taskId)}</p>
                         <p className="text-xs text-gray-400">{log.date}</p>
                         {log.remark && <p className="text-xs text-gray-300 mt-1 line-clamp-2">"{log.remark}"</p>}
                     </div>
                 </div>
             );
         })}
      </div>
      {logsWithImages.length === 0 && <p className="text-center text-gray-500">No photo proofs matching criteria.</p>}

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Proof Detail">
          {selectedLog && (
              <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                       {getLogImages(selectedLog).map((img, idx) => (
                           <img key={idx} src={img} alt="Full Proof" className="w-full rounded-xl" />
                       ))}
                  </div>
                  <div>
                      <h4 className="font-bold text-lg">{getTaskName(selectedLog.taskId)}</h4>
                      <p className="text-gray-400 text-sm">{selectedLog.date}</p>
                  </div>
                  <p className="bg-white/5 p-4 rounded-xl italic">"{selectedLog.remark}"</p>
              </div>
          )}
      </Modal>
    </div>
  );
};

export default ProofWall;
