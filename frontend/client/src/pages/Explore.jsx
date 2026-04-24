import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Search, Filter, Code, Music, Palette, Globe, BookOpen, Zap,
  Dumbbell, ChefHat, Brush, MoreHorizontal, Star, ArrowUpRight,
  X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const categoryIcons = {
  Tech: Code, Music: Music, Design: Palette, Language: Globe,
  Science: BookOpen, Business: Zap, Sports: Dumbbell, Cooking: ChefHat,
  Art: Brush, Other: MoreHorizontal
};

const categoryColors = {
  Tech: 'bg-blue-50 text-blue-600 border-blue-200',
  Music: 'bg-purple-50 text-purple-600 border-purple-200',
  Design: 'bg-pink-50 text-pink-600 border-pink-200',
  Language: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Science: 'bg-amber-50 text-amber-600 border-amber-200',
  Business: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  Sports: 'bg-red-50 text-red-600 border-red-200',
  Cooking: 'bg-orange-50 text-orange-600 border-orange-200',
  Art: 'bg-rose-50 text-rose-600 border-rose-200',
  Other: 'bg-slate-50 text-slate-600 border-slate-200',
};

const Explore = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [type, setType] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New skill form
  const [newSkill, setNewSkill] = useState({
    title: '', description: '', category: 'Tech', level: 'Beginner', type: 'offered', tags: ''
  });

  useEffect(() => {
    fetchSkills();
  }, [category, type]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category && category !== 'All') params.category = category;
      if (type) params.type = type;
      const res = await API.get('/api/skills', { params });
      setSkills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const handlePostSkill = async () => {
  try {
    const res = await API.post("/api/skills", {
      skillName: "Java",
      level: "beginner"
    });

    console.log("Skill added:", res.data);
    alert("Skill added successfully!");
  } catch (err) {
    console.log("Error:", err);
    alert("Skill post failed");
  }
};

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredSkills = skills.filter(skill => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      skill.title.toLowerCase().includes(q) ||
      skill.description.toLowerCase().includes(q) ||
      skill.user?.name?.toLowerCase().includes(q)
    );
  });

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newSkill,
        tags: newSkill.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await API.post('/api/skills', payload);
      toast.success('Skill posted successfully! 🎉');
      setShowCreateModal(false);
      setNewSkill({ title: '', description: '', category: 'Tech', level: 'Beginner', type: 'offered', tags: '' });
      fetchSkills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create skill');
    }
  };

  const categories = ['All', 'Tech', 'Music', 'Design', 'Language', 'Science', 'Business', 'Sports', 'Cooking', 'Art', 'Other'];

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title">Explore Skills</h1>
          <p className="text-slate-500 text-sm">Discover skills from learners around you</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Post a Skill
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search skills, categories, or users..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field w-auto min-w-[120px]"
            >
              <option value="">All Types</option>
              <option value="offered">Offered</option>
              <option value="wanted">Wanted</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                category === cat
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-400 mb-4">
        Showing {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''}
      </p>

      {/* Skills Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredSkills.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No skills found</h3>
          <p className="text-slate-400 text-sm">Try adjusting your filters or be the first to post!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill, index) => {
            const Icon = categoryIcons[skill.category] || MoreHorizontal;
            const colorClass = categoryColors[skill.category] || categoryColors.Other;

            return (
              <div
                key={skill._id}
                className="glass-card p-5 flex flex-col slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Category & Type */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${colorClass}`}>
                    <Icon className="w-3 h-3" />
                    {skill.category}
                  </span>
                  <span className={`badge ${skill.type === 'offered' ? 'badge-green' : 'badge-orange'}`}>
                    {skill.type === 'offered' ? '📤 Offering' : '📥 Wanting'}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-800 mb-1.5">{skill.title}</h3>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2 flex-1">{skill.description}</p>

                {/* Level */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-slate-400">Level:</span>
                  <span className={`badge ${
                    skill.level === 'Beginner' ? 'badge-green' :
                    skill.level === 'Intermediate' ? 'badge-blue' : 'badge-purple'
                  }`}>
                    {skill.level}
                  </span>
                </div>

                {/* Tags */}
                {skill.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {skill.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* User & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Link
                    to={`/profile/${skill.user?._id}`}
                    className="flex items-center gap-2 no-underline group"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-xs text-white font-bold">
                      {skill.user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {skill.user?.name}
                      </span>
                      {skill.user?.averageRating > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-amber-600">{skill.user.averageRating}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <Link
                    to={`/profile/${skill.user?._id}`}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1 no-underline"
                  >
                    View <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Skill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 fade-in">
          <div className="glass-card p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(255,255,255,0.95)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Post a New Skill</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Skill Title</label>
                <input
                  type="text"
                  value={newSkill.title}
                  onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })}
                  placeholder="e.g., Python Programming"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="Describe what you can teach or want to learn..."
                  className="input-field min-h-[100px] resize-y"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Category</label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="input-field"
                  >
                    {['Tech', 'Music', 'Design', 'Language', 'Sports', 'Cooking', 'Art', 'Business', 'Science', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Level</label>
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                    className="input-field"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Type</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    newSkill.type === 'offered' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="type"
                      value="offered"
                      checked={newSkill.type === 'offered'}
                      onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                      className="hidden"
                    />
                    <span className="text-sm font-semibold">📤 I Can Teach</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    newSkill.type === 'wanted' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="type"
                      value="wanted"
                      checked={newSkill.type === 'wanted'}
                      onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                      className="hidden"
                    />
                    <span className="text-sm font-semibold">📥 I Want to Learn</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newSkill.tags}
                  onChange={(e) => setNewSkill({ ...newSkill, tags: e.target.value })}
                  placeholder="e.g., web, frontend, react"
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center" onClick={handlePostSkill} >
                  Post Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
