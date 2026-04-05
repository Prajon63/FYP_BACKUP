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
  UtensilsCrossed,
  Crosshair,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverService } from '../services/discoverService';
import { userService } from '../services/userService';
import { geocodeService } from '../services/geocodeService';
import type { MatchPreferences, User } from '../types';

/** Stored discovery flags are always fully defined in React state (unlike optional API fields). */
type DiscoverySettingsState = NonNullable<User['discoverySettings']>;

const defaultDiscoverySettings: DiscoverySettingsState = {
  isActive: true,
  ageRangeVisible: true,
  distanceVisible: true,
  lastActiveVisible: false,
};

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

  const [locationDraft, setLocationDraft] = useState({ city: '', country: '' });
  const [resolvedLocation, setResolvedLocation] = useState<User['location'] | null>(null);
  const [locationVisibility, setLocationVisibility] = useState<'public' | 'private'>('public');
  const [discoverySettings, setDiscoverySettings] =
    useState<DiscoverySettingsState>(defaultDiscoverySettings);
  const [locLoading, setLocLoading] = useState(false);

  const hasRealCoords = (loc?: User['location'] | null) =>
    !!loc?.coordinates &&
    !(loc.coordinates[0] === 0 && loc.coordinates[1] === 0);

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

        if (user.locationVisibility) {
          setLocationVisibility(user.locationVisibility);
        }
        if (user.discoverySettings) {
          const ds = user.discoverySettings;
          setDiscoverySettings({
            isActive: ds.isActive ?? true,
            ageRangeVisible: ds.ageRangeVisible ?? true,
            distanceVisible: ds.distanceVisible ?? true,
            lastActiveVisible: ds.lastActiveVisible ?? false,
          });
        }
        if (hasRealCoords(user.location)) {
          setResolvedLocation(user.location!);
          setLocationDraft({
            city: user.location?.city || '',
            country: user.location?.country || '',
          });
        }
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
        lifestyle: personalInfo.lifestyle,
        ...(resolvedLocation && hasRealCoords(resolvedLocation)
          ? {
              location: {
                type: 'Point',
                coordinates: resolvedLocation.coordinates,
                city: resolvedLocation.city,
                state: resolvedLocation.state,
                country: resolvedLocation.country,
                displayLocation: resolvedLocation.displayLocation,
              },
            }
          : {}),
        locationVisibility,
        discoverySettings,
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

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported in this browser');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await geocodeService.reverse(latitude, longitude);
          if (res.success && res.result) {
            setResolvedLocation({
              type: 'Point',
              coordinates: res.result.coordinates,
              city: res.result.city,
              state: res.result.state,
              country: res.result.country,
              displayLocation: res.result.displayLocation,
            });
            setLocationDraft({
              city: res.result.city,
              country: res.result.country,
            });
            toast.success('Location set from device');
          } else {
            toast.error(res.error || 'Could not resolve address');
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Reverse geocoding failed';
          toast.error(msg);
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocLoading(false);
        toast.error(err.message || 'Location permission denied or unavailable');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  };

  const lookupManualLocation = async () => {
    const q = [locationDraft.city, locationDraft.country].filter(Boolean).join(', ');
    if (q.length < 3) {
      toast.error('Enter city and country to look up');
      return;
    }
    setLocLoading(true);
    try {
      const res = await geocodeService.search(q);
      if (res.success && res.result) {
        setResolvedLocation({
          type: 'Point',
          coordinates: res.result.coordinates,
          city: res.result.city,
          state: res.result.state,
          country: res.result.country,
          displayLocation: res.result.displayLocation,
        });
        toast.success('Location saved');
      } else {
        toast.error(res.error || 'No place found — try a different spelling');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Look up failed';
      toast.error(msg);
    } finally {
      setLocLoading(false);
    }
  };

  const steps = [
    {
      title: 'Where you live',
      icon: <MapPin className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Add your area so we can match you with people nearby and show distance on cards. You control what others see.
          </p>

          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-pink-50/80 to-purple-50/80 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Use device GPS</p>
            <button
              type="button"
              onClick={useDeviceLocation}
              disabled={locLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-md hover:from-pink-600 hover:to-purple-700 disabled:opacity-60 transition-all"
            >
              {locLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />}
              Use current location
            </button>
            <p className="text-xs text-gray-500">
              Browser will ask for permission — same idea as maps apps. We store coordinates to compute distance; we don&apos;t track you in real time.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-3 text-gray-400">or enter manually</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">City</label>
              <input
                type="text"
                value={locationDraft.city}
                onChange={(e) => setLocationDraft({ ...locationDraft, city: e.target.value })}
                placeholder="e.g. Kathmandu"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">Country</label>
              <input
                type="text"
                value={locationDraft.country}
                onChange={(e) => setLocationDraft({ ...locationDraft, country: e.target.value })}
                placeholder="e.g. Nepal"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void lookupManualLocation()}
            disabled={locLoading}
            className="w-full py-3 rounded-xl border-2 border-purple-200 text-purple-700 font-semibold hover:bg-purple-50 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {locLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Look up &amp; save this place
          </button>

          {resolvedLocation && hasRealCoords(resolvedLocation) && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-900">
              <span className="font-semibold">Saved: </span>
              {resolvedLocation.displayLocation ||
                [resolvedLocation.city, resolvedLocation.country].filter(Boolean).join(', ')}
            </div>
          )}

          <div className="space-y-4 pt-2 border-t border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={locationVisibility === 'public'}
                onChange={(e) => setLocationVisibility(e.target.checked ? 'public' : 'private')}
                className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>
                <span className="font-medium text-gray-800">Show city / region on my profile</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  If off, your city won&apos;t appear on your card, but distance can still be used for matching if enabled below.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={discoverySettings.distanceVisible !== false}
                onChange={(e) =>
                  setDiscoverySettings((prev) => ({
                    ...prev,
                    distanceVisible: e.target.checked,
                  }))
                }
                className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>
                <span className="font-medium text-gray-800">Show approximate distance to others</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Others see roughly how many km away you are (e.g. &quot;12 km away&quot;). Turn off for more privacy.
                </span>
              </span>
            </label>
          </div>
        </div>
      )
    },
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