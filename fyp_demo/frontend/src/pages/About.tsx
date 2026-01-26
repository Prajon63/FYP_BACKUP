// src/pages/About.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/userService';
import type { User } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import InterestTags from '../components/InterestTags';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const About: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // All states - flat and simple
  const [about, setAbout] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [pronounsVis, setPronounsVis] = useState<'public' | 'private'>('public');
  const [gender, setGender] = useState('');
  const [genderVis, setGenderVis] = useState<'public' | 'private'>('public');
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [interestedInVis, setInterestedInVis] = useState<'public' | 'private'>('public');
  const [workTitle, setWorkTitle] = useState('');
  const [workCompany, setWorkCompany] = useState('');
  const [workVis, setWorkVis] = useState<'public' | 'private'>('public');
  const [educationSchool, setEducationSchool] = useState('');
  const [educationDegree, setEducationDegree] = useState('');
  const [educationVis, setEducationVis] = useState<'public' | 'private'>('public');

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
        navigate('/login');
        return;
      }

      try {
        const res = await userService.getUserProfile(userId);
        if (res.success && res.user) {
          const u = res.user;
          setUser(u);
          setAbout(u.about || '');
          setPronouns(u.pronouns || '');
          setPronounsVis(u.pronounsVisibility || 'public');
          setGender(u.gender || '');
          setGenderVis(u.genderVisibility || 'public');
          setInterestedIn(u.interestedIn || []);
          setInterestedInVis(u.interestedInVisibility || 'public');
          setWorkTitle(u.workTitle || '');
          setWorkCompany(u.workCompany || '');
          setWorkVis(u.workVisibility || 'public');
          setEducationSchool(u.educationSchool || '');
          setEducationDegree(u.educationDegree || '');
          setEducationVis(u.educationVisibility || 'public');
        }
      } catch (err) {
        toast.error('Failed to load');
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
      const payload = {
        about,
        pronouns,
        pronounsVisibility: pronounsVis,
        gender,
        genderVisibility: genderVis,
        interestedIn,
        interestedInVisibility: interestedInVis,
        workTitle,
        workCompany,
        workVisibility: workVis,
        educationSchool,
        educationDegree,
        educationVisibility: educationVis,
      };

      const response = await userService.updateProfile(userId, payload);
      if (response.success && response.user) {
        setUser(response.user);
        setIsEditing(false);
        toast.success('Updated successfully!');
      }
    } catch (err) {
      toast.error('Save failed');
    }
  };

  const toggleVis = (setter: any) => {
    setter((prev: string) => (prev === 'public' ? 'private' : 'public'));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-12">
      <Toaster position="top-center" />

      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Capella</h1>
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-pink-600">Back</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">About Me</h2>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-8">
              {/* Free text */}
              <div>
                <label className="block text-sm font-medium mb-2">My Story</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value.slice(0, charLimit))}
                  className="w-full h-48 p-4 border rounded-xl"
                  placeholder="Your full story..."
                />
                <p className="text-right text-sm text-gray-500">{about.length}/{charLimit}</p>
              </div>

              {/* Pronouns */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Input label="Pronouns" value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="he/him, she/her..." className="flex-1" />
                <button type="button" onClick={() => toggleVis(setPronounsVis)} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                  {pronounsVis === 'public' ? <Eye className="w-4" /> : <EyeOff className="w-4" />}
                  {pronounsVis}
                </button>
              </div>

              {/* Gender */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Input label="Gender" value={gender} onChange={e => setGender(e.target.value)} placeholder="Male, Female, Non-binary..." className="flex-1" />
                <button type="button" onClick={() => toggleVis(setGenderVis)} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                  {genderVis === 'public' ? <Eye className="w-4" /> : <EyeOff className="w-4" />}
                  {genderVis}
                </button>
              </div>

              {/* Interested In - using InterestTags component */}
              <div>
                <label className="block text-sm font-medium mb-2">Interested In</label>
                <InterestTags
                  tags={interestedIn}
                  onTagsChange={setInterestedIn}
                  editable={true}
                  maxTags={10}
                  suggestions={['Men', 'Women', 'Everyone', 'Non-binary', 'Men & Women', 'Non-binary & Genderqueer']}
                  colorScheme="gradient"
                />
                <button 
                  type="button" 
                  onClick={() => toggleVis(setInterestedInVis)} 
                  className="mt-3 flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {interestedInVis === 'public' ? <Eye className="w-4" /> : <EyeOff className="w-4" />}
                  {interestedInVis}
                </button>
              </div>

              {/* Work */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Job Title" value={workTitle} onChange={e => setWorkTitle(e.target.value)} placeholder="Software Engineer" />
                <Input label="Company" value={workCompany} onChange={e => setWorkCompany(e.target.value)} placeholder="xAI" />
              </div>
              <button type="button" onClick={() => toggleVis(setWorkVis)} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                {workVis === 'public' ? <Eye className="w-4" /> : <EyeOff className="w-4" />}
                {workVis}
              </button>

              {/* Education */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="School" value={educationSchool} onChange={e => setEducationSchool(e.target.value)} placeholder="University Name" />
                <Input label="Degree" value={educationDegree} onChange={e => setEducationDegree(e.target.value)} placeholder="Bachelor of Science" />
              </div>
              <button type="button" onClick={() => toggleVis(setEducationVis)} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                {educationVis === 'public' ? <Eye className="w-4" /> : <EyeOff className="w-4" />}
                {educationVis}
              </button>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button variant="outline" fullWidth onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button fullWidth onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </div>
            </div>
          ) : (
            // View mode - beautiful cards
            <div className="space-y-8">
              {about && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">My Story</h3>
                  <div className="bg-gray-50 p-6 rounded-2xl whitespace-pre-wrap leading-relaxed">
                    {about}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pronouns && (
                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-medium text-gray-700">Pronouns</h4>
                    <p className="mt-1">{pronouns}</p>
                  </div>
                )}
                {gender && (
                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-medium text-gray-700">Gender</h4>
                    <p className="mt-1">{gender}</p>
                  </div>
                )}
                {interestedIn.length > 0 && (
                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-medium text-gray-700 mb-2">Interested In</h4>
                    <InterestTags
                      tags={interestedIn}
                      onTagsChange={() => {}}
                      editable={false}
                      colorScheme="gradient"
                    />
                  </div>
                )}
                {(workTitle || workCompany) && (
                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-medium text-gray-700">Work</h4>
                    <p className="mt-1">
                      {workTitle && <span>{workTitle}</span>}
                      {workTitle && workCompany && ' at '}
                      {workCompany && <span>{workCompany}</span>}
                    </p>
                  </div>
                )}
                {(educationSchool || educationDegree) && (
                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-medium text-gray-700">Education</h4>
                    <p className="mt-1">
                      {educationDegree && <span>{educationDegree}</span>}
                      {educationDegree && educationSchool && ' from '}
                      {educationSchool && <span>{educationSchool}</span>}
                    </p>
                  </div>
                )}
              </div>

              {!about && !pronouns && !gender && !interestedIn.length && !workTitle && !educationSchool && (
                <p className="text-center text-gray-500 py-12 italic">Nothing here yet. Click Edit to start telling your story!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;

//working
// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';
// import { Edit2, Save, X } from 'lucide-react';
// import { userService } from '../services/userService';
// import type { User } from '../types';
// import Button from '../components/Button';
// import toast from 'react-hot-toast';
// import { Toaster } from 'react-hot-toast';

// const About: React.FC = () => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState<User | null>(null);
//   const [about, setAbout] = useState('');
//   const [isEditing, setIsEditing] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const charLimit = 3000;

//   const getCurrentUserId = () => {
//     const userStr = localStorage.getItem('user');
//     return userStr ? JSON.parse(userStr)?._id : null;
//   };

//   useEffect(() => {
//     const loadUser = async () => {
//       const userId = getCurrentUserId();
//       if (!userId) {
//         toast.error('Please login');
//         navigate('/login'); // adjust route as needed
//         return;
//       }

//       try {
//         const response = await userService.getUserProfile(userId);
//         if (response.success && response.user) {
//           setUser(response.user);
//           setAbout(response.user.about || '');
//         }
//       } catch (err) {
//         toast.error('Failed to load profile');
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadUser();
//   }, [navigate]);

//   const handleSave = async () => {
//     const userId = getCurrentUserId();
//     if (!userId) return;

//     try {
//       const response = await userService.updateProfile(userId, { about });
//       if (response.success && response.user) {
//         setUser(response.user);
//         setAbout(response.user.about || '');
//         setIsEditing(false);
//         toast.success('About section updated!');
//       }
//     } catch (err) {
//       toast.error('Failed to save');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-12">
//       <Toaster position="top-center" />

//       {/* Simple Nav – consistent with your profile */}
//       <nav className="bg-white shadow-md sticky top-0 z-50">
//         <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
//           <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
//             Capella
//           </h1>
//           <button
//             onClick={() => navigate(-1)}
//             className="text-gray-600 hover:text-pink-600"
//           >
//             Back
//           </button>
//         </div>
//       </nav>

//       <div className="max-w-4xl mx-auto px-4 py-8">
//         <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
//           <div className="flex items-center justify-between mb-8">
//             <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
//               About Me
//             </h2>

//             {!isEditing && (
//               <Button
//                 variant="outline"
//                 onClick={() => setIsEditing(true)}
//                 className="flex items-center gap-2"
//               >
//                 <Edit2 className="w-4 h-4" />
//                 Edit
//               </Button>
//             )}
//           </div>

//           {isEditing ? (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="space-y-4"
//             >
//               <textarea
//                 value={about}
//                 onChange={(e) => setAbout(e.target.value.slice(0, charLimit))}
//                 placeholder="Share your story, passions, what you're looking for in connections, fun facts... (max 3000 characters)"
//                 className="w-full h-64 md:h-96 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none text-base leading-relaxed"
//               />
//               <p className="text-sm text-gray-500 text-right">
//                 {about.length} / {charLimit}
//               </p>

//               <div className="flex gap-4">
//                 <Button
//                   variant="outline"
//                   fullWidth
//                   onClick={() => setIsEditing(false)}
//                 >
//                   <X className="w-4 h-4 mr-2" />
//                   Cancel
//                 </Button>
//                 <Button fullWidth onClick={handleSave}>
//                   <Save className="w-4 h-4 mr-2" />
//                   Save
//                 </Button>
//               </div>
//             </motion.div>
//           ) : (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="prose prose-lg max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed"
//             >
//               {about ? (
//                 <div className="bg-gray-50 p-6 md:p-10 rounded-xl border border-gray-100">
//                   {about.split('\n').map((paragraph, i) => (
//                     <p key={i} className="mb-4">
//                       {paragraph}
//                     </p>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-gray-500 italic text-center py-12">
//                   No about info yet. Let others get to know the real you!
//                 </p>
//               )}
//             </motion.div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default About;