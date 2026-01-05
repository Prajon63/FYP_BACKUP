import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Edit2, Save, X } from 'lucide-react';
import { userService } from '../services/userService';
import type { User } from '../types';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const About: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [about, setAbout] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const charLimit = 3000;

  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr)?._id : null;
  };

  useEffect(() => {
    const loadUser = async () => {
      const userId = getCurrentUserId();
      if (!userId) {
        toast.error('Please login');
        navigate('/login'); // adjust route as needed
        return;
      }

      try {
        const response = await userService.getUserProfile(userId);
        if (response.success && response.user) {
          setUser(response.user);
          setAbout(response.user.about || '');
        }
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const handleSave = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await userService.updateProfile(userId, { about });
      if (response.success && response.user) {
        setUser(response.user);
        setAbout(response.user.about || '');
        setIsEditing(false);
        toast.success('About section updated!');
      }
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-12">
      <Toaster position="top-center" />

      {/* Simple Nav – consistent with your profile */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Capella
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-pink-600"
          >
            Back
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              About Me
            </h2>

            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value.slice(0, charLimit))}
                placeholder="Share your story, passions, what you're looking for in connections, fun facts... (max 3000 characters)"
                className="w-full h-64 md:h-96 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none text-base leading-relaxed"
              />
              <p className="text-sm text-gray-500 text-right">
                {about.length} / {charLimit}
              </p>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button fullWidth onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-lg max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed"
            >
              {about ? (
                <div className="bg-gray-50 p-6 md:p-10 rounded-xl border border-gray-100">
                  {about.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-12">
                  No about info yet. Let others get to know the real you!
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;