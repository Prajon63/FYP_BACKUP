// src/pages/About.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Edit2, Save, X,
  ChevronLeft, Briefcase, GraduationCap,
  User as UserIcon, Heart, BookOpen, Lock, Globe, Loader2,} from 'lucide-react';
import { userService } from '../services/userService';
import type { User as UserType } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import InterestTags from '../components/InterestTags';
import toast, { Toaster } from 'react-hot-toast';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

// ── Visibility toggle pill ─────────────────────────────────────────────
function VisPill({
  value,
  onToggle,
}: {
  value: 'public' | 'private';
  onToggle: () => void;
}) {
  const isPublic = value === 'public';
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        isPublic
          ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
      }`}
    >
      {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      {isPublic ? 'Public' : 'Private'}
    </button>
  );
}

// ── Section card wrapper ───────────────────────────────────────────────
function SectionCard({
  icon,
  label,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-slate-700 tracking-wide uppercase">{label}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// ── View mode info row ─────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────
const About: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType| null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

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
      } catch {
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
    } catch {
      toast.error('Save failed');
    }
  };

  const toggleVis = (setter: React.Dispatch<React.SetStateAction<'public' | 'private'>>) => {
    setter((prev) => (prev === 'public' ? 'private' : 'public'));
  };

  const isEmpty =
    !about && !pronouns && !gender && !interestedIn.length && !workTitle && !educationSchool;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
        <style>{`${FONTS}
        * { box-sizing: border-box; }
        `}</style>
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-sm text-slate-500 font-medium" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Loading your profile…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`${FONTS}
        * { box-sizing: border-box; }
        textarea:focus { outline: none; }
      `}</style>

      <Toaster position="top-center" />

      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-bold text-slate-900 leading-none"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              About Me
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {user?.username ? `@${user.username}` : 'Your story'}
            </p>
          </div>
          {!isEditing && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 shrink-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </motion.button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <SectionCard icon={<BookOpen className="w-4 h-4" />} label="My Story" delay={0}>
                <div>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value.slice(0, charLimit))}
                    placeholder="Share your story, passions, and what you're looking for…"
                    rows={6}
                    className="w-full p-4 border border-slate-200 rounded-xl bg-white text-sm leading-relaxed resize-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                  />
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-slate-400">Be authentic — it attracts the right people</span>
                    <span className={`text-xs font-medium ${about.length > charLimit * 0.9 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {about.length}/{charLimit}
                    </span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={<UserIcon className="w-4 h-4" />} label="Identity" delay={0.07}>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <Input
                        label="Pronouns"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        placeholder="he/him, she/her, they/them…"
                      />
                    </div>
                    <VisPill value={pronounsVis} onToggle={() => toggleVis(setPronounsVis)} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <Input
                        label="Gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        placeholder="Male, Female, Non-binary…"
                      />
                    </div>
                    <VisPill value={genderVis} onToggle={() => toggleVis(setGenderVis)} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={<Heart className="w-4 h-4" />} label="Interested In" delay={0.14}>
                <InterestTags
                  tags={interestedIn}
                  onTagsChange={setInterestedIn}
                  editable={true}
                  maxTags={10}
                  suggestions={['Men', 'Women', 'Everyone', 'Non-binary', 'Men & Women', 'Non-binary & Genderqueer']}
                  colorScheme="gradient"
                />
                <VisPill value={interestedInVis} onToggle={() => toggleVis(setInterestedInVis)} />
              </SectionCard>

              <SectionCard icon={<Briefcase className="w-4 h-4" />} label="Work" delay={0.21}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Job Title"
                    value={workTitle}
                    onChange={(e) => setWorkTitle(e.target.value)}
                    placeholder="Software Engineer"
                  />
                  <Input
                    label="Company"
                    value={workCompany}
                    onChange={(e) => setWorkCompany(e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>
                <VisPill value={workVis} onToggle={() => toggleVis(setWorkVis)} />
              </SectionCard>

              <SectionCard icon={<GraduationCap className="w-4 h-4" />} label="Education" delay={0.28}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="School"
                    value={educationSchool}
                    onChange={(e) => setEducationSchool(e.target.value)}
                    placeholder="University Name"
                  />
                  <Input
                    label="Degree"
                    value={educationDegree}
                    onChange={(e) => setEducationDegree(e.target.value)}
                    placeholder="Bachelor of Science"
                  />
                </div>
                <VisPill value={educationVis} onToggle={() => toggleVis(setEducationVis)} />
              </SectionCard>

              <div className="flex gap-3 pt-2 pb-8">
                <Button variant="outline" fullWidth onClick={() => setIsEditing(false)} className="rounded-2xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 !from-transparent !to-transparent !shadow-none">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleSave}
                  className="rounded-2xl font-bold !bg-gradient-to-r !from-rose-500 !to-pink-500 !shadow-lg !shadow-rose-300/40 hover:!from-rose-600 hover:!to-pink-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {isEmpty ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm p-16 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-rose-300" />
                  </div>
                  <h3
                    className="text-xl font-bold text-slate-700 mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Your story starts here
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                    Let others get to know the real you. Add your story, identity, and what makes you unique.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-rose-300/40 hover:from-rose-600 hover:to-pink-600 transition-all"
                  >
                    Start writing
                  </button>
                </motion.div>
              ) : (
                <>
                  {about && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700 tracking-wide uppercase">My Story</h3>
                      </div>
                      <p
                        className="text-slate-700 leading-relaxed whitespace-pre-wrap"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.05rem' }}
                      >
                        {about}
                      </p>
                    </motion.div>
                  )}

                  {(pronouns || gender || interestedIn.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Identity</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {pronouns && <InfoRow label="Pronouns" value={pronouns} />}
                        {gender && <InfoRow label="Gender" value={gender} />}
                      </div>
                      {interestedIn.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                            Interested In
                          </p>
                          <InterestTags
                            tags={interestedIn}
                            onTagsChange={() => {}}
                            editable={false}
                            colorScheme="gradient"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(workTitle || workCompany || educationSchool || educationDegree) && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.19, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {(workTitle || workCompany) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work</span>
                          </div>
                          {workTitle && <p className="font-semibold text-slate-800">{workTitle}</p>}
                          {workCompany && <p className="text-sm text-slate-500">{workCompany}</p>}
                        </div>
                      )}
                      {(educationSchool || educationDegree) && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Education</span>
                          </div>
                          {educationDegree && <p className="font-semibold text-slate-800">{educationDegree}</p>}
                          {educationSchool && <p className="text-sm text-slate-500">{educationSchool}</p>}
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default About;
