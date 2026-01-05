import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Preferences from './pages/Preferences';
import Home from './pages/Home';
import Profile from './pages/profile';
import About from './pages/About';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
