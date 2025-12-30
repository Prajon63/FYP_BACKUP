import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Preferences from './pages/Preferences';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
