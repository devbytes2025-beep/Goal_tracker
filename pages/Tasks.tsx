import React, { useState } from 'react';
import { useApp } from '../App';
import { backend, generateUUID } from '../services/mockBackend';
import { Card, Button, Input, Modal, Select, Badge, SparkleEffect, FireworksEffect, BoomEffect } from '../components/UI';
import { Plus, Check, Target, Zap, Edit2 } from 'lucide-react';
import { Task, TaskType, TaskLog } from '../types';
import { format, isFuture, isToday, subDays, parseISO } from 'date-fns';
import { playSound } from '../constants';

const Tasks: React.FC = () => {
  const { user, data, refreshData, updateUser, showToast } = useApp();
  const [isModalOpen, setModalOpen] = useState(false); // Used for both Create and Edit
  const [isMarkModalOpen, setMarkModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSparkle, setShowSparkle] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showBoom, setShowBoom] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    name: '', reason: '', type: TaskType.PERSONAL, category: 'habit', penalty: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: ''
  });

  const [markData, setMarkData] = useState({ remark: '', images: [] as string[] });

  const resetForm = () => {
      setTaskForm({
        name: '', reason: '', type: TaskType.PERSONAL, category: 'habit', penalty: '', startDate: format(new Date(), 'yyyy-MM-dd'), endDate: ''
      });
      setIsEditing(false);
      setSelectedTask(null);
  };

  const handleOpenCreate = () => {
      resetForm();
      setModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
      setTaskForm(task);
      setSelectedTask(task);
      setIsEditing(true);
      setModalOpen(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
        if (isEditing && selectedTask) {
            await backend.updateItem(user.id, 'tasks', {
                ...selectedTask,
                ...taskForm
            } as Task);
            showToast("Task updated!", 'success');
            playSound('success');
        } else {
            await backend.addItem(user.id, 'tasks', {
                ...taskForm,
                id: generateUUID(),
                userId: user.id,
                createdAt: new Date().toISOString()
            } as Task);
            showToast("New task created!", 'success');
            playSound('success');
        }
        await refreshData();
        setModalOpen(false);
        resetForm();
    } catch (e: any) { 
        console.error(e);
        showToast(e.message || "Failed to save task", 'error');
        playSound('error');
    }
  };

  const handleMarkClick = (task: Task) => {
      setSelectedTask(task);
      setMarkModalOpen(true);
      setMarkData({ remark: '', images: [] });
  };

  const handleMarkSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !selectedTask) return;
      
      try {
          const today = new Date();
          const logDate = format(today, 'yyyy-MM-dd');
          
          await backend.addItem(user.id, 'logs', {
              id: generateUUID(),
              taskId: selectedTask.id,
              date: logDate,
              remark: markData.remark,
              images: markData.images, 
              completed: true,
              timestamp: Date.now()
          } as TaskLog);

          // Update Points
          const pointsEarned = 10;
          const updatedUser = { ...user, points: (user.points || 0) + pointsEarned };
          await backend.updateUser(updatedUser);
          updateUser(updatedUser);

          await refreshData();
          setMarkModalOpen(false);
          showToast(`Completed! +${pointsEarned} Points`, 'success');
          playSound('success');
          
          // Trigger Random Animations for Variety
          const rand = Math.random();
          if (rand > 0.6) {
             setShowBoom(true);
             setTimeout(() => setShowBoom(false), 2000);
          } else {
             setShowSparkle(true);
             setTimeout(() => setShowSparkle(false), 2000);
          }

      } catch (e: any) { 
          console.error(e);
          showToast(e.message || "Failed to mark completion", 'error');
          playSound('error');
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
          Array.from(files).forEach(file => {
             const reader = new FileReader();
             reader.onloadend = () => {
                 if (reader.result) {
                     setMarkData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
                 }
             };
             reader.readAsDataURL(file as Blob);
          });
      }
  };

  const isDoneToday = (taskId: string) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return data.logs.some(l => l.taskId === taskId && l.date === today && l.completed);
  };

  return (
    <div className="space-y-6">
      <SparkleEffect active={showSparkle} />
      <FireworksEffect active={showFireworks} />
      <BoomEffect active={showBoom} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Tasks & Habits</h2>
        <Button onClick={handleOpenCreate}>
          <Plus size={18} /> New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.tasks.map(task => (
            <Card key={task.id} className="relative group hover:border-indigo-500/50 transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                        <Badge color={task.category === 'habit' ? 'bg-green-500/20 text-green-200' : 'bg-blue-500/20 text-blue-200'}>
                            {task.category.toUpperCase()}
                        </Badge>
                        <Badge>{task.type}</Badge>
                    </div>
                    <button onClick={() => handleOpenEdit(task)} className="text-gray-400 hover:text-white">
                        <Edit2 size={16} />
                    </button>
                </div>
                <h3 className="text-xl font-bold mb-1">{task.name}</h3>
                <p className="text-sm text-gray-400 mb-4 flex-1">{task.reason}</p>
                
                <div className="text-xs text-red-300 bg-red-500/10 p-2 rounded-lg mb-4">
                    Penalty: {task.penalty || 'None'}
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center mt-auto">
                    <div className="text-xs text-gray-500">Since: {format(parseISO(task.createdAt), 'MMM d')}</div>
                    {isDoneToday(task.id) ? (
                         <span className="text-green-400 flex items-center gap-1 text-sm font-bold">
                             <Check size={16} /> Done Today
                         </span>
                    ) : (
                        <Button 
                            className="py-1 px-3 text-sm" 
                            onClick={() => handleMarkClick(task)}
                        >
                            Mark Done (+10xp)
                        </Button>
                    )}
                </div>
            </Card>
        ))}
        {data.tasks.length === 0 && (
            <div className="col-span-full text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-gray-400 mb-2">No tasks found. Start your journey!</p>
                <Button onClick={handleOpenCreate} variant="ghost">Create Your First Habit</Button>
            </div>
        )}
      </div>

      {/* Task Modal (Create/Edit) */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={isEditing ? "Edit Task" : "Create New Task"}>
          <form onSubmit={handleSubmitTask} className="space-y-4">
              <Input placeholder="Task Name" value={taskForm.name} onChange={e => setTaskForm({...taskForm, name: e.target.value})} required />
              <Input placeholder="Why do you want this?" value={taskForm.reason} onChange={e => setTaskForm({...taskForm, reason: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <Select value={taskForm.category} onChange={e => setTaskForm({...taskForm, category: e.target.value as any})}>
                    <option value="habit">Habit</option>
                    <option value="goal">Goal</option>
                </Select>
                <Select value={taskForm.type} onChange={e => setTaskForm({...taskForm, type: e.target.value as any})}>
                    {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <Input placeholder="Penalty if missed" value={taskForm.penalty} onChange={e => setTaskForm({...taskForm, penalty: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" value={taskForm.startDate} onChange={e => setTaskForm({...taskForm, startDate: e.target.value})} required />
                <Input type="date" value={taskForm.endDate} onChange={e => setTaskForm({...taskForm, endDate: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">{isEditing ? "Update Task" : "Create Task"}</Button>
          </form>
      </Modal>

      {/* Mark Done Modal */}
      <Modal isOpen={isMarkModalOpen} onClose={() => setMarkModalOpen(false)} title={`Mark "${selectedTask?.name}" Done`}>
          <form onSubmit={handleMarkSubmit} className="space-y-4">
              <textarea 
                 className="w-full glass-input px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
                 placeholder="How did it go? (Remark)"
                 value={markData.remark}
                 onChange={e => setMarkData({...markData, remark: e.target.value})}
                 required
              />
              <div>
                  <label className="block text-sm text-gray-400 mb-2">Proof Images (Optional, Select Multiple)</label>
                  <Input type="file" accept="image/*" multiple onChange={handleImageUpload} />
              </div>
              {markData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                      {markData.images.map((img, idx) => (
                           <img key={idx} src={img} alt="Preview" className="w-full h-20 object-cover rounded-lg" />
                      ))}
                  </div>
              )}
              <Button type="submit" className="w-full">Confirm Completion (+10 Points)</Button>
          </form>
      </Modal>
    </div>
  );
};

export default Tasks;