const PROJECTS = [
  {
    slug: 'porto2026',
    period: '2025',
    sourceUrl: '',
    summary: "A portfolio built to perform, not just display — cinematic scroll, an editorial grid, and motion that earns its place. Designed and coded end-to-end in vanilla HTML/CSS/JS with GSAP.",
    subtitle: 'Qita by BRI',
    title: 'An Editorial Portfolio Built to Feel Alive',
    // shape drives BOTH the vertical card and the grid tile — one truth per project.
    // Curated so the infinite grid cycle mixes all three shapes.
    shape: 'is-square',
    color: 'linear-gradient(160deg,#9f4bed 0%,#7b49a9 100%)',
    media: {
      hero: 'assets/projects/Qita/qita-thumbnail.png',
      video: '',
      gallery: [
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/Qita/qita-1.png', alt: 'Qita by BRI showcase 1' }
          ]
        },
        {
          layout: 'split-square-left',
          items: [
            { src: 'assets/projects/Qita/qita-2.png', alt: 'Qita by BRI showcase 2' },
            { src: 'assets/projects/Qita/qita-3.png', alt: 'Qita by BRI showcase 3' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/Qita/qita-4.png', alt: 'Qita by BRI showcase 4' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/Qita/qita-5.png', alt: 'Qita by BRI showcase 5' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/Qita/qita-6.png', alt: 'Qita by BRI showcase 6' }
          ]
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/Qita/qita-7.png', alt: 'Qita by BRI showcase 7' }
          ]
        }
      ]
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
    hoverColor: '#BEFFF7', // soft blend over the animated thumbnail background
    hoverMotion: 0.55, // optional: 0 = static, higher = more movement
    hoverOpacity: 0.26, // optional: strength of the animated background
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
    slug: 'al-yasiniqu',
    period: '2025',
    sourceUrl: '',
    summary: "Case study coming soon.",
    subtitle: 'al-yasiniqu',
    title: 'al-yasiniqu',
    shape: 'is-square',
    color: 'linear-gradient(160deg,#58f0e0,#178b84)',
    media: {
      hero: 'assets/projects/Al Yasini/Al Yasini-thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/Al-yasini 1.png', alt: 'al-yasiniqu showcase 1' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 2.png', alt: 'al-yasiniqu showcase 2' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 3.png', alt: 'al-yasiniqu showcase 3' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 4.png', alt: 'al-yasiniqu showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 5.png', alt: 'al-yasiniqu showcase 5' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 6.png', alt: 'al-yasiniqu showcase 6' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'mytelkomsel-basic',
    period: '2025',
    sourceUrl: '',
    summary: "Case study coming soon.",
    subtitle: 'MyTelkomsel Basic',
    title: 'MyTelkomsel Basic',
    shape: 'is-square',
    color: 'linear-gradient(160deg,#58f0e0,#178b84)',
    media: {
      hero: 'assets/projects/MTB/MTB-Thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB1.png', alt: 'MyTelkomsel Basic showcase 1' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/MTB/MTB2.png', alt: 'MyTelkomsel Basic showcase 2' },
          { src: 'assets/projects/MTB/MTB3.png', alt: 'MyTelkomsel Basic showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB4.png', alt: 'MyTelkomsel Basic showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB5.png', alt: 'MyTelkomsel Basic showcase 5' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB6.png', alt: 'MyTelkomsel Basic showcase 6' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB-Thumbnail.png', alt: 'MyTelkomsel Basic showcase 7' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'mytelkomsel-app',
    period: '2025',
    sourceUrl: '',
    summary: "Case study coming soon.",
    subtitle: 'MyTelkomsel App',
    title: 'MyTelkomsel App',
    shape: 'is-portrait',
    color: 'linear-gradient(160deg,#58f0e0,#178b84)',
    media: {
      hero: 'assets/projects/MTA/MTA.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/MTA/MTA1.png', alt: 'MyTelkomsel App showcase 1' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/MTA/MTA2.png', alt: 'MyTelkomsel App showcase 2' },
          { src: 'assets/projects/MTA/MTA3.png', alt: 'MyTelkomsel App showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/MTA/MTA4.png', alt: 'MyTelkomsel App showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTA/MTA5.png', alt: 'MyTelkomsel App showcase 5' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'mytelkomsel-web',
    period: '2025',
    sourceUrl: '',
    summary: "Case study coming soon.",
    subtitle: 'MyTelkomsel Web',
    title: 'MyTelkomsel Web',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#58f0e0,#178b84)',
    media: {
      hero: 'assets/projects/MTW/MTW-Thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/MTW/MTW1.png', alt: 'MyTelkomsel Web showcase 1' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/MTW/MTW2.png', alt: 'MyTelkomsel Web showcase 2' },
          { src: 'assets/projects/MTW/MTW3.png', alt: 'MyTelkomsel Web showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/MTW/MTW4.png', alt: 'MyTelkomsel Web showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTW/MTW5.png', alt: 'MyTelkomsel Web showcase 5' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTW/MTW-Thumbnail.png', alt: 'MyTelkomsel Web showcase 6' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'maybank',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Maybank',
    title: 'Maybank',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#2db8a3,#1a7a6e)',
    media: {
      hero: 'assets/projects/Maybank/maybank-thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Maybank/maybank-1.png', alt: 'Maybank showcase 1' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Maybank/maybank-2.png', alt: 'Maybank showcase 2' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Maybank/maybank-3.png', alt: 'Maybank showcase 3' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'bri-tennis',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'BRI Tennis',
    title: 'BRI Tennis',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#1f65b7,#123b74)',
    media: {
      hero: 'assets/projects/BRI Tennis/BRI Tennis-thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/BRI Tennis/BRI Tennis1.png', alt: 'BRI Tennis showcase 1' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/BRI Tennis/BRI Tennis2.png', alt: 'BRI Tennis showcase 2' },
          { src: 'assets/projects/BRI Tennis/BRI Tennis3.png', alt: 'BRI Tennis showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/BRI Tennis/BRI Tennis4.png', alt: 'BRI Tennis showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/BRI Tennis/BRI Tennis5.png', alt: 'BRI Tennis showcase 5' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/BRI Tennis/BRI Tennis6.png', alt: 'BRI Tennis showcase 6' },
          { src: 'assets/projects/BRI Tennis/BRI Tennis8.png', alt: 'BRI Tennis showcase 8' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/BRI Tennis/BRI Tennis9.png', alt: 'BRI Tennis showcase 9' }] },
        { layout: 'full', items: [{ src: 'assets/projects/BRI Tennis/BRI Tennis10.png', alt: 'BRI Tennis showcase 10' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'mytutor-app',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'MyTutor App',
    title: 'MyTutor App',
    shape: 'is-portrait',
    color: 'linear-gradient(160deg,#32a8ff,#1764bd)',
    media: {
      hero: 'assets/projects/MyTutorApp/MyTutorApp-Thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorApp/MyTutorApp1.png', alt: 'MyTutor App showcase 1' }] },
        { layout: 'split-square-right', items: [
          { src: 'assets/projects/MyTutorApp/MyTutorApp2.png', alt: 'MyTutor App showcase 2' },
          { src: 'assets/projects/MyTutorApp/MyTutorApp3.png', alt: 'MyTutor App showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorApp/MyTutorApp4.png', alt: 'MyTutor App showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorApp/MyTutorApp5.png', alt: 'MyTutor App showcase 5' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'mytutor-web',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'MyTutor Web',
    title: 'MyTutor Web',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#32a8ff,#1764bd)',
    media: {
      hero: 'assets/projects/MyTutorWeb/MyTw-Thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw1.png', alt: 'MyTutor Web showcase 1' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw2.png', alt: 'MyTutor Web showcase 2' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw3.png', alt: 'MyTutor Web showcase 3' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw4.png', alt: 'MyTutor Web showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw5.png', alt: 'MyTutor Web showcase 5' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'mantisgo',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'MantisGo',
    title: 'MantisGo',
    shape: 'is-square',
    color: 'linear-gradient(160deg,#58f0e0,#178b84)',
    media: {
      hero: 'assets/projects/Mango/MANGO-Thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Mango/MANGO1.png', alt: 'MantisGo showcase 1' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/Mango/MANGO2.png', alt: 'MantisGo showcase 2' },
          { src: 'assets/projects/Mango/MANGO3.png', alt: 'MantisGo showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/Mango/MANGO4.png', alt: 'MantisGo showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Mango/MANGO5.png', alt: 'MantisGo showcase 5' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'mantishub',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'MantisHub',
    title: 'MantisHub',
    shape: 'is-landscape',
    color: 'linear-gradient(160deg,#4648bf,#24256f)',
    media: {
      hero: 'assets/projects/Mhub/MHUB-Thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Mhub/mhub1.png', alt: 'MantisHub showcase 1' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/Mhub/mhub2.png', alt: 'MantisHub showcase 2' },
          { src: 'assets/projects/Mhub/MHUB3.png', alt: 'MantisHub showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/Mhub/MHUB4.png', alt: 'MantisHub showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Mhub/MHUB5.png', alt: 'MantisHub showcase 5' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'fatberry',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Fatberry',
    title: 'Fatberry',
    shape: 'is-square',
    color: 'linear-gradient(160deg,#58f0e0,#178b84)',
    media: {
      hero: 'assets/projects/Fatberry/Fatberry-Thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Fatberry/Fatberry1.png', alt: 'Fatberry showcase 1' }] },
        { layout: 'split-square-right', items: [
          { src: 'assets/projects/Fatberry/Fatberry2.png', alt: 'Fatberry showcase 2' },
          { src: 'assets/projects/Fatberry/Fatberry3.png', alt: 'Fatberry showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/Fatberry/Fatberry4.png', alt: 'Fatberry showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Fatberry/Fatberry5.png', alt: 'Fatberry showcase 5' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  },
  {
    slug: 'adleesya',
    period: '2025',
    sourceUrl: '',
    summary: 'Case study coming soon.',
    subtitle: 'Adleesya',
    title: 'Adleesya',
    shape: 'is-square',
    color: 'linear-gradient(160deg,#8f72d8,#513696)',
    media: {
      hero: 'assets/projects/Adleesya/adleesya-thumbnail.png',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya1.png', alt: 'Adleesya showcase 1' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya2.png', alt: 'Adleesya showcase 2' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya3.png', alt: 'Adleesya showcase 3' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya4.png', alt: 'Adleesya showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya5.png', alt: 'Adleesya showcase 5' }] }
      ]
    },
    meta: { role: 'Design', client: '—', year: '2025' }
  }
];
