'use client';

import { useState } from 'react';

export default function OfframpForm() {
  const [cpf, setCpf] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    const mockBurnHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    try {
      const response = await fetch('https://app-transferencia.onrender.com/api/offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, pixKey, amount: parseFloat(amount), burnTxHash: mockBurnHash }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao processar o saque');
      
      setFeedback({ type: 'success', text: `Saque de R$ ${amount} concluído! Pix enviado.` });
      setCpf(''); setPixKey(''); setAmount('');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFeedback({ type: 'error', text: error.message });
      } else {
        setFeedback({ type: 'error', text: 'Ocorreu um erro inesperado.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Solicitar Saque (Off-Ramp)</h2>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">CPF do Cliente</label>
            <input type="text" required value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="Apenas números" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Chave Pix</label>
            <input type="text" required value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Destino do Pix" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Valor (R$)</label>
            <input type="number" required min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
          </div>

          <button type="submit" disabled={loading} className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold text-white shadow-sm transition-all flex justify-center items-center h-[42px] ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}>
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Confirmar Saque'}
          </button>
        </form>

        {feedback && (
          <div className={`mt-6 p-4 rounded-lg text-sm font-medium border flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}