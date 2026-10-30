import TransactionTable from './TransactionTable';
import OfframpForm from './OfframpForm';

export default function Home() {
  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Painel de Transações (Simulador)</h1>
      
      <OfframpForm />
      
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Histórico de Movimentações</h2>
      <TransactionTable />
    </main>
  );
}