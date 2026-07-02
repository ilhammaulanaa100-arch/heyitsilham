const PROJECTS = [
  {
    slug: 'porto2026',
    category: 'PERSONAL',
    period: '2025',
    sourceUrl: '',
    subtitle: 'heyitsilham',
    title: 'An Editorial Portfolio Built to Feel Alive',
    color: 'linear-gradient(160deg,#9f4bed 0%,#7b49a9 100%)',
    media: {
      hero: '',
      video: '',
      fullImage: '',
      // grid shape: [{ src: '', caption: '' }, ...]
      grid: []
    },
    meta: {
      timeline: '3 Month',
      role: 'Design & Dev',
      client: 'Personal Project',
      year: '2025'
    },
    tldr: {
      title: "A portfolio that doesn't just show work — it performs it.",
      intro: "Designed and built end-to-end. Every interaction was considered, every transition earned.",
      bullets: [
        '🎨   Designed the full editorial experience with cinematic scroll interactions and a right-side slider.',
        '💻   Built in vanilla HTML/CSS/JS with GSAP — no frameworks, maximum control.',
        '🎯   Made the portfolio itself feel like the work it contains.'
      ]
    },
    body: [
      "Most portfolios are galleries. This one is a performance. I wanted every visitor to feel the quality of thought before they read a single word — so the structure, the pacing, and the motion all had to carry meaning. The editorial grid isn't decorative; it mirrors the way I think about design: deliberate, layered, and never arbitrary.",
      "I built the entire thing in vanilla HTML, CSS, and JavaScript with GSAP handling the heavier animation work. No frameworks, no build pipeline, just direct control over every pixel and every millisecond. That constraint turned out to be the point — when you can't reach for an abstraction, you're forced to understand exactly what you're building.",
      "The hardest design problem wasn't motion — it was restraint. My first drafts were too alive. Too many transitions competing for attention, too many moments trying to be the most memorable one. Stripping back to only the interactions that truly earned their place took longer than building them in the first place.",
      "Shipping it taught me more than any planning phase could. Seeing it run on different screens, in different browsers, under different lighting conditions — that feedback loop sharpened my eye for details I'd never have caught in Figma. The portfolio is, in a way, the best argument I can make for my own process."
    ],
    reflections: {
      title: 'What building this taught me about craft:',
      items: [
        { heading: '🎭 Restraint is the hardest skill', body: "Every interaction I didn't add made the ones I kept more meaningful." },
        { heading: '⚡ Performance is design', body: 'When animations stutter, design fails. Performance and aesthetics are inseparable.' },
        { heading: '🔁 Iteration over perfection', body: 'Shipping the first version taught me more than planning the perfect one.' }
      ]
    }
  },
  {
    slug: 'byond',
    category: 'PRODUCT',
    period: '2024',
    sourceUrl: '',
    subtitle: 'BYOND by BSI',
    title: 'Redesigning Islamic Banking for Indonesia',
    color: 'linear-gradient(160deg,#1c1c3e 0%,#0f0f2e 100%)',
    hoverColor: '#a9dcb8', // grid-view hover tint (soft green)
    media: {
      hero: 'assets/projects/byond/byond-thumbnail.png',
      video: 'assets/projects/byond/byond-showcase.mp4',
      fullImage: '',
      // grid shape: [{ src: '', caption: '' }, ...]
      grid: []
    },
    meta: {
      timeline: '12 Month',
      role: 'Product Designer',
      client: 'PT Bank Syariah Indonesia',
      year: '2024'
    },
    tldr: {
      title: "BYOND isn't just BSI's new app. It's a rethink of what Islamic banking can feel like.",
      intro: "From day one, I owned the end-to-end product experience — handling Research, Product Design, Developer Handoff, and Stakeholder Presentations.\nI oversaw the design quality of all shipped features, focusing on:",
      bullets: [
        '🎨   Designed the full end-to-end experience of BYOND, from onboarding to daily transactions, across every screen a user would touch',
        '🧩   Built and contributed to the design system, making sure every component scaled consistently across the entire product.',
        '🎯   Collaborated across business, client, and development teams, bridging the gap between what users needed and what stakeholders wanted.'
      ]
    },
    body: [
      "Islamic banking in Indonesia carries a dual obligation: it has to be religiously compliant and commercially competitive at the same time. BYOND was BSI's answer to that tension — a mobile banking product built from the ground up to feel modern without compromising the trust that comes from its Syariah foundation. My role was to make sure design held both of those things together across every screen.",
      "I owned the product experience end-to-end for over a year — from early discovery and user research through to final handoff and developer QA. That meant running sessions with real users, mapping pain points in the existing BSI app, and translating those findings into flows that were both intuitive and compliant with product requirements coming from multiple stakeholder tiers. Every feature I touched had to survive a room full of business, legal, and technical reviewers before it reached a user.",
      "The design system work was where I could feel the long-term leverage most clearly. Building a consistent component library meant that every new feature started from a shared foundation rather than a blank canvas. It compressed handoff time, reduced design drift between screens, and gave developers a single source of truth. Maintaining that system while simultaneously shipping new features — without letting one compromise the other — was the operational challenge that taught me the most about working at product scale.",
      "What BYOND reinforced is that the hardest design problems are organizational, not visual. Getting alignment across directors, product managers, engineers, and compliance officers requires a presentation layer that's as well-crafted as the product itself. I learned to treat every stakeholder meeting as a design problem: what does this audience need to see in order to say yes, and how do I make that case without watering down the user-first thinking behind it?"
    ],
    reflections: {
      title: 'What I actually learned from Crafting this product:',
      items: [
        { heading: '💠 Design Presentation', body: "Technical skills mean nothing if you can't present your ideas well and get cross-team buy-in." },
        { heading: '⚖️ Finding the middle ground', body: 'I learned how to smartly balance ideal UX with strict, high-level demands from the director level.' },
        { heading: '🧠 Critical decision-making', body: 'I learned how to apply critical thinking quickly to make and back up solid design decisions under pressure.' }
      ]
    }
  },
  {
    slug: 'project-03',
    category: 'COMING SOON',
    period: '2025',
    sourceUrl: '',
    subtitle: 'Project 03',
    title: 'Coming Soon',
    color: 'linear-gradient(160deg,#e05c45,#a03020)',
    media: {},
    meta: { timeline: '—', role: 'Design', client: '—', year: '2025' },
    tldr: {
      title: 'Case study coming soon.',
      intro: 'This placeholder represents an upcoming project. The full story — research, process, and outcomes — will be published here.',
      bullets: []
    },
    body: ['Case study coming soon.'],
    reflections: { title: '', items: [] }
  },
  {
    slug: 'project-04',
    category: 'COMING SOON',
    period: '2025',
    sourceUrl: '',
    subtitle: 'Project 04',
    title: 'Coming Soon',
    color: 'linear-gradient(160deg,#2db8a3,#1a7a6e)',
    media: {},
    meta: { timeline: '—', role: 'Design', client: '—', year: '2025' },
    tldr: {
      title: 'Case study coming soon.',
      intro: 'This placeholder represents an upcoming project.',
      bullets: []
    },
    body: ['Case study coming soon.'],
    reflections: { title: '', items: [] }
  },
  {
    slug: 'project-05',
    category: 'COMING SOON',
    period: '2025',
    sourceUrl: '',
    subtitle: 'Project 05',
    title: 'Coming Soon',
    color: 'linear-gradient(160deg,#4b63e8,#2a3db0)',
    media: {},
    meta: { timeline: '—', role: 'Design', client: '—', year: '2025' },
    tldr: {
      title: 'Case study coming soon.',
      intro: 'This placeholder represents an upcoming project.',
      bullets: []
    },
    body: ['Case study coming soon.'],
    reflections: { title: '', items: [] }
  },
  {
    slug: 'project-06',
    category: 'COMING SOON',
    period: '2025',
    sourceUrl: '',
    subtitle: 'Project 06',
    title: 'Coming Soon',
    color: 'linear-gradient(160deg,#e8a52b,#b07815)',
    media: {},
    meta: { timeline: '—', role: 'Design', client: '—', year: '2025' },
    tldr: {
      title: 'Case study coming soon.',
      intro: 'This placeholder represents an upcoming project.',
      bullets: []
    },
    body: ['Case study coming soon.'],
    reflections: { title: '', items: [] }
  }
];
