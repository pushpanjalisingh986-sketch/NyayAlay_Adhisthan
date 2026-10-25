import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import ProceduresPage from './pages/ProceduresPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <h1>NyayAlay</h1>
          <nav>
            <NavLink to="/" end>
              Chat
            </NavLink>
            <NavLink to="/procedures">Procedures</NavLink>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/procedures" element={<ProceduresPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}