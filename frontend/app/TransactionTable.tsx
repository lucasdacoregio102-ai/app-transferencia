'use client';

import { useEffect, useState } from 'react';

interface Transaction {
  id: string;
  type: 'PIX_IN' | 'PIX_OUT';
  amount: number;
  pixEndToEnd: string;
  onchainHash: string | null;
  createdAt: string;
}

export default function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('https://app-transferencia.onrender.com/api/transactions');
        if (!response.ok) throw new Error('Falha ao buscar transações');
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Histórico de Transações</h3>
        <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-500 border border-gray-200 shadow-sm">
          {transactions.length} registos
        </span>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 backdrop-blur-md bg-opacity-90 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">EndToEnd ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Blockchain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx, index) => (
              <tr 
                key={tx.id} 
                className={`hover:bg-blue-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(tx.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    tx.type === 'PIX_IN' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tx.type === 'PIX_IN' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {tx.type === 'PIX_IN' ? 'Entrada (On-Ramp)' : 'Saída (Off-Ramp)'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                  {tx.pixEndToEnd.substring(0, 15)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                  {tx.onchainHash ? (
                    <a 
                      href={`https://sepolia.basescan.org/tx/${tx.onchainHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      {tx.onchainHash.substring(0, 8)}...{tx.onchainHash.substring(tx.onchainHash.length - 4)}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Pendente</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">Nenhuma transação encontrada no sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}