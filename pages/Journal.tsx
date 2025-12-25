import React, { useState } from 'react';
import { useApp } from '../App';
import { backend, generateUUID } from '../services/mockBackend';
import { Card, Button, Input, FireworksEffect, SparkleEffect, BoomEffect } from '../components/UI';
import { JournalEntry } from '../types';
import { format } from 'date-fns';
import { Search, Edit2, Trash2, Calendar } from 'lucide-react';
import { playSound } from '../constants';

const MOODS = ['😊', '😐', '😔', '😡', '🥳', '😴', '🤯', '😭', '😎', '🤢', '🤔', '😍'];

const Journal: React.FC = () => {
  const { user, data, refreshData, showToast } = useApp();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('😊');
  const [images, setImages] = useState<string[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Animations
  const [showFireworks, setShowFireworks] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const [showBoom, setShowBoom] = useState(false);

  const handleSave = async () => {
    if (!user || !content || !subject) {
        showToast("Please fill in subject and content", 'error');
        return;
    }
    try {
        if (editingId) {
             const existing = data.journal.find(j => j.id === editingId);
             if (existing) {
                 await backend.updateItem(user.id, 'journal', {
                     ...existing,
                     subject,
                     content,
                     mood,
                     images
                 });
             }
             setEditingId(null);
             
             // Update Animation
             setShowSparkle(true);
             setTimeout(() => setShowSparkle(false), 2000);
             showToast("Memory updated!", 'success');
        } else {
             await backend.addItem(user.id, 'journal', {
              id: generateUUID(),
              userId: user.id,
              subject,
              content,
              mood,
              images, // array
              date: format(new Date(), 'yyyy-MM-dd'),
              timestamp: Date.now()
            } as JournalEntry);
            
            // New Entry Animations
            setShowBoom(true);
            setTimeout(() => setShowBoom(false), 1000);
            setTimeout(() => {
                setShowFireworks(true);
                setTimeout(() => setShowFireworks(false), 2000);
            }, 500);
            showToast("Memory saved successfully!", 'success');
        }

        playSound('success');
        setSubject('');
        setContent('');
        setMood('😊');
        setImages([]);
        refreshData();
    } catch (e: any) { 
        console.error(e);
        showToast(e.message || "Failed to save journal", 'error');
        playSound('error');
    }
  };

  const handleEdit = (entry: JournalEntry) => {
      setSubject(entry.subject || '');
      setContent(entry.content);
      setMood(entry.mood);
      setImages(entry.images || []);
      setEditingId(entry.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
      if (!user) return;
      if (!window.confirm("Are you sure you want to delete this memory?")) return;
      try {
          await backend.deleteItem(user.id, 'journal', id);
          playSound('delete');
          showToast("Entry deleted", 'info');
          refreshData();
      } catch (e) { console.error(e); showToast("Failed to delete", 'error'); }
  };

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
           Array.from(files).forEach(file => {
             const reader = new FileReader();
             reader.onloadend = () => {
                 if (reader.result) {
                     setImages(prev => [...prev, reader.result as string]);
                 }
             };
             reader.readAsDataURL(file as Blob);
          });
      }
  };

  const filteredEntries = data.journal.filter(j => {
      const textMatch = j.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (j.subject && j.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDate = filterMonth ? j.date.startsWith(filterMonth) : true;
      return textMatch && matchesDate;
  });

  return (
    <div className="space-y-12 relative">
      <FireworksEffect active={showFireworks} />
      <SparkleEffect active={showSparkle} />
      <BoomEffect active={showBoom} />
      
      {/* Editor Section - Full Width */}
      <div className="w-full">
        <Card className="bg-gradient-to-br from-indigo-900/30 to-violet-900/30 border-indigo-500/20">
           <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold flex items-center gap-2">
                   <Edit2 size={24} className="text-indigo-400"/> 
                   {editingId ? "Edit Memory" : "Write Today's Story"}
               </h2>
               <div className="text-sm text-gray-400 flex items-center gap-2">
                   <Calendar size={16} />
                   {format(new Date(), 'MMMM do, yyyy')}
               </div>
           </div>

           <div className="space-y-4">
               <div className="flex flex-col md:flex-row gap-4">
                   <div className="flex-1">
                       <label className="text-sm text-gray-400 mb-1 block">Subject</label>
                       <Input 
                           placeholder="Title of your day..." 
                           value={subject}
                           onChange={e => setSubject(e.target.value)}
                           className="font-bold text-lg"
                       />
                   </div>
                   <div>
                       <label className="text-sm text-gray-400 mb-1 block">Mood</label>
                       <div className="glass-input rounded-xl p-2 flex gap-2 overflow-x-auto max-w-[300px] scrollbar-hide">
                           {MOODS.map(m => (
                             <button 
                               key={m} 
                               onClick={() => setMood(m)}
                               className={`text-2xl p-1.5 rounded-lg transition-all hover:bg-white/10 ${mood === m ? 'bg-indigo-500/30 scale-110 shadow-lg' : 'opacity-70'}`}
                             >
                               {m}
                             </button>
                           ))}
                       </div>
                   </div>
               </div>

               <div>
                   <label className="text-sm text-gray-400 mb-1 block">Content</label>
                   <textarea 
                     className="w-full h-64 glass-input p-6 rounded-xl resize-y text-white leading-relaxed text-lg focus:ring-2 focus:ring-indigo-500/50" 
                     placeholder="Dear Journal, today was..."
                     value={content}
                     onChange={e => setContent(e.target.value)}
                   ></textarea>
               </div>
               
               <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                   <div className="flex-1">
                        <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="text-sm" />
                   </div>
                   <div className="flex gap-2">
                       {editingId && <Button onClick={() => {setEditingId(null); setSubject(''); setContent(''); setImages([]);}} variant="ghost">Cancel</Button>}
                       <Button onClick={handleSave} className="px-8">{editingId ? "Update Entry" : "Save Entry"}</Button>
                   </div>
               </div>

               {images.length > 0 && (
                   <div className="flex gap-4 overflow-x-auto pb-2">
                       {images.map((img, idx) => (
                           <div key={idx} className="relative group shrink-0">
                               <img src={img} className="h-24 w-24 object-cover rounded-lg border border-white/10" alt="preview" />
                               <button 
                                   onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                   className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                   <Trash2 size={12} />
                               </button>
                           </div>
                       ))}
                   </div>
               )}
           </div>
        </Card>
      </div>

      {/* List Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-gray-300">Previous Entries</h3>
            <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <Input 
                        placeholder="Search subjects or content..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Input 
                    type="month" 
                    className="w-40" 
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
           {filteredEntries.map(entry => (
               <Card key={entry.id} className="relative group hover:bg-white/5 transition-all flex flex-col h-full border-t-4 border-t-indigo-500/50">
                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                       <button 
                            onClick={() => handleEdit(entry)} 
                            className="bg-black/50 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors"
                            title="Edit"
                       >
                           <Edit2 size={16} />
                       </button>
                       <button 
                            onClick={() => handleDelete(entry.id)} 
                            className="bg-black/50 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                            title="Delete"
                       >
                           <Trash2 size={16} />
                       </button>
                   </div>
                   
                   <div className="flex items-start gap-4 mb-4">
                       <div className="text-5xl bg-white/5 p-3 rounded-2xl shadow-inner">{entry.mood}</div>
                       <div className="flex-1 min-w-0">
                           <h4 className="text-xl font-bold truncate text-white">{entry.subject || "Untitled Entry"}</h4>
                           <span className="text-xs text-indigo-300 font-mono">{entry.date}</span>
                       </div>
                   </div>

                   <div className="flex-1 mb-4">
                       <p className="text-gray-300 whitespace-pre-wrap line-clamp-4 leading-relaxed">{entry.content}</p>
                   </div>

                   {entry.images && entry.images.length > 0 && (
                       <div className="grid grid-cols-4 gap-2 mt-auto pt-4 border-t border-white/5">
                           {entry.images.slice(0, 4).map((img, i) => (
                               <img key={i} src={img} alt="Memory" className="rounded-lg h-16 w-full object-cover border border-white/5" />
                           ))}
                           {entry.images.length > 4 && (
                               <div className="flex items-center justify-center bg-white/10 rounded-lg text-xs text-gray-400">
                                   +{entry.images.length - 4}
                               </div>
                           )}
                       </div>
                   )}
               </Card>
           ))}
           {filteredEntries.length === 0 && (
               <div className="col-span-full text-center py-12 text-gray-500 bg-white/5 rounded-3xl border border-dashed border-white/10">
                   <p className="text-lg">No entries found matching your search.</p>
                   <p className="text-sm">Start writing your story above!</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Journal;