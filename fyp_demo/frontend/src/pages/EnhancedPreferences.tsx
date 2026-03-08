import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Sparkles,
  MapPin,
  Heart,
  Users,
  Cigarette,
  Wine,
  Dumbbell,
  UtensilsCrossed
} from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverService } from '../services/discoverService';
import { userService } from '../services/userService';
import type { MatchPreferences, User } from '../types';

const EnhancedPreferences: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const userId = localStorage.getItem('userId') || '';

  // Match Preferences
  const [preferences, setPreferences] = useState<MatchPreferences>({
    ageRange: { min: 18, max: 100 },
    distanceRange: 50,
    genderPreference: []
  });

  // personal info for optimized match algoritm- after registration
  const [personalInfo, setPersonalInfo] = useState<{
    gender: string;
    dateOfBirth: string;
    interestedIn: string[];
    relationshipGoals: string;
    interests: string[];
    lifestyle: {
      smoking?: '' | 'Never' | 'Socially' | 'Regularly' | 'Prefer not to say';
      drinking?: '' | 'Never' | 'Socially' | 'Regularly' | 'Prefer not to say';
      exercise?: '' | 'Never' | 'Sometimes' | 'Regularly' | 'Very active';
      diet?: '' | 'Anything' | 'Vegetarian' | 'Vegan' | 'Halal' | 'Kosher' | 'Other';
    };
  }>({
    gender: '',
    dateOfBirth: '',
    interestedIn: [],
    relationshipGoals: '',
    interests: [],
    lifestyle: {
      smoking: '',
      drinking: '',
      exercise: '',
      diet: ''
    }
  });

  const [interestInput, setInterestInput] = useState('');

  // Fetch existing preferences
  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await userService.getUserProfile(userId);
      if (response.success && response.user) {
        const user = response.user;

        // Set match preferences
        if (user.matchPreferences) {
          setPreferences(user.matchPreferences);
        }

        // Set personal info
        setPersonalInfo({
          gender: user.gender || '',
          dateOfBirth: user.dateOfBirth
            ? new Date(user.dateOfBirth).toISOString().split('T')[0]
            : '',
          interestedIn: user.interestedIn || [],
          relationshipGoals: user.relationshipGoals || '',
          interests: user.interests || [],
          lifestyle: {
            smoking: user.lifestyle?.smoking || '',
            drinking: user.lifestyle?.drinking || '',
            exercise: user.lifestyle?.exercise || '',
            diet: user.lifestyle?.diet || ''
          }
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update match preferences
      await discoverService.updateMatchPreferences(userId, preferences);

      // Update personal info
      await userService.updateProfile(userId, {
        gender: personalInfo.gender,
        dateOfBirth: (personalInfo.dateOfBirth || undefined) as any,
        interestedIn: personalInfo.interestedIn,
        relationshipGoals: personalInfo.relationshipGoals as any,
        interests: personalInfo.interests,
        lifestyle: personalInfo.lifestyle
      });

      toast.success('Preferences saved successfully!');
      navigate('/discover');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const addInterest = () => {
    if (interestInput.trim() && personalInfo.interests.length < 20) {
      setPersonalInfo({
        ...personalInfo,
        interests: [...personalInfo.interests, interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const removeInterest = (index: number) => {
    setPersonalInfo({
      ...personalInfo,
      interests: personalInfo.interests.filter((_, i) => i !== index)
    });
  };

  const toggleGender = (gender: string) => {
    const current = preferences.genderPreference || [];
    const updated = current.includes(gender)
      ? current.filter(g => g !== gender)
      : [...current, gender];

    setPreferences({ ...preferences, genderPreference: updated });
  };

  const toggleInterestedIn = (option: string) => {
    const updated = personalInfo.interestedIn.includes(option)
      ? personalInfo.interestedIn.filter(o => o !== option)
      : [...personalInfo.interestedIn, option];

    setPersonalInfo({ ...personalInfo, interestedIn: updated });
  };

  const steps = [
    {
      title: 'About You',
      icon: <Users className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          {/* Date of Birth */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Date of Birth
            </label>
            <input
              type="date"
              value={personalInfo.dateOfBirth}
              onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Must be 18 or older</p>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              I am
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Male', 'Female', 'Non-binary', 'Other'].map((option) => (
                <button
                  key={option}
                  onClick={() => setPersonalInfo({ ...personalInfo, gender: option })}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${personalInfo.gender === option
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Interested In */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Interested in
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Men', 'Women', 'Non-binary', 'Everyone'].map((option) => (
                <button
                  key={option}
                  onClick={() => toggleInterestedIn(option)}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${personalInfo.interestedIn.includes(option)
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Relationship Goals */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Looking for
            </label>
            <div className="space-y-2">
              {[
                'Casual dating',
                'Long-term relationship',
                'Marriage',
                'Friendship',
                'Not sure yet'
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => setPersonalInfo({ ...personalInfo, relationshipGoals: option })}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all text-left ${personalInfo.relationshipGoals === option
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Match Preferences',
      icon: <Heart className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          {/* Show Me */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Show me
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Men', 'Women', 'Non-binary', 'Everyone'].map((option) => (
                <button
                  key={option}
                  onClick={() => toggleGender(option)}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${preferences.genderPreference.includes(option)
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Age Range: {preferences.ageRange.min} - {preferences.ageRange.max}
            </label>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Min: {preferences.ageRange.min}</span>
                  <span>Max: {preferences.ageRange.max}</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={preferences.ageRange.min}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      ageRange: { ...preferences.ageRange, min: parseInt(e.target.value) }
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={preferences.ageRange.max}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      ageRange: { ...preferences.ageRange, max: parseInt(e.target.value) }
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 mt-2"
                />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Maximum Distance: {preferences.distanceRange} km
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={preferences.distanceRange}
              onChange={(e) =>
                setPreferences({ ...preferences, distanceRange: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Lifestyle',
      icon: <Dumbbell className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          {/* Smoking */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
              <Cigarette className="w-5 h-5" />
              Smoking
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Never', 'Socially', 'Regularly', 'Prefer not to say'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setPersonalInfo({
                      ...personalInfo,
                      lifestyle: { ...personalInfo.lifestyle, smoking: option }
                    })
                  }
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${personalInfo.lifestyle.smoking === option
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Drinking */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
              <Wine className="w-5 h-5" />
              Drinking
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Never', 'Socially', 'Regularly', 'Prefer not to say'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setPersonalInfo({
                      ...personalInfo,
                      lifestyle: { ...personalInfo.lifestyle, drinking: option }
                    })
                  }
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${personalInfo.lifestyle.drinking === option
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              Exercise
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Never', 'Sometimes', 'Regularly', 'Very active'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setPersonalInfo({
                      ...personalInfo,
                      lifestyle: { ...personalInfo.lifestyle, exercise: option }
                    })
                  }
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${personalInfo.lifestyle.exercise === option
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div>
            <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              Diet
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Anything', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Other'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setPersonalInfo({
                      ...personalInfo,
                      lifestyle: { ...personalInfo.lifestyle, diet: option }
                    })
                  }
                  className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${personalInfo.lifestyle.diet === option
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Interests',
      icon: <Sparkles className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-3">
              Add your interests (up to 20)
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                placeholder="e.g., Hiking, Photography, Cooking"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={30}
              />
              <button
                onClick={addInterest}
                disabled={personalInfo.interests.length >= 20}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 rounded-xl transition-all"
              >
                Add
              </button>
            </div>

            {/* Interest Tags */}
            <div className="flex flex-wrap gap-2">
              {personalInfo.interests.map((interest, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 group hover:from-pink-200 hover:to-purple-200 transition-all"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(index)}
                    className="hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {personalInfo.interests.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                No interests added yet. Add some to improve your matches!
              </p>
            )}

            <p className="text-xs text-gray-500 mt-4">
              {personalInfo.interests.length} / 20 interests
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>

            <h1 className="text-xl font-bold text-gray-900">
              Setup Your Preferences
            </h1>

            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl transition-all"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${currentStep === index
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {step.icon}
                  <span className="text-sm font-medium hidden md:inline">{step.title}</span>
                </button>
              ))}
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {steps[currentStep].title}
          </h2>
          {steps[currentStep].content}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
              >
                Previous
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save & Start Discovering
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedPreferences;