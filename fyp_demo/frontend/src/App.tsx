import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
// import Preferences from './pages/Preferences';
import EnhancedPreferences from './pages/EnhancedPreferences';
import Home from './pages/Home';
import Profile from './pages/profile';
import ViewProfile from './pages/ViewProfile';
import Settings from './pages/Settings';
import About from './pages/About';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Discover from './pages/Discover';
import Matches from './pages/Matches';
import Messages from './pages/Messages';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* <Route path="/preferences" element={<Preferences />} /> */}
        <Route path="/preferences/setup" element={<EnhancedPreferences />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        {/* Public profile view — any user's profile by ID */}
        <Route path="/profile/:userId" element={<ViewProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/messages" element={<Messages />} />
      </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;