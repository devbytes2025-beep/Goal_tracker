import React, { useState } from 'react';
import { useApp } from '../App';
import { backend } from '../services/mockBackend';
import { Card, Button, Input } from '../components/UI';
import { Todo } from '../types';
import { Trash2, Square, CheckSquare, Edit2 } from 'lucide-react';
import { playSound } from '../constants';

const Todos: React.FC = () => {
  const { user, data, refreshData } = useApp();
  const [todoInput, setTodoInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !todoInput) return;

    try {
        if (editingId) {
             const existingTodo = data.todos.find(t => t.id === editingId);
             if (existingTodo) {
                 await backend.updateItem(user.id, 'todos', {
                     ...existingTodo,
                     text: todoInput,
                     dueDate: dueDate || existingTodo.dueDate
                 });
             }
             setEditingId(null);
        } else {
            await backend.addItem(user.id, 'todos', {
              id: crypto.randomUUID(),
              userId: user.id,
              text: todoInput,
              dueDate: dueDate || new Date().toISOString().split('T')[0],
              completed: false
            } as Todo);
        }
        playSound('success');
        setTodoInput('');
        setDueDate('');
        refreshData();
    } catch (e) { console.error(e); }
  };

  const startEdit = (todo: Todo) => {
      setTodoInput(todo.text);
      setDueDate(todo.dueDate);
      setEditingId(todo.id);
  };

  const toggleTodo = async (todo: Todo) => {
    if (!user) return;
    await backend.updateItem(user.id, 'todos', { ...todo, completed: !todo.completed });
    playSound('click');
    refreshData();
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    await backend.deleteItem(user.id, 'todos', id);
    refreshData();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <h2 className="text-2xl font-bold mb-4">{editingId ? "Edit Task" : "To-Do List"}</h2>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <Input 
             className="flex-1"
             placeholder="What needs to be done?" 
             value={todoInput} 
             onChange={e => setTodoInput(e.target.value)} 
          />
          <Input 
             type="date" 
             className="w-40"
             value={dueDate}
             onChange={e => setDueDate(e.target.value)}
          />
          <Button type="submit">{editingId ? "Update" : "Add"}</Button>
          {editingId && <Button type="button" variant="ghost" onClick={() => {setEditingId(null); setTodoInput(''); setDueDate('');}}>Cancel</Button>}
        </form>
      </Card>

      <div className="space-y-2">
        {data.todos.map(todo => (
          <div 
             key={todo.id} 
             className={`glass-panel p-4 rounded-xl flex items-center justify-between transition-all ${todo.completed ? 'opacity-50' : ''}`}
          >
             <div className="flex items-center gap-4">
               <button onClick={() => toggleTodo(todo)} className="text-indigo-400 hover:text-indigo-300">
                 {todo.completed ? <CheckSquare size={24} /> : <Square size={24} />}
               </button>
               <div>
                  <p className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-white'}`}>{todo.text}</p>
                  <p className="text-xs text-gray-500">Due: {todo.dueDate}</p>
               </div>
             </div>
             <div className="flex items-center gap-2">
                 <button onClick={() => startEdit(todo)} className="text-gray-400 hover:text-white p-2">
                     <Edit2 size={18} />
                 </button>
                 <button onClick={() => deleteTodo(todo.id)} className="text-gray-600 hover:text-red-400 p-2">
                   <Trash2 size={18} />
                 </button>
             </div>
          </div>
        ))}
        {data.todos.length === 0 && <p className="text-center text-gray-500 mt-8">Nothing to do yet. Relax!</p>}
      </div>
    </div>
  );
};

export default Todos;
