import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import data from './data.json';

const { meta, socials, work, skills, projects, notes, contactTypes } = data;

function Arrow() { return <span aria-hidden="true">↗</span>; }

/* ── PDF Notes Card ── */
function NoteCard({ note }) {
  return (
    <a
      className="note-card"
      href={note.drive}
      target="_blank"
      rel="noreferrer"
      aria-label={`Download ${note.title} notes (PDF)`}
    >
      <div className="note-icon" style={{ background: note.color }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke={note.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke={note.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="18" x2="12" y2="12" stroke={note.accent} strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="9 15 12 18 15 15" stroke={note.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="note-body">
        <span className="note-tag" style={{ color: note.accent }}>{note.tag}</span>
        <h3 className="note-title">{note.title}</h3>
        <p className="note-desc">{note.desc}</p>
      </div>
      <span className="note-dl" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Download PDF
      </span>
    </a>
  );
}

/* ── Notes Section ── */
function NotesSection() {
  return (
    <section className="section notes-section" id="notes">
      <div className="section-head">
        <div>
          <div className="kicker notes-kicker">
            <span className="notes-live-dot" aria-hidden="true" />
            FREE RESOURCES · ALWAYS GROWING
          </div>
          <h2>Interview <em>Notes.</em></h2>
        </div>
        <p>Handcrafted PDF notes from real interview prep — download free, no sign-in needed.</p>
      </div>
      <div className="notes-grid">
        {notes.map(n => <NoteCard key={n.title} note={n} />)}
      </div>
      <p className="notes-footer-hint">More topics dropping regularly — follow <a href="https://www.instagram.com/abhaycodess/" target="_blank" rel="noreferrer">@abhaycodess</a> to stay updated.</p>
    </section>
  );
}

/* ── Accordion Work Card (mobile: collapsed by default) ── */
function WorkCard({ w, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className="work-card">
      <button
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
        <span className="chevron" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="work-body">
          <h4>{w.title}</h4>
          <p className="description">{w.desc}</p>
          <div className="tags">{w.tags.map(t => <span key={t}>{t}</span>)}</div>
          <div className="metric"><span>↗</span>{w.metric}</div>
        </div>
      )}
    </article>
  );
}

/* ── Swipeable carousel wrapper (mobile only) ── */
function WorkCarousel({ children }) {
  return <div className="work-carousel">{children}</div>;
}

function Contact() {
  const [type, setType] = useState(contactTypes[0]);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const body = `Hi Abhay,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}`;
  return (
    <div className="contact-panel" id="contact">
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
            <button key={t} type="button" aria-pressed={type === t} className={'choice ' + (type === t ? 'active' : '')} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>Your name<input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ada Lovelace" /></label>
          <label>Your email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        </div>
        <label>Your message<textarea required rows="4" value={message} onChange={e => setMessage(e.target.value)} placeholder="Hey Abhay, I wanted to ask..." /></label>
        <button className="send" type="submit">Open email draft <Arrow /></button>
        <div className="flex justify-between gap-2 items-center">
          <small>Opens your email app. Nothing is submitted here.</small>
          <button type="button" className="copy" onClick={async () => { try { await navigator.clipboard.writeText(body); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Copied!' : 'Copy text'}</button>
        </div>
      </form>
    </div>
  );
}

function App() {
  return (
    <main className="shell">
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

      <section id="top" className="hero">
        <div className="hero-copy">
          <div className="kicker">HELLO, I'M</div>
          <h1>Abhay <em>Kumar.</em></h1>
          <div className="role">{meta.role}</div>
          <p className="intro">{meta.intro}</p>
          <div className="hero-actions">
            <a className="primary" href="#work">Explore my experience ↓</a>
            <a className="secondary" href={socials.find(s => s.label === 'LinkedIn').url} target="_blank" rel="noreferrer">LinkedIn <Arrow /></a>
          </div>
        </div>
        <aside className="identity">
          <img src="/avatar.png" alt={`${meta.name}'s professional portrait`} />
          <div>
            <span className="kicker">FIND ME ONLINE</span>
            <a href={meta.instagram} target="_blank" rel="noreferrer">@abhaycodess <Arrow /></a>
            <p>{meta.degree}</p>
          </div>
        </aside>
      </section>

      <section className="section" id="work">
        <div className="section-head">
          <div>
            <div className="kicker">01 / PROFESSIONAL BACKGROUND</div>
            <h2>Where I've <em>built.</em></h2>
          </div>
          <p>My experience across healthcare, music streaming and e-commerce.</p>
        </div>
        {/* Mobile: horizontal swipe carousel; Desktop: 2-col grid */}
        <WorkCarousel>
          {work.map((w, i) => <WorkCard key={w.company} w={w} defaultOpen={i === 0} />)}
        </WorkCarousel>
      </section>

      <section className="section">
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
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">03 / INDEPENDENT WORK</div>
            <h2>Beyond the <em>day job.</em></h2>
          </div>
          <a className="secondary" href={socials.find(s => s.label === 'GitHub').url} target="_blank" rel="noreferrer">GitHub <Arrow /></a>
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
      </section>

      <section className="statement">
        <span className="kicker">MY APPROACH TO TEACHING</span>
        <h2>Understand the why, <em>not just the answer.</em></h2>
        <p>Interview preparation should go beyond memorizing definitions. My goal is to make the concepts I use in real applications easier to understand, with practical examples and visual explanations.</p>
      </section>

      <NotesSection />

      <Contact />

      <footer>
        <div>
          <a className="wordmark" href="#top">{meta.name}<span className="accent">.</span></a>
          <p>Frontend engineer · B.Tech, {meta.college}</p>
        </div>
        <div className="socials">
          {socials.map(s => (
            <a href={s.url} key={s.label} target="_blank" rel="noreferrer">{s.label} <Arrow /></a>
          ))}
        </div>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
