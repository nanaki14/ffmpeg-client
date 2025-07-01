import './App.css';
import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Electron + React + TypeScript
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Development environment is ready!
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="default">Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </div>
    </div>
  );
}

export default App;