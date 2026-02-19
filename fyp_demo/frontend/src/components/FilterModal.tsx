import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders } from 'lucide-react';
import type { MatchPreferences } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: MatchPreferences;
  onApplyFilters: (preferences: MatchPreferences) => void;
}

const GENDER_OPTIONS = ['Men', 'Women', 'Non-binary', 'Everyone'];

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onApplyFilters
}) => {
  const [preferences, setPreferences] = useState<MatchPreferences>(currentPreferences);

  const handleApply = () => {
    onApplyFilters(preferences);
    onClose();
  };

  const handleReset = () => {
    const defaultPrefs: MatchPreferences = {
      ageRange: { min: 18, max: 100 },
      distanceRange: 50,
      genderPreference: []
    };
    setPreferences(defaultPrefs);
  };

  const toggleGender = (gender: string) => {
    const current = preferences.genderPreference || [];
    const newGenders = current.includes(gender)
      ? current.filter(g => g !== gender)
      : [...current, gender];
    
    setPreferences({
      ...preferences,
      genderPreference: newGenders
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sliders className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Discovery Filters</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Age Range */}
              <div className="mb-8">
                <label className="block text-gray-700 font-semibold mb-4">
                  Age Range: {preferences.ageRange.min} - {preferences.ageRange.max}
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Minimum Age</span>
                      <span className="font-semibold text-purple-600">{preferences.ageRange.min}</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="100"
                      value={preferences.ageRange.min}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          ageRange: {
                            ...preferences.ageRange,
                            min: parseInt(e.target.value)
                          }
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Maximum Age</span>
                      <span className="font-semibold text-purple-600">{preferences.ageRange.max}</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="100"
                      value={preferences.ageRange.max}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          ageRange: {
                            ...preferences.ageRange,
                            max: parseInt(e.target.value)
                          }
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Distance Range */}
              <div className="mb-8">
                <label className="block text-gray-700 font-semibold mb-2">
                  Maximum Distance
                </label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">
                    {preferences.distanceRange >= 100 ? 'Any distance' : `${preferences.distanceRange} km`}
                  </span>
                  <span className="text-sm font-semibold text-purple-600">
                    {preferences.distanceRange} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={preferences.distanceRange}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      distanceRange: parseInt(e.target.value)
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Gender Preference */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3">
                  Show me
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {GENDER_OPTIONS.map((gender) => (
                    <button
                      key={gender}
                      onClick={() => toggleGender(gender)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        preferences.genderPreference?.includes(gender)
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select multiple options to see more people
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;