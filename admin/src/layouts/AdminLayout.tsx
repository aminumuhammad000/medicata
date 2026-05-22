import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          {/* <div>
            <h2 className="text-3xl font-black tracking-tight">Dashboard Overview</h2>
            <p className="text-gray-400">Manage your medical ecosystem monitoring.</p>
          </div> */}
          {/* <div className="flex items-center gap-4">
            <div className="px-4 py-2 glass rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-gray-300">Backend Online</span>
            </div>
          </div> */}
        </header>
        <Outlet />
      </main>
    </div>
  );
}
