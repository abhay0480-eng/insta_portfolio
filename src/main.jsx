import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import './style.css';
import data from './data.json';

const { meta, socials, work, skills, projects, notes, contactTypes } = data;

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

/* ── Top Scroll Progress Bar ── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="scroll-progress"
      style={{ transform: `scaleX(${progress})` }}
      aria-hidden="true"
    />
  );
}

/* ── Scroll-triggered Reveal Wrapper ── */
function Reveal({ children, className = '', as: Tag = 'div', id }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} id={id} className={`reveal${visible ? ' in-view' : ''} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

/* ── Validate local or HTTPS audio URL ── */
function getSafeAudioUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ── Hero Voice Intro Pill (ElevenLabs MP3) ── */
function HeroVoiceIntro({ src, fallbackDuration = '0:30', isPlaying, onToggle }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [unavailable, setUnavailable] = useState(false);

  const safeSrc = getSafeAudioUrl(src);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !safeSrc) return;
    if (isPlaying) {
      el.play().catch(() => {
        setUnavailable(true);
        onToggle(false);
      });
    } else {
      el.pause();
    }
  }, [isPlaying, safeSrc, onToggle]);

  if (!safeSrc) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="voice-pill-wrap">
      <audio
        ref={audioRef}
        src={safeSrc}
        preload="none"
        onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setCurrentTime(0);
          onToggle(false);
        }}
        onError={() => {
          setUnavailable(true);
          if (isPlaying) onToggle(false);
        }}
      />
      <button
        type="button"
        className={`voice-pill${isPlaying ? ' playing' : ''}`}
        disabled={unavailable}
        onClick={() => onToggle(!isPlaying)}
        aria-label={
          unavailable
            ? 'Voice intro coming soon'
            : isPlaying
              ? 'Pause voice intro'
              : 'Play 30-second voice intro'
        }
      >
        <span className="voice-pill-icon" aria-hidden="true">
          {isPlaying ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          )}
        </span>

        <span className={`voice-eq${isPlaying ? ' active' : ''}`} aria-hidden="true">
          <i /><i /><i /><i />
        </span>

        <span className="voice-pill-text">
          {unavailable ? 'Intro audio coming soon' : isPlaying ? 'Playing intro' : 'Hear my intro'}
        </span>

        {!unavailable && (
          <span className="voice-pill-time">
            {isPlaying && duration > 0
              ? `${formatTime(currentTime)} / ${formatTime(duration)}`
              : duration > 0
                ? formatTime(duration)
                : fallbackDuration}
          </span>
        )}

        {isPlaying && (
          <span className="voice-pill-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

/* ── Validate Google Drive URL and convert to embeddable /preview URL ── */
function getSafeDriveUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'drive.google.com') {
      return null;
    }
    const match = parsed.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    return {
      preview: `https://drive.google.com/file/d/${match[1]}/preview`,
      external: `https://drive.google.com/file/d/${match[1]}/view?usp=sharing`,
    };
  } catch {
    return null;
  }
}

/* ── In-Page PDF Viewer Modal ── */
function PdfViewerModal({ note, onClose }) {
  const safeUrls = getSafeDriveUrl(note.drive);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="pdf-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${note.title} PDF viewer`}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pdf-modal">
        <div className="pdf-modal-head">
          <div className="pdf-modal-title-wrap">
            <span className="note-tag" style={{ color: note.accent }}>{note.tag}</span>
            <h3>{note.title}</h3>
          </div>
          <div className="pdf-modal-actions">
            {safeUrls && (
              <a
                className="pdf-modal-ext"
                href={safeUrls.external}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Drive <Arrow />
              </a>
            )}
            <button
              type="button"
              className="pdf-modal-close"
              onClick={onClose}
              aria-label="Close PDF viewer"
            >
              ✕
            </button>
          </div>
        </div>
        {safeUrls ? (
          <iframe
            className="pdf-modal-frame"
            src={safeUrls.preview}
            title={`${note.title} PDF`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="pdf-modal-fallback">
            <p>This PDF link is unavailable or invalid.</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── PDF Notes Card ── */
function NoteCard({ note, onOpen }) {
  return (
    <button
      type="button"
      className="note-card"
      onClick={() => onOpen(note)}
      aria-label={`Read ${note.title} notes (PDF)`}
    >
      <div className="note-icon" style={{ background: note.color }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke={note.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="14 2 14 8 20 8" stroke={note.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="13" x2="8" y2="13" stroke={note.accent} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="17" x2="8" y2="17" stroke={note.accent} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div className="note-body">
        <span className="note-tag" style={{ color: note.accent }}>{note.tag}</span>
        <h3 className="note-title">{note.title}</h3>
        <p className="note-desc">{note.desc}</p>
      </div>
      <span className="note-dl" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        </svg>
        Read PDF
      </span>
    </button>
  );
}

/* ── Notes Section ── */
function NotesSection() {
  const [activeNote, setActiveNote] = useState(null);
  return (
    <Reveal as="section" className="section notes-section" id="notes">
      <div className="section-head">
        <div>
          <div className="kicker notes-kicker">
            <span className="notes-live-dot" aria-hidden="true" />
            FREE RESOURCES · ALWAYS GROWING
          </div>
          <h2>Interview <em>Notes.</em></h2>
        </div>
        <p>Handcrafted PDF notes from real interview prep — read right here, no download needed.</p>
      </div>
      <div className="notes-grid">
        {notes.map(n => <NoteCard key={n.title} note={n} onOpen={setActiveNote} />)}
      </div>
      <p className="notes-footer-hint">
        More topics dropping regularly — follow{' '}
        <a href={meta.instagram} target="_blank" rel="noopener noreferrer">@abhaycodess</a> to stay updated.
      </p>
      {activeNote && <PdfViewerModal note={activeNote} onClose={() => setActiveNote(null)} />}
    </Reveal>
  );
}

/* ── Accordion Work Card (mobile: smooth collapse, desktop: always open) ── */
function WorkCard({ w, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className="work-card">
      <button
        type="button"
        className="work-card-toggle"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <div className="work-top">
          <div className="company-icon" style={{ background: w.color }}>{w.initial}</div>
          <div>
            <h3>{w.company}</h3>
            <p>{w.role}</p>
          </div>
          <span className="industry">{w.type}</span>
        </div>
        <span className={`chevron${open ? ' rotated' : ''}`} aria-hidden="true">▼</span>
      </button>

      <div className={`work-body-wrap${open ? ' open' : ''}`}>
        <div className="work-body">
          <div className="work-body-inner">
            <h4>{w.title}</h4>
            <p className="description">{w.desc}</p>
            <div className="tags">{w.tags.map(t => <span key={t}>{t}</span>)}</div>
            <div className="metric"><span>↗</span>{w.metric}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Contact() {
  const [type, setType] = useState(contactTypes[0]);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const body = `Hi Abhay,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}`;

  return (
    <Reveal className="contact-panel" id="contact">
      <div>
        <span className="kicker light">INBOX / OPEN</span>
        <h2>Let's talk<span className="lime">.</span></h2>
        <p>Stuck on a frontend concept? Have an idea for a reel or want to collaborate? Drop me a message.</p>
        <a className="email" href={`mailto:${meta.email}`}>{meta.email} <Arrow /></a>
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          window.location.href = `mailto:${meta.email}?subject=${encodeURIComponent(type + ' — ' + name)}&body=${encodeURIComponent(body)}`;
        }}
        className="form"
      >
        <div className="flex flex-wrap gap-2">
          {contactTypes.map(t => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              className={'choice ' + (type === t ? 'active' : '')}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            Your name
            <input required maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ada Lovelace" />
          </label>
          <label>
            Your email
            <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
        </div>
        <label>
          Your message
          <textarea required rows="4" maxLength={1500} value={message} onChange={e => setMessage(e.target.value)} placeholder="Hey Abhay, I wanted to ask..." />
        </label>
        <button className="send" type="submit">Open email draft <Arrow /></button>
        <div className="flex justify-between gap-2 items-center">
          <small>Opens your email app. Nothing is submitted here.</small>
          <button
            type="button"
            className="copy"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(body);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? 'Copied!' : 'Copy text'}
          </button>
        </div>
      </form>
    </Reveal>
  );
}

function App() {
  const [introPlaying, setIntroPlaying] = useState(false);
  const linkedInUrl = socials.find(s => s.label === 'LinkedIn')?.url;
  const githubUrl = socials.find(s => s.label === 'GitHub')?.url;

  return (
    <>
      <ScrollProgress />
      <div className="nav-wrap">
        <header className="nav">
          <a className="wordmark" href="#top">AK<span className="accent">.</span></a>
          <div className="nav-actions">
            <a className="nav-notes-cta" href="#notes">
              <span className="nav-notes-dot" aria-hidden="true" />
              Free PDF Notes
            </a>
            <a className="nav-contact" href="#contact">Get in touch <Arrow /></a>
          </div>
        </header>
      </div>

      <main className="shell">
        <section id="top" className="hero">
          <div className="hero-stagger">
            <div className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true" />
              HELLO, I'M ABHAY
            </div>
            <h1>Abhay <em>Kumar.</em></h1>
            <div className="role">{meta.role}</div>
            <p className="intro">{meta.intro}</p>
            <div className="hero-actions">
              <a className="primary" href="#work">Explore my experience ↓</a>
              {linkedInUrl && (
                <a className="secondary" href={linkedInUrl} target="_blank" rel="noopener noreferrer">LinkedIn <Arrow /></a>
              )}
            </div>
          </div>

          <aside className="identity identity-enter">
            <div className={`avatar-ring${introPlaying ? ' playing' : ''}`}>
              <img src="/avatar.png" alt={`${meta.name}'s professional portrait`} />
            </div>
            <div className="identity-info">
              <span className="kicker">FIND ME ONLINE</span>
              <a className="identity-handle" href={meta.instagram} target="_blank" rel="noopener noreferrer">
                @abhaycodess <Arrow />
              </a>
              <p>{meta.degree}</p>
              <HeroVoiceIntro
                src={meta.introAudio}
                fallbackDuration={meta.introAudioDuration}
                isPlaying={introPlaying}
                onToggle={setIntroPlaying}
              />
            </div>
          </aside>
        </section>

        <Reveal as="section" className="section" id="work">
          <div className="section-head">
            <div>
              <div className="kicker">01 / PROFESSIONAL BACKGROUND</div>
              <h2>Where I've <em>built.</em></h2>
            </div>
            <p>My experience across healthcare, music streaming and e-commerce.</p>
          </div>
          <div className="work-carousel">
            {work.map((w, i) => <WorkCard key={w.company} w={w} defaultOpen={i === 0} />)}
          </div>
          <p className="work-swipe-hint" aria-hidden="true">Swipe cards → · Tap any card to expand</p>
        </Reveal>

        <Reveal as="section" className="section">
          <div className="section-head">
            <div>
              <div className="kicker">02 / TECHNICAL BACKGROUND</div>
              <h2>What I work <em>with.</em></h2>
            </div>
          </div>
          <div className="skills-grid">
            {skills.map(s => (
              <article key={s.num}><span>{s.num}</span><h3>{s.title}</h3><p>{s.detail}</p></article>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="section">
          <div className="section-head">
            <div>
              <div className="kicker">03 / INDEPENDENT WORK</div>
              <h2>Beyond the <em>day job.</em></h2>
            </div>
            {githubUrl && (
              <a className="secondary" href={githubUrl} target="_blank" rel="noopener noreferrer">GitHub <Arrow /></a>
            )}
          </div>
          <div className="work-grid">
            {projects.map(p => (
              <article className="work-card" key={p.title}>
                <div className="kicker">{p.type}</div>
                <h4>{p.title}</h4>
                <p className="description">{p.desc}</p>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="statement">
          <span className="kicker">MY APPROACH TO TEACHING</span>
          <h2>Understand the why, <em>not just the answer.</em></h2>
          <p>Interview preparation should go beyond memorizing definitions. My goal is to make the concepts I use in real applications easier to understand, with practical examples and visual explanations.</p>
        </Reveal>

        <NotesSection />

        <Contact />

        <footer>
          <div>
            <a className="wordmark" href="#top">{meta.name}<span className="accent">.</span></a>
            <p>Frontend engineer · B.Tech, {meta.college}</p>
          </div>
          <div className="socials">
            {socials.map(s => (
              <a href={s.url} key={s.label} target="_blank" rel="noopener noreferrer">{s.label} <Arrow /></a>
            ))}
          </div>
        </footer>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
