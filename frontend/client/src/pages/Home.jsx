import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Repeat, Users, MessageCircle, Star, Shield,
  Zap, BookOpen, Palette, Code, Music, Globe
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const steps = [
    {
      icon: Users,
      title: 'Create Your Profile',
      desc: 'List the skills you can teach and the skills you want to learn.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Repeat,
      title: 'Find a Match',
      desc: 'Our smart matching system connects you with the perfect skill partner.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: MessageCircle,
      title: 'Start Swapping',
      desc: 'Chat, schedule, and exchange skills. Rate each other when done!',
      color: 'from-orange-500 to-amber-500'
    },
  ];

  const categories = [
    { icon: Code, label: 'Tech', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { icon: Music, label: 'Music', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { icon: Palette, label: 'Design', color: 'bg-pink-50 text-pink-600 border-pink-100' },
    { icon: Globe, label: 'Language', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { icon: BookOpen, label: 'Science', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { icon: Zap, label: 'Business', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  ];

  const features = [
    { icon: Shield, title: 'Safe & Secure', desc: 'Verified profiles and secure messaging keep your exchanges safe.' },
    { icon: Star, title: 'Rating System', desc: 'Build your reputation through reviews and earn badges.' },
    { icon: Zap, title: 'Smart Matching', desc: 'AI-powered matching finds your perfect skill exchange partner.' },
  ];

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-1/3 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-sm font-semibold text-blue-600 mb-6 slide-up">
              <Zap className="w-4 h-4" />
              No money needed — just your skills!
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 slide-up" style={{ animationDelay: '0.1s' }}>
              Exchange{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Skills
              </span>
              , Not{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Money
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 mb-10 max-w-2xl mx-auto slide-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
              BrainBarter connects you with people who have the skills you want to learn.
              Teach what you know, learn what you love — completely free.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 slide-up" style={{ animationDelay: '0.3s' }}>
              {user ? (
                <Link to="/explore" className="btn-primary text-base px-8 py-3 no-underline">
                  Explore Skills
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn-primary text-base px-8 py-3 no-underline">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link to="/login" className="btn-secondary text-base px-8 py-3 no-underline">
                    Log In
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 sm:gap-12 mt-16 slide-up" style={{ animationDelay: '0.4s' }}>
              {[
                { value: '500+', label: 'Active Users' },
                { value: '1,200+', label: 'Skills Shared' },
                { value: '800+', label: 'Swaps Done' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white/50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="section-title text-3xl">How It Works</h2>
            <p className="text-slate-500 mt-2">Three simple steps to start learning</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="glass-card p-8 text-center group">
                <div className="relative mb-6">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-slate-400 shadow-md border border-slate-100 md:right-auto md:left-1/2 md:ml-8">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="section-title text-3xl">Popular Categories</h2>
            <p className="text-slate-500 mt-2">Browse skills across diverse categories</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map(({ icon: Icon, label, color }) => (
              <Link
                key={label}
                to={user ? `/explore?category=${label}` : '/signup'}
                className={`glass-card p-6 text-center no-underline group cursor-pointer border ${color}`}
              >
                <Icon className="w-8 h-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white/50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="section-title text-3xl">Why BrainBarter?</h2>
            <p className="text-slate-500 mt-2">Built for learners, by learners</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }, index) => (
              <div key={index} className="glass-card p-8 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
            <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-emerald-500/5"></div>
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4">
                  Ready to Start Bartering?
                </h2>
                <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
                  Join thousands of students who are learning new skills without spending a dime.
                </p>
                <Link to="/signup" className="btn-primary text-lg px-10 py-4 no-underline">
                  Join BrainBarter Today
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100 bg-white/30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-slate-400">
            © 2024 BrainBarter. Exchange Skills, Not Money. Made with ❤️ for learners.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
