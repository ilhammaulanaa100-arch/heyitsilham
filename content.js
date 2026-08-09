const PROJECTS = [
  {
    slug: 'porto2026',
    period: '2025',
    sourceUrl: 'https://apps.apple.com/id/app/qita-by-bri/id6747552980',
    summary: "Qita by BRI is a financial super app designed to simplify everyday banking and provide broader access to modern financial services. The platform brings together account onboarding, transfers, payments, purchases, investments, insurance, bill reminders, and card access within one integrated experience, helping users manage both their daily transactions and their financial future.\n\nI joined the project midway as the Squad Captain, leading the Daily Banking and Customer Assistance streams. My role involved improving the squad's workflow, maintaining design quality, and helping collaboration between the squad's product, engineering, and research teams. Within only three months to complete the full application revamp, I also stepped in to handle unassigned tasks and close critical design gaps to keep the project moving forward.",
    subtitle: 'Qita by BRI',
    title: 'One App for Every Financial Move, #IniCaraQita',
    // shape drives BOTH the vertical card and the grid tile — one truth per project.
    // Curated so the infinite grid cycle mixes all three shapes.
    shape: 'is-square',
    media: {
      hero: 'assets/projects/Qita/qita-thumbnail.jpg',
      videoAfterGallery: 'assets/projects/Qita/QITA.mp4',
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
        },
        {
          layout: 'full',
          items: [
            { src: 'assets/projects/Qita/qita-8.png', alt: 'Qita by BRI showcase 8' }
          ]
        }
      ]
    },
    meta: {
      role: 'Lead Squad Designer',
      client: 'Bank Rakyat Indonesia (BRI)',
      year: '2025'
    }
  },
  {
    slug: 'byond',
    period: '2024',
    sourceUrl: 'https://apps.apple.com/id/app/byond-by-bsi/id6444697752',
    summary: "BYOND by BSI is Bank Syariah Indonesia next-generation super app, introduced to provide a more modern and comprehensive experience beyond the previous BSI Mobile application. Bringing financial, social, and spiritual services into one platform, the revamp aimed to create a more inclusive and intuitive experience while setting a new benchmark for Islamic digital banking in Indonesia.\n\nAs the Product Designer, I was involved from the initial stages through the product’s public release, making this my first opportunity to take ownership of a large-scale banking application. The biggest challenge emerged during development, when additional edge cases and previously uncovered scenarios began to surface across multiple banking journeys. As the sole designer, I completed the end-to-end scenarios, resolved implementation gaps, and maintained consistency across the product through launch.",
    subtitle: 'BYOND\nby BSI',
    title: 'A New Chapter for Islamic Banking in Indonesia',
    shape: 'is-square', // hero asset is 1680×1680 — square is its native shape
    hoverColor: '#BEFFF7', // soft blend over the animated thumbnail background
    hoverMotion: 0.55, // optional: 0 = static, higher = more movement
    hoverOpacity: 0.26, // optional: strength of the animated background
    media: {
      hero: 'assets/projects/byond/BYOND-Thumbnail.jpg',
      videoAfterGallery: 'assets/projects/byond/byond-showcase.mp4',
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
      client: 'Bank Syariah Indonesia (BSI)',
      year: '2024'
    }
  },
  {
    slug: 'al-yasiniqu',
    period: '2021',
    sourceUrl: 'https://apps.apple.com/id/app/al-yasiniqu/id1611532011',
    summary: "Al-YasiniQu is an integrated digital ecosystem created to modernize the pesantren experience from traditional learning to financial services. The platform brings together financial services, Islamic services, education, and other essential features to simplify daily operations for students, santri, and their communities.\n\nDeveloped as a freelance project within a highly compressed three-week design timeline, the platform was built to balance practical needs with a clear, accessible product experience. The platform is now live on the Google Play Store and has been adopted by more than 50 pesantren across Indonesia.",
    subtitle: 'Al-YasiniQu',
    title: 'Digitizing the Pesantren Ecosystem',
    shape: 'is-square',
    media: {
      hero: 'assets/projects/Al Yasini/Al Yasini-thumbnail.jpg',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/Al-yasini 1.png', alt: 'Al-YasiniQu showcase 1' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 2.png', alt: 'Al-YasiniQu showcase 2' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 3.png', alt: 'Al-YasiniQu showcase 3' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 4.png', alt: 'Al-YasiniQu showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 5.png', alt: 'Al-YasiniQu showcase 5' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Al Yasini/al yasini 6.png', alt: 'Al-YasiniQu showcase 6' }] }
      ]
    },
    meta: { role: 'Product Designer', client: 'PT Solusi Infotech Semesta Indonesia (SESTA)', year: '2021' }
  },
  {
    slug: 'mytelkomsel-basic',
    period: '2025',
    sourceUrl: 'https://apps.apple.com/id/app/mytelkomsel-basic/id6502852832',
    summary: "MyTelkomsel Basic is a lightweight alternative to the main MyTelkomsel application, designed around SELF principles: Simple, Efficient, Lightweight, and Fast. It was built to give customers access to essential account information, purchasing, and basic connectivity services without the complexity of a full-featured app.\n\nAs the Product Designer, I owned the end-to-end experience from early exploration through launch, translating a lean product strategy into a clear and accessible interface. The result was a more focused experience for customers with simpler needs.",
    subtitle: 'MyTelkomsel Basic',
    title: 'A Lightweight Multitask, Made for Everyone',
    shape: 'is-square',
    media: {
      hero: 'assets/projects/MTB/MTB-Thumbnail.jpg',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB1.png', alt: 'MyTelkomsel Basic showcase 1' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/MTB/MTB2.png', alt: 'MyTelkomsel Basic showcase 2' },
          { src: 'assets/projects/MTB/MTB3.png', alt: 'MyTelkomsel Basic showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB4.png', alt: 'MyTelkomsel Basic showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB5.png', alt: 'MyTelkomsel Basic showcase 5' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB6.png', alt: 'MyTelkomsel Basic showcase 6' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTB/MTB7.png', alt: 'MyTelkomsel Basic showcase 8' }] }
      ]
    },
    meta: { role: 'Lead Designer', client: 'Telkomsel', year: '2025' }
  },
  {
    slug: 'mytelkomsel-app',
    period: '2025',
    sourceUrl: 'https://apps.apple.com/id/app/mytelkomsel/id651412430',
    summary: "MyTelkomsel App is an all-in-one digital platform that enables customers to manage Telkomsel, IndiHome, and Orbit services within a single application. Beyond checking account information and purchasing mobile packages, the platform also brings together entertainment, financial, and customer service features.\n\nDuring the first three months of Aleph's collaboration with Telkomsel, I joined the squad and drove the journey's navigation and visual design, helping align teams across technical and business constraints while delivering a consistent experience across the broader MyTelkomsel ecosystem.",
    subtitle: 'MyTelkomsel App',
    title: 'MyTelkomsel, Built Around Discovery',
    shape: 'is-portrait',
    media: {
      hero: 'assets/projects/MTA/MTA.jpg',
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
    meta: { role: 'Lead Designer', client: 'Telkomsel', year: '2025' }
  },
  {
    slug: 'mytelkomsel-web',
    period: '2024',
    sourceUrl: 'https://www.telkomsel.com/',
    summary: "Telkomsel is one of Indonesia's leading telecommunications companies, providing connectivity and digital services to millions of customers nationwide. In this project, I was responsible for the end-to-end experience of Telkomsel website and its supporting merchant portal, ensuring both platforms delivered a clear, consistent, and connected digital experience.\n\nAs the Lead Designer, I worked closely with four designers, the Project Manager, and the Product team to coordinate the overall experience and close critical gaps across the platform.",
    subtitle: 'MyTelkomsel Web',
    title: "Redesigning Telkomsel's Web Experience",
    shape: 'is-landscape',
    media: {
      hero: 'assets/projects/MTW/MTW-Thumbnail.jpg',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/MTW/MTW1.png', alt: 'MyTelkomsel Web showcase 1' }] },
        { layout: 'split-square-left', items: [
          { src: 'assets/projects/MTW/MTW2.png', alt: 'MyTelkomsel Web showcase 2' },
          { src: 'assets/projects/MTW/MTW3.png', alt: 'MyTelkomsel Web showcase 3' }
        ] },
        { layout: 'full', items: [{ src: 'assets/projects/MTW/MTW4.png', alt: 'MyTelkomsel Web showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTW/MTW5.png', alt: 'MyTelkomsel Web showcase 5' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MTW/MTW6.png', alt: 'MyTelkomsel Web showcase 6' }] }
      ]
    },
    meta: { role: 'Lead Designer', client: 'Telkomsel', year: '2024' }
  },
  {
    slug: 'maybank',
    period: '2025',
    sourceUrl: '',
    summary: "Maybank Indonesia is one of Indonesia's leading private banks and part of the Maybank Group, one of the largest financial services groups in ASEAN. Through this website, the bank provides access to a broad range of products, including savings, financing, credit cards, investments, and other financial solutions.\n\nAs the designer, I helped focus on improving the Maybank Indonesia website after nearly a decade without a major redesign. The goal was to refresh its visual language and create a clearer, more intuitive experience for customers navigating the bank's extensive range of services.",
    subtitle: 'Maybank',
    title: 'Building a New Digital Experience to Maybank Indonesia',
    shape: 'is-landscape',
    media: {
      hero: 'assets/projects/Maybank/maybank-thumbnail.jpg',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Maybank/maybank-1.png', alt: 'Maybank showcase 1' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Maybank/maybank-2.png', alt: 'Maybank showcase 2' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Maybank/maybank-3.png', alt: 'Maybank showcase 3' }] }
      ]
    },
    meta: { role: 'Lead Designer', client: 'Maybank Indonesia', year: '2025' }
  },
  {
    slug: 'bri-tennis',
    period: '2024',
    sourceUrl: '',
    summary: "Deuce Blue Rally was an internal tennis event between Aleph and BRI, created to bring both teams together outside the usual project setting. I developed the event identity and applied it across match-day collateral, including jerseys, towels, tote bags, tumblers, power banks, medals, backdrops, and other event materials.",
    subtitle: 'BRI Tennis',
    title: 'Connecting Beyond the Office',
    titleLines: ['Connecting Beyond', 'the Office'],
    shape: 'is-landscape',
    media: {
      hero: 'assets/projects/BRI Tennis/BRI Tennis-thumbnail.jpg',
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
    meta: { role: 'Branding', client: 'Aleph, BRI', year: '2024' }
  },
  {
    slug: 'mytutor-app',
    period: '2022',
    sourceUrl: 'https://play.google.com/store/apps/details?id=my.mytutor.tutor&hl=en',
    summary: "MyTutor App is a mobile platform designed to help tutors manage their teaching activities more efficiently. It provides direct access to available tutoring opportunities, schedules, payment information, and other essential resources through a more convenient mobile experience.\n\nAs part of my role with MyTutor, I designed the app to translate the platform's core tutor workflow into a clear and accessible interface. The experience enables tutors to manage opportunities, relationships, and teaching activities directly from their mobile devices.",
    subtitle: 'MyTutor App',
    title: 'One App for Every Side of Tutoring',
    titleLines: ['One App for Every Side', 'of Tutoring'],
    shape: 'is-portrait',
    media: {
      hero: 'assets/projects/MyTutorApp/MyTutorApp-Thumbnail.jpg',
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
    meta: { role: 'Product Designer', client: 'MyTutor.com', year: '2022' }
  },
  {
    slug: 'mytutor-web',
    period: '2022',
    sourceUrl: 'https://mytutor.my/',
    summary: "MyTutor Web is a Malaysia-based EdTech platform that connects students and parents with verified tutors for personalized one-to-one and online learning. The platform helps families find tutoring for subjects and learning levels while simplifying scheduling tools for both parents and tutors.\n\nAs part of my role with MyTutor, I designed the learning and purchasing experience, focusing on clearer navigation, reduced friction, and stronger alignment between parents, tutors, and students.",
    subtitle: 'MyTutor Web',
    title: 'A Shared Space for Tutors and Parents',
    titleLines: ['A Shared Space for', 'Tutors and Parents'],
    shape: 'is-landscape',
    media: {
      hero: 'assets/projects/MyTutorWeb/MyTw-Thumbnail.jpg',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw1.png', alt: 'MyTutor Web showcase 1' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw2.png', alt: 'MyTutor Web showcase 2' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw3.png', alt: 'MyTutor Web showcase 3' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw4.png', alt: 'MyTutor Web showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/MyTutorWeb/MyTw5.png', alt: 'MyTutor Web showcase 5' }] }
      ]
    },
    meta: { role: 'Product Designer', client: 'MyTutor.com', year: '2022' }
  },
  {
    slug: 'mantisgo',
    period: '2021',
    sourceUrl: 'https://play.google.com/store/apps/details?id=com.mantisgo&hl=id',
    summary: "Mandala is an internal application designed for Mandala Finance's field collection team, helping employees manage daily operational tasks more efficiently. The platform enables users to review customer visit lists, track assigned activities, and access the information needed to plan and complete field collections.\n\nAs the Product Designer, I collaborated with multiple squads and remained involved throughout the product development process. I was responsible for reducing friction in the payment flow, improving the end-to-end experience, coordinating usability testing with users, and designing directly in Figma to ensure the product remained aligned with the intended experience.",
    subtitle: 'MantisGo',
    title: 'The Workday, Built for the Field',
    titleLines: ['The Workday,', 'Built for the Field'],
    shape: 'is-square',
    media: {
      hero: 'assets/projects/Mango/MANGO-Thumbnail.jpg',
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
    meta: { role: 'Product Designer', client: 'PT Mandala Multifinance tbk (now Adira Finance)', year: '2021' }
  },
  {
    slug: 'mantishub',
    period: '2021',
    sourceUrl: '',
    summary: "MantisHub is an internal administrative dashboard designed to support Mandala Finance's daily operations across multiple organizational roles, from administrators and branch heads to provincial managers. The platform centralizes key workflows such as reviewing customer applications, monitoring billing information, accessing operational data, and managing multiple field-team workflows.\n\nMy role focused on translating complex operational processes into structured and scalable digital workflows. I worked closely with stakeholders and cross-functional teams to improve approval flows, simplify data entry, and maintain a consistent experience across various user groups.",
    subtitle: 'MantisHub',
    title: 'One Hub for Every Role',
    shape: 'is-landscape',
    media: {
      hero: 'assets/projects/Mhub/MHUB-Thumbnail.jpg',
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
    meta: { role: 'Product Designer', client: 'PT Mandala Multifinance tbk (now Adira Finance)', year: '2021' }
  },
  {
    slug: 'fatberry',
    period: '2020',
    sourceUrl: 'https://www.fatberry.com/',
    summary: "Fatberry is a Malaysia-based insurance platform offering accessible protection products, including car and motorcycle insurance. The platform provides an end-to-end experience for customers, from getting a quote to comparing and purchasing coverage, while making insurance easier to understand and navigate.\n\nI collaborated closely with stakeholders to define the user journey, improve information architecture, and translate complex insurance terms into an approachable experience. The result was a clearer, more confident flow for users exploring their options.",
    subtitle: 'Fatberry',
    title: 'The Brighter Side of Insurance',
    titleLines: ['The Brighter Side', 'of Insurance'],
    shape: 'is-square',
    media: {
      hero: 'assets/projects/Fatberry/Fatberry-Thumbnail.jpg',
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
    meta: { role: 'Product Designer', client: 'Fatberry Sdn. Bhd.', year: '2020' }
  },
  {
    slug: 'adleesya',
    period: '2021',
    sourceUrl: '',
    summary: "Adleesya is an online marketplace that brings together beauty products through a growing sales and distributor network. Beyond serving customers, the brand also provides business opportunities for sales representatives and registered distributors across several Southeast Asian markets.\n\nAs part of my role at PrimaCloud Solutions, I contributed to a product initiative that supported Adleesya's sales network. The experience helped streamline product discovery, improve distributor management, and create a clearer path to customer acquisition and marketplace growth.",
    subtitle: 'Adleesya',
    title: 'Beauty Sales, All in One Place',
    titleLines: ['Beauty Sales,', 'All in One Place'],
    shape: 'is-square',
    media: {
      hero: 'assets/projects/Adleesya/adleesya-thumbnail.jpg',
      gallery: [
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya1.png', alt: 'Adleesya showcase 1' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya2.png', alt: 'Adleesya showcase 2' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya3.png', alt: 'Adleesya showcase 3' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya4.png', alt: 'Adleesya showcase 4' }] },
        { layout: 'full', items: [{ src: 'assets/projects/Adleesya/adleesya5.png', alt: 'Adleesya showcase 5' }] }
      ]
    },
    meta: { role: 'Product Designer', client: 'PrimaCloud Solutions Sdn Bhd', year: '2021' }
  }
];
