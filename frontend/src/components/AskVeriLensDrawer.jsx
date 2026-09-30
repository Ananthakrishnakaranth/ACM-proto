import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Bot, 
  User, 
  ArrowRight,
  ShieldQuestion,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

export default function AskVeriLensDrawer({ 
  isOpen, 
  onClose, 
  reportContext, 
  apiKey 
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your **VeriLens Forensic Reasoning Assistant**.\n\nI have the complete Trust Report loaded in context. You can ask me why specific optical or metadata anomalies were flagged, how digital manipulation artifacts arise, or what practical steps to take next.`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const quickQuestions = [
    "Why was the corneal catchlight flagged as suspicious?",
    "Could this simply be heavy compression or downscaling?",
    "How does the hand occlusion test expose real-time deepfakes?",
    "What specific generator or software might have created this?"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_context: reportContext || {},
          user_query: text,
          chat_history: messages.slice(-4),
          api_key: apiKey || null
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'Analysis complete.' }
      ]);
    } catch (err) {
      // Graceful fallback response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `**VeriLens Reasoning Note:**\n\nRegarding *"${text}"*:\n\nOur analysis prioritizes **evidence over verdicts**. In synthetic media, generators synthesize pixels without calculating true 3D optical ray-tracing or physical sensor noise. We recommend inspecting the high-magnification ocular reflections and checking C2PA metadata manifests. (Connect your Gemini API key in the top bar for deeper live multimodal reasoning).`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg h-full bg-[#0D131F] border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-sky-500 rounded-xl text-white shadow-md shadow-cyan-900/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-sm text-white">Ask VeriLens</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Gemini Reasoning
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Contextual Trust Report Q&A</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/60 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] font-medium text-slate-300 bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700/60 rounded-full px-2.5 py-1 whitespace-nowrap transition shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-cyan-400 border border-slate-700'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-700/90 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line prose-invert prose-xs">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-cyan-400 text-xs p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Gemini is synthesizing forensic evidence...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask about lighting, EXIF, or next verification steps..."
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl disabled:opacity-40 transition shadow-md shadow-cyan-900/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
