import { Header } from './components/Header.tsx';
import { KanbanBoard } from './components/KanbanBoard.tsx';
import { useTasks } from './hooks/useTasks.ts';

function App() {
  const { data, sessions, switchSession } = useTasks();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0A0A0F]">
      <Header 
        data={data} 
        sessions={sessions}
        onSwitchSession={switchSession}
      />
      <KanbanBoard />
    </div>
  );
}

export default App;
