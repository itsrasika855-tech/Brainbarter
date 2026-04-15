import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Edit3, Save, X, Plus, Minus, Star, Award, MessageCircle,
  ArrowRight, UserCheck, MapPin, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [matchData, setMatchData] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapForm, setSwapForm] = useState({ requesterSkill: '', recipientSkill: '', message: '' });

  const isOwnProfile = currentUser?._id === id;

  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    skillsOffered: [],
    skillsWanted: [],
    newOffered: '',
    newWanted: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchReviews();
    if (currentUser && !isOwnProfile) {
      fetchMatchScore();
    }
  }, [id, currentUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/users/profile/${id}`);
      setProfileUser(res.data);
      setEditForm({
        name: res.data.name,
        bio: res.data.bio || '',
        skillsOffered: res.data.skillsOffered || [],
        skillsWanted: res.data.skillsWanted || [],
        newOffered: '',
        newWanted: '',
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await API.get(`/reviews/user/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMatchScore = async () => {
    try {
      const res = await API.get(`/users/match/${id}`);
      setMatchData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await API.put('/users/profile', {
        name: editForm.name,
        bio: editForm.bio,
        skillsOffered: editForm.skillsOffered,
        skillsWanted: editForm.skillsWanted,
      });
      setProfileUser(res.data);
      updateUser(res.data);
      setEditing(false);
      toast.success('Profile updated! ✨');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const addSkill = (type) => {
    const key = type === 'offered' ? 'newOffered' : 'newWanted';
    const listKey = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
    const value = editForm[key].trim();
    if (value && !editForm[listKey].includes(value)) {
      setEditForm({
        ...editForm,
        [listKey]: [...editForm[listKey], value],
        [key]: ''
      });
    }
  };

  const removeSkill = (type, skill) => {
    const listKey = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
    setEditForm({
      ...editForm,
      [listKey]: editForm[listKey].filter(s => s !== skill)
    });
  };

  const handleRequestSwap = async (e) => {
    e.preventDefault();
    try {
      await API.post('/swaps', {
        recipientId: id,
        requesterSkill: swapForm.requesterSkill,
        recipientSkill: swapForm.recipientSkill,
        message: swapForm.message,
      });
      toast.success('Swap request sent! 🤝');
      setShowSwapModal(false);
      setSwapForm({ requesterSkill: '', recipientSkill: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send swap request');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profileUser) return <div className="page-container text-center">User not found</div>;

  return (
    <div className="page-container fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1 space-y-5">
          {/* Avatar & Basic Info */}
          <div className="glass-card p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                {profileUser.avatar ? (
                  <img src={profileUser.avatar} alt={profileUser.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  profileUser.name[0]?.toUpperCase()
                )}
              </div>
              {profileUser.averageRating >= 4.5 && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center text-xs shadow-md">
                  ⭐
                </div>
              )}
            </div>

            {editing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input-field text-center font-bold text-lg mb-2"
              />
            ) : (
              <h2 className="text-xl font-bold text-slate-800 mb-1">{profileUser.name}</h2>
            )}

            {editing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Write a short bio about yourself..."
                className="input-field text-sm min-h-[80px] resize-y"
              />
            ) : (
              <p className="text-sm text-slate-500 mb-3">{profileUser.bio || 'No bio yet'}</p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 py-3 border-t border-slate-100 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">{profileUser.completedSwaps || 0}</div>
                <div className="text-xs text-slate-400">Swaps</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800">{profileUser.points || 0}</div>
                <div className="text-xs text-slate-400">Points</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <StarRating rating={Math.round(profileUser.averageRating || 0)} size="sm" />
                </div>
                <div className="text-xs text-slate-400">{profileUser.averageRating?.toFixed(1) || '0.0'}</div>
              </div>
            </div>

            {/* Badges */}
            {profileUser.badges?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
                {profileUser.badges.map((badge, i) => (
                  <span key={i} className="badge badge-blue" title={badge.name}>
                    {badge.icon} {badge.name}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 space-y-2">
              {isOwnProfile ? (
                editing ? (
                  <div className="flex gap-2">
                    <button onClick={handleSaveProfile} className="btn-accent flex-1 justify-center">
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-secondary flex-1 justify-center">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)} className="btn-secondary w-full justify-center">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                )
              ) : currentUser ? (
                <button onClick={() => setShowSwapModal(true)} className="btn-primary w-full justify-center">
                  <ArrowRight className="w-4 h-4" /> Request Swap
                </button>
              ) : null}
            </div>
          </div>

          {/* Match Score (for other users) */}
          {!isOwnProfile && matchData && currentUser && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-500" />
                Match Score
              </h3>
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${matchData.matchScore}%` }}
                ></div>
              </div>
              <div className="text-right text-sm font-bold text-blue-600">{matchData.matchScore}%</div>

              {matchData.iCanTeach?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">You can teach them:</p>
                  <div className="flex flex-wrap gap-1">
                    {matchData.iCanTeach.map(s => (
                      <span key={s} className="badge badge-green text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {matchData.theyCanTeach?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate-400 mb-1">They can teach you:</p>
                  <div className="flex flex-wrap gap-1">
                    {matchData.theyCanTeach.map(s => (
                      <span key={s} className="badge badge-blue text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Skills & Reviews */}
        <div className="lg:col-span-2 space-y-5">
          {/* Skills Offered */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              📤 Skills I Can Teach
            </h3>
            {editing ? (
              <div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={editForm.newOffered}
                    onChange={(e) => setEditForm({ ...editForm, newOffered: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('offered'))}
                    placeholder="Add a skill you can teach"
                    className="input-field flex-1"
                  />
                  <button onClick={() => addSkill('offered')} className="btn-accent" type="button">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.skillsOffered.map(skill => (
                    <span key={skill} className="badge badge-green flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill('offered', skill)} className="ml-0.5 cursor-pointer border-none bg-transparent p-0">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileUser.skillsOffered?.length > 0 ? (
                  profileUser.skillsOffered.map(skill => (
                    <span key={skill} className="badge badge-green">{skill}</span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No skills listed yet</p>
                )}
              </div>
            )}
          </div>

          {/* Skills Wanted */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              📥 Skills I Want to Learn
            </h3>
            {editing ? (
              <div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={editForm.newWanted}
                    onChange={(e) => setEditForm({ ...editForm, newWanted: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('wanted'))}
                    placeholder="Add a skill you want to learn"
                    className="input-field flex-1"
                  />
                  <button onClick={() => addSkill('wanted')} className="btn-accent" type="button">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.skillsWanted.map(skill => (
                    <span key={skill} className="badge badge-orange flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill('wanted', skill)} className="ml-0.5 cursor-pointer border-none bg-transparent p-0">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileUser.skillsWanted?.length > 0 ? (
                  profileUser.skillsWanted.map(skill => (
                    <span key={skill} className="badge badge-orange">{skill}</span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No skills listed yet</p>
                )}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Reviews ({reviews.length})
            </h3>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-xs text-white font-bold">
                          {review.reviewer?.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{review.reviewer?.name}</span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-500 mt-1">"{review.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 fade-in">
          <div className="glass-card p-6 sm:p-8 w-full max-w-md" style={{ background: 'rgba(255,255,255,0.95)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Request a Swap</h2>
              <button onClick={() => setShowSwapModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-none bg-transparent">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRequestSwap} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">I'll teach</label>
                <input
                  type="text"
                  value={swapForm.requesterSkill}
                  onChange={(e) => setSwapForm({ ...swapForm, requesterSkill: e.target.value })}
                  placeholder="Skill you'll offer"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">I want to learn</label>
                <input
                  type="text"
                  value={swapForm.recipientSkill}
                  onChange={(e) => setSwapForm({ ...swapForm, recipientSkill: e.target.value })}
                  placeholder="Skill you want from them"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Message (optional)</label>
                <textarea
                  value={swapForm.message}
                  onChange={(e) => setSwapForm({ ...swapForm, message: e.target.value })}
                  placeholder="Introduce yourself and why you want to swap..."
                  className="input-field min-h-[80px] resize-y"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSwapModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
