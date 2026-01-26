import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import type { User } from '../types';

interface ProfileCompletionProps {
  user: User;
  onNavigateToAbout?: () => void;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ user, onNavigateToAbout }) => {
  const completionItems = useMemo(() => {
    return [
      {
        label: 'Profile Picture',
        completed: !!user.profilePicture,
        weight: 15,
      },
      {
        label: 'Cover Image',
        completed: !!user.coverImage,
        weight: 10,
      },
      {
        label: 'Username',
        completed: !!user.username,
        weight: 10,
      },
      {
        label: 'Bio',
        completed: !!user.bio && user.bio.length > 20,
        weight: 15,
      },
      {
        label: 'About Me',
        completed: !!user.about && user.about.length > 50,
        weight: 20,
      },
      {
        label: 'Work Info',
        completed: !!(user.workTitle || user.workCompany),
        weight: 10,
      },
      {
        label: 'Education',
        completed: !!(user.educationSchool || user.educationDegree),
        weight: 10,
      },
      {
        label: 'Interested In',
        completed: !!user.interestedIn && user.interestedIn.length > 0,
        weight: 10,
      },
    ];
  }, [user]);

  const completionPercentage = useMemo(() => {
    const totalWeight = completionItems.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = completionItems
      .filter(item => item.completed)
      .reduce((sum, item) => sum + item.weight, 0);
    return Math.round((completedWeight / totalWeight) * 100);
  }, [completionItems]);

  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-pink-500 to-purple-600';
  };

  const getMessage = (percentage: number) => {
    if (percentage === 100) return "Perfect! Your profile is complete! 🎉";
    if (percentage >= 80) return "Almost there! Just a few more details.";
    if (percentage >= 50) return "Good progress! Keep going!";
    return "Let's complete your profile to attract more connections!";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-600" />
          <h3 className="font-semibold text-gray-800">Profile Completion</h3>
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          {completionPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${getColorClass(completionPercentage)} rounded-full relative`}
          >
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{getMessage(completionPercentage)}</p>
      </div>

      {/* Completion Items */}
      <div className="grid grid-cols-2 gap-2">
        {completionItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-2 text-sm p-2 rounded-lg transition-colors ${
              item.completed
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer'
            }`}
            onClick={() => {
              if (!item.completed && item.label === 'About Me' && onNavigateToAbout) {
                onNavigateToAbout();
              }
            }}
          >
            {item.completed ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className={item.completed ? 'font-medium' : ''}>{item.label}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA for incomplete profile */}
      {completionPercentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100"
        >
          <p className="text-sm text-gray-700">
            💡 <strong>Pro tip:</strong> Complete profiles get 3x more matches!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfileCompletion;