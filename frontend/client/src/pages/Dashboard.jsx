import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LayoutDashboard, Clock, CheckCircle2, XCircle, ArrowRight,
  MessageCircle, Star, Award, TrendingUp, Users, Repeat
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ swapId: '', revieweeId: '', rating: 5, comment: '' });

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const res = await API.get('/swaps');
      setSwaps(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (swapId) => {
    try {
      await API.put(`/swaps/${swapId}/accept`);
      toast.success('Swap accepted! 🤝');
      fetchSwaps();
    } catch (err) {
      toast.error('Failed to accept swap');
    }
  };

  const handleReject = async (swapId) => {
    try {
      await API.put(`/swaps/${swapId}/reject`);
      toast.success('Swap rejected');
      fetchSwaps();
    } catch (err) {
      toast.error('Failed to reject swap');
    }
  };

  const handleComplete = async (swapId) => {
    try {
      await API.put(`/swaps/${swapId}/complete`);
      toast.success('Swap completed! 🎉 You earned 10 points!');
      fetchSwaps();
    } catch (err) {
      toast.error('Failed to complete swap');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await API.post('/reviews', {
        swapId: reviewData.swapId,
        revieweeId: reviewData.revieweeId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      toast.success('Review submitted! ⭐');
      setShowReviewModal(false);
      setReviewData({ swapId: '', revieweeId: '', rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const openReviewModal = (swap) => {
    const revieweeId = swap.requester._id === user._id ? swap.recipient._id : swap.requester._id;
    setReviewData({
      swapId: swap._id,
      revieweeId,
      rating: 5,
      comment: ''
    });
    setShowReviewModal(true);
  };

  const filteredSwaps = swaps.filter(swap => {
    if (activeTab === 'all') return true;
    return swap.status === activeTab;
  });

  const pendingReceived = swaps.filter(s => s.status === 'pending' && s.recipient._id === user?._id);
  const activeSwaps = swaps.filter(s => s.status === 'accepted');
  const completedSwaps = swaps.filter(s => s.status === 'completed');

  const getOtherUser = (swap) => {
    return swap.requester._id === user?._id ? swap.recipient : swap.requester;
  };

  const statusColors = {
    pending: 'badge-orange',
    accepted: 'badge-blue',
    rejected: 'badge-red',
    completed: 'badge-green',
  };

  const statusIcons = {
    pending: Clock,
    accepted: ArrowRight,
    rejected: XCircle,
    completed: CheckCircle2,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2">
          <LayoutDashboard className="w-8 h-8 text-blue-500" />
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm">Manage your skill exchanges</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Clock, label: 'Pending', value: pendingReceived.length, color: 'from-amber-400 to-orange-500' },
          { icon: Repeat, label: 'Active', value: activeSwaps.length, color: 'from-blue-400 to-cyan-500' },
          { icon: CheckCircle2, label: 'Completed', value: completedSwaps.length, color: 'from-emerald-400 to-teal-500' },
          { icon: Star, label: 'Points', value: user?.points || 0, color: 'from-purple-400 to-pink-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-800">{value}</div>
                <div className="text-xs text-slate-400">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Swaps' },
          { key: 'pending', label: 'Pending' },
          { key: 'accepted', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'rejected', label: 'Rejected' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Swap List */}
      {filteredSwaps.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No swaps found</h3>
          <p className="text-slate-400 text-sm mb-4">Start by exploring skills and sending swap requests!</p>
          <Link to="/explore" className="btn-primary no-underline inline-flex">
            Explore Skills <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSwaps.map((swap, index) => {
            const otherUser = getOtherUser(swap);
            const StatusIcon = statusIcons[swap.status];
            const isRecipient = swap.recipient._id === user?._id;

            return (
              <div
                key={swap._id}
                className="glass-card p-5 slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* User & Skills */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Link to={`/profile/${otherUser._id}`} className="no-underline">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-sm text-white font-bold">
                          {otherUser.name?.[0]?.toUpperCase()}
                        </div>
                      </Link>
                      <div>
                        <Link to={`/profile/${otherUser._id}`} className="text-sm font-bold text-slate-800 no-underline hover:text-blue-600">
                          {otherUser.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`badge ${statusColors[swap.status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                          </span>
                          {swap.matchScore > 0 && (
                            <span className="text-[10px] text-slate-400">Match: {swap.matchScore}%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="badge badge-green">📤 {swap.requesterSkill}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className="badge badge-blue">📥 {swap.recipientSkill}</span>
                    </div>

                    {swap.message && (
                      <p className="text-xs text-slate-400 mt-2 italic">"{swap.message}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {swap.status === 'pending' && isRecipient && (
                      <>
                        <button onClick={() => handleAccept(swap._id)} className="btn-accent text-xs py-1.5 px-3">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button onClick={() => handleReject(swap._id)} className="btn-danger text-xs py-1.5 px-3">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {swap.status === 'accepted' && (
                      <>
                        <Link to={`/chat?swapId=${swap._id}`} className="btn-secondary text-xs py-1.5 px-3 no-underline">
                          <MessageCircle className="w-3.5 h-3.5" /> Chat
                        </Link>
                        <button onClick={() => handleComplete(swap._id)} className="btn-accent text-xs py-1.5 px-3">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                      </>
                    )}

                    {swap.status === 'completed' && (
                      <button onClick={() => openReviewModal(swap)} className="btn-secondary text-xs py-1.5 px-3">
                        <Star className="w-3.5 h-3.5" /> Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 fade-in">
          <div className="glass-card p-6 sm:p-8 w-full max-w-md" style={{ background: 'rgba(255,255,255,0.95)' }}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Leave a Review</h2>
            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Rating</label>
                <StarRating
                  rating={reviewData.rating}
                  onRate={(r) => setReviewData({ ...reviewData, rating: r })}
                  interactive
                  size="lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Comment (optional)</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="Share your experience..."
                  className="input-field min-h-[80px] resize-y"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowReviewModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
