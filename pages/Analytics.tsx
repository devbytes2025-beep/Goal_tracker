import React, { useMemo } from 'react';
import { useApp } from '../App';
import { Card, Button } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TaskType } from '../types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, isWithinInterval, parseISO } from 'date-fns';

const Analytics: React.FC = () => {
  const { data, user } = useApp();

  // --- Reports Logic ---

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  const getStatsForPeriod = (start: Date, end: Date) => {
      // Filter logs within period
      const logsInPeriod = data.logs.filter(l => {
          const d = parseISO(l.date);
          return isWithinInterval(d, { start, end });
      });

      const totalCompleted = logsInPeriod.length;
      
      // Calculate active habits potential (approximate)
      const days = eachDayOfInterval({ start, end });
      let totalPotential = 0;
      
      data.tasks.filter(t => t.category === 'habit').forEach(t => {
         // Simply assume active for whole period for simplicity in this view
         // In real app, calculate overlap of task duration with period
         totalPotential += days.length; 
      });

      const completionRate = totalPotential > 0 ? Math.round((totalCompleted / totalPotential) * 100) : 0;
      
      const expensesInPeriod = data.expenses
          .filter(e => isWithinInterval(parseISO(e.date), { start, end }))
          .reduce((sum, e) => sum + Number(e.amount), 0);
          
      return { totalCompleted, completionRate, expensesInPeriod };
  };

  const weeklyStats = getStatsForPeriod(currentWeekStart, currentWeekEnd);
  const monthlyStats = getStatsForPeriod(currentMonthStart, currentMonthEnd);

  // --- Charts Logic ---

  // Prepare data for Task Completion per Type (Pie)
  const typeCounts = data.tasks.reduce((acc, task) => {
      const logs = data.logs.filter(l => l.taskId === task.id).length;
      acc[task.type] = (acc[task.type] || 0) + logs;
      return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(typeCounts).map(key => ({ name: key, value: typeCounts[key] }));
  const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981'];

  // Prepare data for Daily Activity (Bar)
  // Simplified: Last 7 days
  const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
  });

  const activityData = last7Days.map(date => ({
      date: date.slice(5), // MM-DD
      completed: data.logs.filter(l => l.date === date && l.completed).length,
      expenses: data.expenses.filter(e => e.date === date).reduce((sum, e) => sum + Number(e.amount), 0)
  }));

  const handleExport = () => {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'glasshabit_analytics.json';
      link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Analytics & Reports</h2>
          <Button onClick={handleExport} variant="ghost">Export Report (JSON)</Button>
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border-indigo-500/30">
              <h3 className="text-xl font-bold mb-4 flex justify-between">
                  <span>Weekly Summary</span>
                  <span className="text-sm font-normal text-indigo-300">
                      {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d')}
                  </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                      <p className="text-sm text-gray-400">Habits Done</p>
                      <p className="text-2xl font-bold">{weeklyStats.totalCompleted}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                      <p className="text-sm text-gray-400">Completion Rate</p>
                      <p className="text-2xl font-bold text-green-400">{weeklyStats.completionRate}%</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl col-span-2">
                      <p className="text-sm text-gray-400">Total Spent</p>
                      <p className="text-2xl font-bold text-red-300">₹{weeklyStats.expensesInPeriod.toFixed(2)}</p>
                  </div>
              </div>
          </Card>

          <Card className="bg-gradient-to-br from-pink-900/40 to-rose-900/40 border-pink-500/30">
              <h3 className="text-xl font-bold mb-4 flex justify-between">
                  <span>Monthly Summary</span>
                  <span className="text-sm font-normal text-pink-300">
                      {format(currentMonthStart, 'MMMM yyyy')}
                  </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                      <p className="text-sm text-gray-400">Habits Done</p>
                      <p className="text-2xl font-bold">{monthlyStats.totalCompleted}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                      <p className="text-sm text-gray-400">Completion Rate</p>
                      <p className="text-2xl font-bold text-green-400">{monthlyStats.completionRate}%</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl col-span-2">
                      <p className="text-sm text-gray-400">Total Spent</p>
                      <p className="text-2xl font-bold text-red-300">₹{monthlyStats.expensesInPeriod.toFixed(2)}</p>
                  </div>
              </div>
          </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
              <h3 className="mb-4 font-bold">Habit Consistency (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                        <XAxis dataKey="date" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4c1d95', color: '#fff' }} />
                        <Bar dataKey="completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </Card>

          <Card>
              <h3 className="mb-4 font-bold">Focus Areas (Distribution)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
              </div>
          </Card>

          <Card className="md:col-span-2">
              <h3 className="mb-4 font-bold">Spending Trend (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                        <XAxis dataKey="date" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4c1d95' }} />
                        <Line type="monotone" dataKey="expenses" stroke="#ec4899" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
          </Card>
      </div>
    </div>
  );
};

export default Analytics;
