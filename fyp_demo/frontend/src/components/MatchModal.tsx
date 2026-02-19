import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchUser?: {
    _id: string;
    username?: string;
    profilePicture?: string;
    bio?: string;
    age?: number;
  };
  compatibilityScore?: number;
  onSendMessage?: () => void;
  onKeepSwiping?: () => void;
}

const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  matchUser,
  compatibilityScore = 0,
  onSendMessage,
  onKeepSwiping
}) => {
  React.useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF1493', '#FF69B4', '#FFB6C1']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#9370DB', '#BA55D3', '#DDA0DD']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!matchUser) return null;

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
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                <Sparkles className="w-16 h-16 text-white mx-auto" />
              </motion.div>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-2"
              >
                It's a Match! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-sm"
              >
                You and {matchUser.username || 'this user'} liked each other
              </motion.p>
            </div>

            {/* User Info */}
            <div className="p-6">
              {/* Profile Picture */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <img
                    src={matchUser.profilePicture || 'https://via.placeholder.com/150'}
                    alt={matchUser.username || 'Match'}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-2 shadow-lg">
                    <Heart className="w-6 h-6 fill-white" />
                  </div>
                </div>
              </motion.div>

              {/* Match Details */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center mb-6"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {matchUser.username || 'Anonymous'}
                  {matchUser.age && <span className="text-gray-600">, {matchUser.age}</span>}
                </h3>
                
                {matchUser.bio && (
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {matchUser.bio}
                  </p>
                )}

                {/* Compatibility Score */}
                <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700 font-semibold">
                    {compatibilityScore}% Compatible
                  </span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <button
                  onClick={onSendMessage}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send a Message
                </button>
                
                <button
                  onClick={onKeepSwiping}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl transition-all"
                >
                  Keep Swiping
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchModal;