import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StarRating from '../components/StarRating';
import {
  Trophy, Medal, Crown, Star, Award, TrendingUp, Flame
} from 'lucide-react';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await API.get('/leaderboard');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-6 h-6 text-amber-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-sm font-bold text-slate-400 w-6 text-center">{index + 1}</span>;
  };

  const getRankBg = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    if (index === 1) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    if (index === 2) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return '';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full text-sm font-semibold text-amber-600 mb-4">
          <Trophy className="w-4 h-4" />
          Top Learners
        </div>
        <h1 className="section-title text-3xl">Leaderboard</h1>
        <p className="text-slate-500 mt-2">See who's leading the skill exchange revolution</p>
      </div>

      {users.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No users yet</h3>
          <p className="text-slate-400 text-sm">Be the first to earn points!</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Top 3 Podium */}
          {users.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[users[1], users[0], users[2]].map((u, i) => {
                const realIndex = i === 0 ? 1 : i === 1 ? 0 : 2;
                return (
                  <Link
                    key={u._id}
                    to={`/profile/${u._id}`}
                    className={`glass-card p-5 text-center no-underline group ${
                      realIndex === 0 ? 'md:-mt-6' : ''
                    }`}
                  >
                    <div className="mb-2">{getRankIcon(realIndex)}</div>
                    <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${
                      realIndex === 0 ? 'from-amber-400 to-yellow-500' :
                      realIndex === 1 ? 'from-slate-300 to-slate-400' :
                      'from-orange-400 to-amber-500'
                    } flex items-center justify-center text-lg text-white font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mt-3 truncate">{u.name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-sm font-extrabold text-slate-700">{u.points}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {u.completedSwaps} swaps
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Rest of rankings */}
          {users.slice(users.length >= 3 ? 3 : 0).map((u, index) => {
            const rank = users.length >= 3 ? index + 3 : index;
            return (
              <Link
                key={u._id}
                to={`/profile/${u._id}`}
                className={`glass-card p-4 flex items-center gap-4 no-underline slide-up ${getRankBg(rank)}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-shrink-0">{getRankIcon(rank)}</div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-sm text-white font-bold flex-shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{u.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">{u.completedSwaps} swaps</span>
                    {u.averageRating > 0 && (
                      <span className="text-xs text-slate-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {u.averageRating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="hidden sm:flex gap-1 flex-shrink-0">
                  {u.badges?.slice(0, 3).map((b, bi) => (
                    <span key={bi} className="text-sm" title={b.name}>{b.icon}</span>
                  ))}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-extrabold text-slate-700">{u.points}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
