import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

function Preferences() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    gender: '',
    interestedIn: '',
    minAge: 18,
    maxAge: 30,
    interests: ''
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await authService.savePreferences(form);
      if (res.success) {
        toast.success('Preferences saved!');
        navigate('/home');
      } else {
        toast.error(res.error || 'Failed to save preferences');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error saving preferences');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Set Your Dating Preferences
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            placeholder="Your Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          />
          <Input
            placeholder="Interested In"
            value={form.interestedIn}
            onChange={(e) => setForm({ ...form, interestedIn: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Min Age"
            value={form.minAge}
            onChange={(e) => setForm({ ...form, minAge: Number(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="Max Age"
            value={form.maxAge}
            onChange={(e) => setForm({ ...form, maxAge: Number(e.target.value) })}
          />
          <Input
            placeholder="Interests (comma-separated)"
            value={form.interests}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
          />
          <Button type="submit" variant="primary" fullWidth>
            Save Preferences
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Preferences;



