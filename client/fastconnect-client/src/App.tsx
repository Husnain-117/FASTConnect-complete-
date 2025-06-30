import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Home from './components/Home';
import About from './components/about';
import SearchPage from './components/SearchPage';
import Profile from './components/Profile';
import TextChat from './components/TextChat';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/home" element={<Home />} /> 
      <Route path="/about" element={<About />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/profile/:userId" element={<Profile />} />
      <Route path="/text-chat" element={<TextChat />} />
      <Route path="/" element={<Login />} />    
    </Routes>
  );
}

export default App;