const PROJECTS = [
  {
    slug: 'porto2026',
    period: '2025',
    sourceUrl: '',
    summary: "A portfolio built to perform, not just display — cinematic scroll, an editorial grid, and motion that earns its place. Designed and coded end-to-end in vanilla HTML/CSS/JS with GSAP.",
    subtitle: 'Qita by BRI',
    title: 'An Editorial Portfolio Built to Feel Alive',
    // shape drives BOTH the vertical card and the grid tile — one truth per project.
    // Curated so every grid column (4×3 tiling) mixes all three shapes.
    shape: 'is-portrait',
    color: 'linear-gradient(160deg,#9f4bed 0%,#7b49a9 100%)',
    media: {
      hero: '',
      video: '',
      // grid shape: [{ src: '', caption: '' }, ...]
      grid: []
    },
    meta: {
      role: 'Design & Dev',
      client: 'Personal Project',
      year: '2025'
    }
  },
  {
    slug: 'byond',
    period: '2024',
    sourceUrl: '',
    summary: "BYOND by BSI is Bank Syariah Indonesia next-generation super app, introduced to provide a more modern and comprehensive experience beyond the previous BSI Mobile application. Bringing financial, social, and spiritual services into one platform, the revamp aimed to create a more inclusive and intuitive experience while setting a new benchmark for Islamic digital banking in Indonesia.\n\nAs the Product Designer, I was involved from the initial stages through the product’s public release, making this my first opportunity to take ownership of a large-scale banking application. The biggest challenge emerged during development, when additional edge cases and previously uncovered scenarios began to surface across multiple banking journeys. As the sole designer, I completed the end-to-end scenarios, resolved implementation gaps, and maintained consistency across the product through launch.",
    subtitle: 'BYOND\nby BSI',
    title: 'Redesigning Islamic Banking for Indonesia',
    shape: 'is-square', // hero asset is 1680×1680 — square is its native shape
    color: 'linear-gradient(160deg,#1c1c3e 0%,#0f0f2e 100%)',
    hoverColor: '#a9dcb8', // grid-view hover tint (soft green)
    media: {
      hero: 'assets/projects/byond/BYOND-Thumbnail.png',
      video: 'assets/projects/byond/byond-showcase.mp4',
      // Add, remove, or reorder gallery sections here. Available layouts:
      // full | split-square-left | split-square-right
      // Split items are always written in visual order: left, then right.
      gallery: [
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/byond/BYOND-1.png', alt: 'BYOND showcase 1' }
          ]
        },
        {
          layout: 'split-square-left',
          items: [
            { src: 'assets/projects/byond/BYOND-2.png', alt: 'BYOND showcase 2' },
            { src: 'assets/projects/byond/BYOND-3.png', alt: 'BYOND showcase 3' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/byond/Byond-4.png', alt: 'BYOND showcase 4' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/byond/Byond-6.png', alt: 'BYOND showcase 6' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/byond/BYOND-7.png', alt: 'BYOND showcase 7' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/byond/BYOND-8.png', alt: 'BYOND showcase 8' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/byond/BYOND-9.png', alt: 'BYOND showcase 9' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/byond/BYOND-10.png', alt: 'BYOND showcase 10' }
          ]
        }
      ]
    },
    meta: {
      role: 'Product Designer',
      client: 'PT Bank Syariah Indonesia',
      year: '2024'
    }
  },
  {
    slug: 'project-03',
    period: '2025',
    sourceUrl: '',
    summary: "Case study coming soon.",
    subtitle: 'Project 03',
    title: 'Coming Soon',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#e05c45,#a03020)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-04',
    period: '2025',
    sourceUrl: '',
    summary: "Case study coming soon.",
    subtitle: 'Project 04',
    title: 'Coming Soon',
    shape: 'is-portrait',
    color: 'linear-gradient(160deg,#2db8a3,#1a7a6e)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-05',
    period: '2025',
    sourceUrl: '',
    summary: "Case study coming soon.",
    subtitle: 'Project 05',
    title: 'Coming Soon',
    shape: 'is-square',
    color: 'linear-gradient(160deg,#4b63e8,#2a3db0)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-06',
    period: '2025',
    sourceUrl: '',
    summary: "Case study coming soon.",
    subtitle: 'Project 06',
    title: 'Coming Soon',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#e8a52b,#b07815)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-07',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Project 07',
    title: 'Coming Soon',
    shape: 'is-portrait',
    color: 'linear-gradient(160deg,#e8578f,#a02560)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-08',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Project 08',
    title: 'Coming Soon',
    shape: 'is-square',
    color: 'linear-gradient(160deg,#57c1e8,#2568a0)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-09',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Project 09',
    title: 'Coming Soon',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#8fe857,#4ea020)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-10',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Project 10',
    title: 'Coming Soon',
    shape: 'is-portrait',
    color: 'linear-gradient(160deg,#b457e8,#6a20a0)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-11',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Project 11',
    title: 'Coming Soon',
    shape: 'is-square',
    color: 'linear-gradient(160deg,#e8d557,#a08c20)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'project-12',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Project 12',
    title: 'Coming Soon',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#e87b57,#a04020)',
    media: {},
    meta: { role: 'Design', client: '—', year: '2025' }
  }
];
