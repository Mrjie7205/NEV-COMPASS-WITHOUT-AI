
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Loader2, Calculator } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage, CarModel } from '../types';
import { CAR_DATABASE } from '../constants';
import ReactMarkdown from 'react-markdown';
import CarCard from './CarCard';

const Advisor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: '你好！我是你的新能源购车顾问。无论你有预算方面的疑问，还是想对比不同车型，我都可以帮你。\n\n比如你可以问我：\n- "25万左右推荐什么纯电轿车？"\n- "理想L6和问界M7哪个更适合家用？"\n- "什么是增程式电动车？"',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const streamResult = await sendMessageToGemini(userMessage.text);
      
      // Create a placeholder for the model response
      const modelMessageId = Date.now() + 1;
      setMessages(prev => [...prev, { role: 'model', text: '', timestamp: modelMessageId }]);

      let fullText = '';
      
      for await (const chunk of streamResult) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => prev.map(msg => 
            msg.timestamp === modelMessageId 
              ? { ...msg, text: fullText } 
              : msg
          ));
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: '抱歉，我遇到了一些连接问题，请稍后再试。',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to calculate landing price (reused logic)
  const calculateLandingPrice = (priceWan: number) => {
      const price = priceWan * 10000;
      const priceWithoutTax = price / 1.13;
      const potentialTax = priceWithoutTax * 0.1;
      const actualTax = potentialTax > 30000 ? potentialTax - 30000 : 0;
      const insurance = 4500 + (price * 0.012); 
      const registration = 500;
      const total = price + actualTax + insurance + registration;
      
      return (total / 10000).toFixed(2);
  };

  const renderMessageContent = (msg: ChatMessage, isLast: boolean) => {
    // 1. User Message: Simple Text Bubble
    if (msg.role === 'user') {
        return (
            <div className="bg-white text-slate-800 rounded-2xl rounded-tr-none border border-slate-100 p-3 shadow-sm text-sm">
                {msg.text}
            </div>
        );
    }

    // 2. Model Message
    // Try to parse as JSON first
    try {
        // Clean potential markdown code blocks
        const cleanText = msg.text.replace(/```json|```/g, '').trim();
        // Only attempt parse if it looks like JSON start/end
        if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
            const data = JSON.parse(cleanText);
            
            if (data.recommendations && Array.isArray(data.recommendations)) {
                return (
                    <div className="w-full max-w-2xl">
                         {/* Analysis Text Bubble */}
                         <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100 p-4 shadow-sm text-sm mb-4">
                            <Sparkles className="inline-block w-4 h-4 text-yellow-500 mr-1 mb-0.5" />
                            <span className="font-bold text-slate-700">AI 分析：</span>
                            {data.analysis}
                         </div>

                         {/* Car Cards Grid */}
                         <div className="grid grid-cols-1 gap-4">
                            {data.recommendations.map((rec: any, idx: number) => {
                                const car = CAR_DATABASE.find(c => c.id === rec.id);
                                if (!car) return null;
                                
                                const lp = calculateLandingPrice(car.priceRange[0]);

                                return (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row gap-4">
                                        <div className="sm:w-1/3">
                                             {/* Simplified Car Card View */}
                                            <div className="relative h-24 sm:h-full rounded-lg overflow-hidden group">
                                                <img src={car.imageUrl} alt={car.name} className="w-full h-full object-cover" />
                                                <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                    {car.type}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800">{car.name}</h4>
                                                        <p className="text-xs text-slate-500">{car.brand} | {car.power}</p>
                                                    </div>
                                                    <span className="text-cyan-700 font-bold text-sm">{car.priceRange[0]}-{car.priceRange[1]}万</span>
                                                </div>
                                                
                                                <div className="mt-2 bg-slate-50 p-2 rounded text-xs text-slate-600">
                                                    <span className="font-bold text-cyan-600 mr-1">推荐理由:</span>
                                                    {rec.reason}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                                                 <div className="flex gap-2 text-slate-500">
                                                     <span>续航 {car.range}km</span>
                                                     <span>零百 {car.acceleration}s</span>
                                                 </div>
                                                 <div className="flex items-center text-slate-400">
                                                     <Calculator size={10} className="mr-1" />
                                                     <span>落地约 {lp}万</span>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                    </div>
                );
            }
        }
    } catch (e) {
        // Parsing failed (likely incomplete JSON during stream or just normal text)
        // If it's loading and looks like JSON start, show a "Thinking" UI
        if (isLoading && isLast && msg.text.trim().startsWith('{')) {
            return (
                <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100 p-3 shadow-sm text-sm flex items-center space-x-2">
                    <Loader2 size={16} className="animate-spin text-cyan-500" />
                    <span className="text-slate-500">AI 正在对比车型库数据...</span>
                </div>
            );
        }
    }

    // Default: Markdown Text
    return (
        <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100 p-3 shadow-sm text-sm leading-relaxed">
            <div className="markdown-content">
                <ReactMarkdown 
                    components={{
                        ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 my-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 my-1" {...props} />,
                        li: ({node, ...props}) => <li className="my-0.5" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-cyan-800" {...props} />
                    }}
                >
                    {msg.text}
                </ReactMarkdown>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex items-center text-white">
        <Sparkles className="mr-2" size={20} />
        <div>
            <h2 className="font-bold text-lg">AI 智能购车顾问</h2>
            <p className="text-cyan-100 text-xs">基于 Gemini 2.5 Flash 模型驱动</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            return (
                <div 
                    key={idx} 
                    className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div 
                    className={`flex w-full ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-indigo-100 ml-2' : 'bg-cyan-100 mr-2'}`}>
                            {msg.role === 'user' ? <User size={16} className="text-indigo-600" /> : <Bot size={16} className="text-cyan-600" />}
                        </div>
                        
                        <div className={`max-w-[85%] md:max-w-[80%]`}>
                             {renderMessageContent(msg, isLast)}
                        </div>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的需求，例如：20万左右性价比最高的车..."
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:bg-slate-100"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">AI 可能会产生不准确的信息，请以官方配置表为准。</p>
        </div>
      </div>
    </div>
  );
};

export default Advisor;
