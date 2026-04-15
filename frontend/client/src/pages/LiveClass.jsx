import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Video, VideoOff, Mic, MicOff, MonitorUp, MessageSquare,
  Copy, CheckCheck, Users, Plus, LogIn, X, Radio, Link2
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Helper – generate a short unique room id
   ────────────────────────────────────────────── */
const generateRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'bb-';
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

/* ──────────────────────────────────────────────
   Main LiveClass component
   ────────────────────────────────────────────── */
const LiveClass = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If ?room=xxx is present, jump straight into the session
  const roomFromUrl = searchParams.get('room');

  const [roomId, setRoomId] = useState(roomFromUrl || '');
  const [joinInput, setJoinInput] = useState('');
  const [inSession, setInSession] = useState(!!roomFromUrl);
  const [copied, setCopied] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  // Jitsi
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  /* ── Copy link helper ────────────────────── */
  const shareLink = `${window.location.origin}/live-class?room=${roomId}`;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareLink]);

  /* ── Start a new class ───────────────────── */
  const startClass = () => {
    const newRoom = generateRoomId();
    setRoomId(newRoom);
    setInSession(true);
  };

  /* ── Join an existing class ──────────────── */
  const joinClass = () => {
    if (!joinInput.trim()) return;
    // Accept full URL or just the room id
    let id = joinInput.trim();
    if (id.includes('room=')) {
      try { id = new URL(id).searchParams.get('room') || id; } catch { /* use raw input */ }
    }
    setRoomId(id);
    setInSession(true);
  };

  /* ── Leave / end the session ─────────────── */
  const leaveSession = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    setInSession(false);
    setRoomId('');
    setParticipantCount(0);
    navigate('/live-class', { replace: true });
  };

  /* ── Load Jitsi IFrame API and start ────── */
  useEffect(() => {
    if (!inSession || !roomId) return;

    const loadJitsi = () => {
      // Check if the API script is already loaded
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => console.error('Failed to load Jitsi Meet API');
      document.body.appendChild(script);
    };

    const initJitsi = () => {
      if (!jitsiContainerRef.current) return;

      const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: `BrainBarter_${roomId}`,
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user?.name || 'Student',
          email: user?.email || '',
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'chat',
            'raisehand', 'tileview', 'fullscreen',
            'participants-pane', 'toggle-camera',
          ],
          enableWelcomePage: false,
          enableClosePage: false,
          disableInviteFunctions: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          MOBILE_APP_PROMO: false,
          DEFAULT_BACKGROUND: '#0f172a',
          FILM_STRIP_MAX_HEIGHT: 120,
        },
      });

      // Track participant count
      api.addEventListener('participantJoined', () => {
        setParticipantCount((c) => c + 1);
      });
      api.addEventListener('participantLeft', () => {
        setParticipantCount((c) => Math.max(0, c - 1));
      });
      api.addEventListener('videoConferenceJoined', () => {
        setParticipantCount(1);
      });
      api.addEventListener('readyToClose', leaveSession);

      jitsiApiRef.current = api;
    };

    loadJitsi();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inSession, roomId]);

  /* ──────────────────────────────────────────
     RENDER — Lobby View (Start / Join)
     ────────────────────────────────────────── */
  if (!inSession) {
    return (
      <div className="page-container fade-in" style={{ paddingTop: '2.5rem' }}>
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
              color: '#6d28d9',
              border: '1px solid #c4b5fd',
            }}
          >
            <Radio className="w-3.5 h-3.5" />
            Live Classes
          </div>
          <h1 className="section-title" style={{ fontSize: '2.25rem' }}>
            Start or Join a Live Class
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
            Real-time video sessions powered by Jitsi Meet — no installs, no accounts.
            Just share the link and start learning together.
          </p>
        </div>

        {/* Cards */}
        <div
          className="grid gap-6 max-w-3xl mx-auto"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        >
          {/* Start Class Card */}
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              }}
            >
              <Plus className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Start a Class</h2>
            <p className="text-slate-500 text-sm mb-5">
              Create a new room and invite students with a unique link.
            </p>
            <button
              id="start-class-btn"
              onClick={startClass}
              className="btn-primary w-full justify-center"
              style={{ padding: '0.75rem' }}
            >
              <Video className="w-4 h-4" />
              Start Class
            </button>
          </div>

          {/* Join Class Card */}
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
              }}
            >
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Join a Class</h2>
            <p className="text-slate-500 text-sm mb-5">
              Paste a room link or ID shared by your teacher.
            </p>
            <div className="flex gap-2 w-full">
              <input
                id="join-class-input"
                type="text"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinClass()}
                placeholder="Room link or ID"
                className="input-field"
                style={{ flex: 1, fontSize: '0.8rem' }}
              />
              <button
                id="join-class-btn"
                onClick={joinClass}
                className="btn-accent"
                style={{ whiteSpace: 'nowrap' }}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-14 max-w-3xl mx-auto">
          <h3 className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
            What You Get
          </h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              { icon: Video, title: 'HD Video', desc: 'Crystal-clear video calls with adaptive quality' },
              { icon: MonitorUp, title: 'Screen Sharing', desc: 'Share your screen, code, or slides instantly' },
              { icon: MessageSquare, title: 'Live Chat', desc: 'In-session chat for links, questions & notes' },
              { icon: Users, title: 'Unlimited Participants', desc: 'Invite as many students as you need' },
              { icon: MicOff, title: 'Audio Controls', desc: 'Mute / unmute with one click' },
              { icon: Link2, title: 'One-Click Join', desc: 'No downloads — works right in the browser' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 items-start p-3 rounded-xl hover:bg-white/60 transition-colors">
                <div className="mt-0.5">
                  <Icon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────
     RENDER — Active Session
     ────────────────────────────────────────── */
  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-slate-200/60"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          {/* Live badge */}
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              boxShadow: '0 0 12px rgba(239,68,68,0.4)',
              animation: 'pulse-glow 2s infinite',
            }}
          >
            <Radio className="w-3 h-3" />
            LIVE
          </span>
          {/* Room ID */}
          <span className="text-xs text-slate-500 font-mono hidden sm:block">{roomId}</span>
          {/* Participant count */}
          <span className="badge badge-blue hidden sm:inline-flex">
            <Users className="w-3 h-3" />
            {participantCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Link */}
          <button
            id="copy-link-btn"
            onClick={copyLink}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          {/* Leave */}
          <button
            id="leave-class-btn"
            onClick={leaveSession}
            className="btn-danger"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
          >
            <X className="w-3.5 h-3.5" />
            Leave
          </button>
        </div>
      </div>

      {/* Jitsi container — fills remaining space */}
      <div ref={jitsiContainerRef} style={{ flex: 1, background: '#0f172a' }} />
    </div>
  );
};

export default LiveClass;
