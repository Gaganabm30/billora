// client/src/pages/Support.jsx
import React, { useEffect, useState, useRef } from 'react';
import { apiRequest, useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { LifeBuoy, Plus, MessageSquare, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Support() {
  const { activeOrg } = useAuthStore();
  const { addToast } = useToastStore();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // New Ticket State
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/tickets');
      setTickets(res);
      
      // Keep selected ticket updated if open
      if (selectedTicket) {
        const updated = res.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [activeOrg]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.chatHistory]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return addToast('Please enter a title and details.', 'warning');
    try {
      const res = await apiRequest('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          priority: newPriority
        })
      });
      addToast('Support ticket raised successfully!', 'success');
      setNewTitle('');
      setNewDesc('');
      setNewPriority('MEDIUM');
      setShowCreate(false);
      loadTickets();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await apiRequest(`/api/tickets/${selectedTicket.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ text: chatMessage })
      });
      setSelectedTicket(res);
      setChatMessage('');
      
      // Reload tickets lists in background
      const list = await apiRequest('/api/tickets');
      setTickets(list);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      const res = await apiRequest(`/api/tickets/${ticketId}/resolve`, { method: 'POST' });
      setSelectedTicket(res);
      addToast('Ticket marked as resolved!', 'success');
      loadTickets();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-xl" />
        <div className="h-64 bg-brand-slate-200 dark:bg-brand-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      
      {selectedTicket ? (
        // Ticket Chat View
        <div className="flex flex-col h-full border border-brand-slate-200/50 dark:border-brand-slate-900 glass-card overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-brand-slate-200/40 dark:border-brand-slate-850 flex items-center justify-between bg-brand-slate-100/30 dark:bg-brand-navy-950/20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg hover:bg-brand-slate-200/50 dark:hover:bg-brand-slate-800/40"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xs font-bold truncate max-w-[200px] sm:max-w-md">{selectedTicket.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${
                    selectedTicket.priority === 'HIGH'
                      ? 'bg-red-500/10 text-red-500'
                      : selectedTicket.priority === 'MEDIUM'
                      ? 'bg-brand-cyan-500/10 text-brand-cyan-550 dark:text-brand-cyan-400'
                      : 'bg-brand-slate-200 dark:bg-brand-slate-800 text-brand-slate-500'
                  }`}>
                    {selectedTicket.priority} Priority
                  </span>
                  <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${
                    selectedTicket.status === 'OPEN'
                      ? 'bg-brand-emerald-500/10 text-brand-emerald-500'
                      : selectedTicket.status === 'IN_PROGRESS'
                      ? 'bg-brand-cyan-500/10 text-brand-cyan-550 dark:text-brand-cyan-400'
                      : 'bg-brand-slate-200 dark:bg-brand-slate-800 text-brand-slate-500'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
            </div>

            {selectedTicket.status !== 'RESOLVED' && (
              <button
                onClick={() => handleResolveTicket(selectedTicket.id)}
                className="px-3 py-1.5 bg-brand-emerald-500 hover:bg-brand-emerald-600 text-white rounded-lg text-[10px] font-bold"
              >
                Resolve Ticket
              </button>
            )}
          </div>

          {/* Chat History Messages */}
          <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
            {selectedTicket.chatHistory.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[75%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-brand-teal-500 text-white rounded-tr-none' 
                      : 'glass-panel border border-brand-slate-200/50 dark:border-brand-slate-850 text-brand-slate-800 dark:text-brand-slate-100 rounded-tl-none bg-white dark:bg-brand-navy-950'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-brand-slate-400 mt-1 px-1">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input form */}
          {selectedTicket.status !== 'RESOLVED' ? (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-brand-slate-200/40 dark:border-brand-slate-850 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your response..."
                className="px-4 text-xs h-10 rounded-xl border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 flex-grow text-brand-slate-800 dark:text-brand-slate-100"
              />
              <button
                type="submit"
                disabled={sendingMsg}
                className="w-10 h-10 bg-brand-teal-500 hover:bg-brand-teal-600 text-white flex items-center justify-center rounded-xl flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="p-4 text-center text-xs text-brand-slate-400 bg-brand-slate-100/50 dark:bg-brand-navy-950/20 border-t border-brand-slate-200/40 dark:border-brand-slate-850">
              This ticket has been marked as RESOLVED.
            </div>
          )}

        </div>
      ) : (
        // Tickets List View
        <div className="flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold font-outfit">Support Ticket Desk</h1>
              <p className="text-xs text-brand-slate-500">File issues or view chat response logs.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 h-9 bg-brand-slate-900 dark:bg-white text-white dark:text-brand-navy-950 font-bold text-xs rounded-xl flex items-center gap-1 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Ticket</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-4">
            {tickets.map((t) => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicket(t)}
                className="glass-panel p-5 rounded-2xl border border-brand-slate-200/50 dark:border-brand-slate-900 hover:border-brand-teal-500/30 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between min-h-[140px] group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                      t.priority === 'HIGH'
                        ? 'bg-red-500/10 text-red-500'
                        : t.priority === 'MEDIUM'
                        ? 'bg-brand-cyan-500/10 text-brand-cyan-500'
                        : 'bg-brand-slate-200 dark:bg-brand-slate-800 text-brand-slate-500'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-brand-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-brand-slate-800 dark:text-brand-slate-200 group-hover:text-brand-teal-500 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-[10px] text-brand-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4 border-t border-brand-slate-200/30 dark:border-brand-slate-850 pt-3">
                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${
                    t.status === 'OPEN'
                      ? 'bg-brand-emerald-500/10 text-brand-emerald-500'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-brand-cyan-500/10 text-brand-cyan-500'
                      : 'bg-brand-slate-200 dark:bg-brand-slate-800 text-brand-slate-500'
                  }`}>
                    {t.status}
                  </span>
                  
                  <span className="text-[10px] text-brand-teal-500 font-semibold flex items-center gap-0.5 group-hover:underline">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Conversation</span>
                  </span>
                </div>
              </div>
            ))}

            {tickets.length === 0 && (
              <div className="col-span-2 text-center py-12 border border-dashed border-brand-slate-200 dark:border-brand-slate-800 rounded-2xl text-xs text-brand-slate-400">
                <LifeBuoy className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <span>No support tickets filed yet.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raise Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-slate-950/70 backdrop-blur-xs dialog-overlay">
          <div className="glass-panel max-w-sm w-full rounded-2xl border border-brand-slate-200 dark:border-brand-slate-800 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit">Raise Support Case</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-brand-slate-200 dark:hover:bg-brand-slate-850 rounded-lg text-brand-slate-400">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Card renewal charge failed"
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Case Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-150"
                >
                  <option value="LOW">Low priority</option>
                  <option value="MEDIUM">Medium priority</option>
                  <option value="HIGH">High priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-brand-slate-400 uppercase tracking-wider mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Please describe your billing or technical issue..."
                  className="w-full p-3 text-xs rounded-lg border border-brand-slate-300 dark:border-brand-slate-800 bg-white dark:bg-brand-navy-950 focus:outline-none focus:border-brand-teal-500 text-brand-slate-850 dark:text-brand-slate-100 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-brand-teal-500 to-brand-cyan-500 text-white font-bold text-xs rounded-xl shadow-glow-teal hover:opacity-95 mt-2"
              >
                Raise Active Case
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
