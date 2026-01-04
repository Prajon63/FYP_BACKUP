import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, MoreVertical, MapPin, Calendar, User } from "lucide-react";

// Random user profile data
const userProfiles = [
  {
    id: 1,
    name: "Emma Watson",
    username: "@emmawatson",
    age: 28,
    location: "New York, USA",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop",
    bio: "Actor | Activist | Book lover 📚 Living life to the fullest ✨",
    post: {
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop",
      caption: "Sunset vibes 🌅 Feeling grateful for another beautiful day! #grateful #sunset",
      likes: 1247,
      comments: 89,
      date: "2 hours ago"
    }
  },
  {
    id: 2,
    name: "Alex Chen",
    username: "@alexchen",
    age: 26,
    location: "San Francisco, USA",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=600&fit=crop",
    bio: "Photographer 📸 Travel enthusiast 🌍 Coffee addict ☕",
    post: {
      image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=600&fit=crop",
      caption: "Morning coffee and new adventures! Who's with me? ☕🚀",
      likes: 892,
      comments: 45,
      date: "5 hours ago"
    }
  },
  {
    id: 3,
    name: "Sophia Martinez",
    username: "@sophiam",
    age: 24,
    location: "Los Angeles, USA",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=600&fit=crop",
    bio: "Yoga instructor 🧘‍♀️ Wellness advocate 🌿 Spreading positive energy ✨",
    post: {
      image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=600&fit=crop",
      caption: "Starting the day with good vibes and positive energy! 🧘‍♀️✨ What are you grateful for today?",
      likes: 2156,
      comments: 156,
      date: "8 hours ago"
    }
  },
  {
    id: 4,
    name: "James Wilson",
    username: "@jamesw",
    age: 30,
    location: "London, UK",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    bio: "Software Engineer 💻 Music producer 🎵 Always learning something new",
    post: {
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      caption: "Weekend adventures in the mountains! Nature is the best therapy 🏔️ #weekendvibes",
      likes: 1834,
      comments: 124,
      date: "12 hours ago"
    }
  },
  {
    id: 5,
    name: "Olivia Brown",
    username: "@oliviab",
    age: 27,
    location: "Paris, France",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop",
    bio: "Fashion designer 👗 Art lover 🎨 Exploring the world one city at a time 🌍",
    post: {
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop",
      caption: "Parisian mornings never get old ☕✨ The city of lights always inspires me!",
      likes: 3245,
      comments: 278,
      date: "1 day ago"
    }
  },
  {
    id: 6,
    name: "Michael Taylor",
    username: "@michaelt",
    age: 29,
    location: "Sydney, Australia",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop",
    bio: "Surfer 🏄‍♂️ Environmentalist 🌊 Living the beach life",
    post: {
      image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop",
      caption: "Perfect waves this morning! Nothing beats sunrise surf sessions 🏄‍♂️🌊",
      likes: 1456,
      comments: 67,
      date: "1 day ago"
    }
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const toggleLike = (postId: number) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Capella
            </h1>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-gray-600 hover:text-pink-600 transition-colors">
                Discover
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-pink-600 transition-colors">
                Messages
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 text-gray-600 hover:text-pink-600 transition-colors flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Profile
              </button>
              <div
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 cursor-pointer hover:ring-2 hover:ring-pink-300 transition-all"
              ></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userProfiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Profile Header */}
              <div className="relative">
                <img
                  src={profile.coverImage}
                  alt={profile.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-end gap-3">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-16 h-16 rounded-full border-4 border-white object-cover"
                    />
                    <div className="flex-1 text-white">
                      <h3 className="font-bold text-lg">{profile.name}</h3>
                      <p className="text-sm opacity-90">{profile.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{profile.age} years old</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>

                {/* Post Section */}
                <div className="border-t pt-3 space-y-3">
                  <img
                    src={profile.post.image}
                    alt="Post"
                    className="w-full h-64 object-cover rounded-xl"
                  />

                  {/* Post Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(profile.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          likedPosts.has(profile.id)
                            ? 'text-pink-600'
                            : 'text-gray-600 hover:text-pink-600'
                        }`}
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            likedPosts.has(profile.id) ? 'fill-pink-600' : ''
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {formatNumber(
                            profile.post.likes + (likedPosts.has(profile.id) ? 1 : 0)
                          )}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors">
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm font-medium">
                          {formatNumber(profile.post.comments)}
                        </span>
                      </button>
                      <button className="text-gray-600 hover:text-blue-600 transition-colors">
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                    <button className="text-gray-600 hover:text-gray-800 transition-colors">
                      <MoreVertical className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Post Caption */}
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold">{profile.username}</span>{' '}
                      {profile.post.caption}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{profile.post.date}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
