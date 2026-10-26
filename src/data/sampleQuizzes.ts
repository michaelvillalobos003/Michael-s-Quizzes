import { Quiz } from '../types/quiz';

export const SAMPLE_QUIZZES: Quiz[] = [
  {
    id: 'quiz-web-dev',
    title: 'Full-Stack Web Dev & Tech Trivia',
    description: 'Test your knowledge on modern JavaScript, browser internals, CSS quirks, and web protocols.',
    category: 'Tech',
    difficulty: 'medium',
    timeLimitSeconds: 20,
    createdAt: '2025-01-15T00:00:00.000Z',
    questions: [
      {
        id: 'q1',
        question: 'Which HTTP status code signifies that a server understood the request but refuses to authorize it?',
        options: ['401 Unauthorized', '403 Forbidden', '405 Method Not Allowed', '422 Unprocessable Entity'],
        correctIndex: 1,
        explanation: '403 Forbidden means the server understands who you are or what is requested, but access is explicitly denied. 401 Unauthorized means lack of valid authentication credentials.'
      },
      {
        id: 'q2',
        question: 'In the JavaScript Event Loop, which queue is checked first after the currently executing call stack clears?',
        options: ['Macrotask queue (setTimeout, setInterval)', 'Microtask queue (Promise callbacks, queueMicrotask)', 'Animation frame callbacks', 'I/O callbacks queue'],
        correctIndex: 1,
        explanation: 'The microtask queue has strict priority over macrotasks. All microtasks are resolved right after the current execution context completes before moving to macrotasks.'
      },
      {
        id: 'q3',
        question: 'Which CSS property creates a new stacking context for child elements without altering layout positioning?',
        options: ['display: flex', 'isolation: isolate', 'overflow: hidden', 'box-sizing: border-box'],
        correctIndex: 1,
        explanation: 'The `isolation: isolate` property is explicitly designed to establish a new stacking context without needing z-index hacks or relative positioning.'
      },
      {
        id: 'q4',
        question: 'What is the primary difference between `null` and `undefined` in JavaScript?',
        options: [
          'They are identical in both strict (===) and loose (==) equality',
          'null represents intentional absence of an object value, while undefined means a variable has been declared but not assigned',
          'undefined is an object while null is a primitive type',
          'null can only be assigned to numerical properties'
        ],
        correctIndex: 1,
        explanation: '`null` is an intentional assignment indicating "no value", whereas `undefined` is the default state of unassigned variables or missing object properties.'
      },
      {
        id: 'q5',
        question: 'In Git, what does `git cherry-pick <commit-hash>` do?',
        options: [
          'Deletes the specified commit from remote history',
          'Applies the changes introduced by an existing commit onto the current branch as a new commit',
          'Merges all commits from the source branch without creating a merge commit',
          'Reverts the changes made by the specified commit'
        ],
        correctIndex: 1,
        explanation: '`git cherry-pick` takes the patch introduced by a specific commit from any branch and applies it onto the current HEAD as a fresh commit.'
      }
    ]
  },
  {
    id: 'quiz-geography',
    title: 'World Wonders & Geography Challenge',
    description: 'Explore global capitals, remote territories, iconic natural landmarks, and geographic superlatives.',
    category: 'Geography',
    difficulty: 'easy',
    timeLimitSeconds: 25,
    createdAt: '2025-01-20T00:00:00.000Z',
    questions: [
      {
        id: 'g1',
        question: 'What is the capital city of Australia?',
        options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
        correctIndex: 2,
        explanation: 'Canberra was chosen as the compromise capital of Australia in 1908 to settle the rivalry between Sydney and Melbourne.'
      },
      {
        id: 'g2',
        question: 'Which is the world’s deepest terrestrial lake, containing approximately 20% of Earth’s unfrozen surface fresh water?',
        options: ['Lake Superior', 'Lake Baikal', 'Lake Tanganyika', 'Lake Victoria'],
        correctIndex: 1,
        explanation: 'Lake Baikal in Siberia, Russia, plunges to a maximum depth of 1,642 meters (5,387 ft) and is also considered the oldest freshwater lake on Earth.'
      },
      {
        id: 'g3',
        question: 'Which country spans the most contiguous time zones across its mainland landmass without counting overseas territories?',
        options: ['Canada', 'Russia', 'United States', 'China'],
        correctIndex: 1,
        explanation: 'Russia spans 11 consecutive time zones from Kaliningrad in the west to Kamchatka in the far east.'
      },
      {
        id: 'g4',
        question: 'The historic ancient city of Petra, famous for rock-cut architecture, is located in which modern nation?',
        options: ['Jordan', 'Egypt', 'Turkey', 'Lebanon'],
        correctIndex: 0,
        explanation: 'Petra is an archaeological wonder located in southwestern Jordan, carved into vibrant sandstone cliffs by the Nabataeans.'
      },
      {
        id: 'g5',
        question: 'What is the only continent on Earth that contains no active native desert regions?',
        options: ['South America', 'Europe', 'Australia', 'Antarctica'],
        correctIndex: 1,
        explanation: 'While Europe has semi-arid arid steppes in parts of Spain, it is traditionally categorized by physical geographers as the only continent devoid of a true continental desert.'
      }
    ]
  },
  {
    id: 'quiz-science',
    title: 'Cosmos, Physics & Quantum Mysteries',
    description: 'Probe fundamental particles, cosmological phenomena, astrophysics, and revolutionary scientific milestones.',
    category: 'Science',
    difficulty: 'hard',
    timeLimitSeconds: 30,
    createdAt: '2025-02-01T00:00:00.000Z',
    questions: [
      {
        id: 's1',
        question: 'What is the theoretical boundary around a black hole beyond which nothing, not even light, can escape?',
        options: ['Accretion disk', 'Ergosphere', 'Event horizon', 'Schwarzschild singularity'],
        correctIndex: 2,
        explanation: 'The event horizon is the outer boundary where the escape velocity strictly equals the speed of light in vacuum.'
      },
      {
        id: 's2',
        question: 'Which subatomic particle was discovered at CERN in 2012, confirming the mechanism by which fundamental particles acquire mass?',
        options: ['Higgs boson', 'Top quark', 'Tau neutrino', 'Gluon'],
        correctIndex: 0,
        explanation: 'The Higgs boson is the quantum excitation of the Higgs field, through which gauge bosons and fermions gain mass via electroweak symmetry breaking.'
      },
      {
        id: 's3',
        question: 'Which element possesses the highest electrical conductivity of any metal at standard room temperature?',
        options: ['Gold', 'Copper', 'Silver', 'Platinum'],
        correctIndex: 2,
        explanation: 'Silver has the highest electrical and thermal conductivity of all metals, followed closely by copper and gold.'
      },
      {
        id: 's4',
        question: 'Roughly how long does it take for a photon produced in the core of our Sun to reach Earth’s surface once emitted from the solar photosphere?',
        options: ['8 minutes and 20 seconds', '1.3 seconds', '42 seconds', '3 hours'],
        correctIndex: 0,
        explanation: 'Light takes roughly 8 minutes and 20 seconds to travel 150 million km from the Sun’s outer photosphere to Earth (though inside the core, energy takes tens of thousands of years to radiate out).'
      }
    ]
  },
  {
    id: 'quiz-pop-culture',
    title: 'Cinema, Music & Entertainment Trivia',
    description: 'From iconic Hollywood blockbusters to musical milestones and Oscar trivia.',
    category: 'Pop Culture',
    difficulty: 'medium',
    timeLimitSeconds: 20,
    createdAt: '2025-02-10T00:00:00.000Z',
    questions: [
      {
        id: 'p1',
        question: 'Which film was the first in history to win the "Big Five" Academy Awards (Picture, Director, Actor, Actress, Screenplay)?',
        options: ['Gone with the Wind', 'It Happened One Night (1934)', 'Casablanca', 'The Godfather'],
        correctIndex: 1,
        explanation: 'Frank Capra’s 1934 romantic comedy "It Happened One Night" starring Clark Gable and Claudette Colbert was the first ever to sweep all five top Oscar categories.'
      },
      {
        id: 'p2',
        question: 'Who composed the unforgettable cinematic film scores for Star Wars, Jurassic Park, Jaws, and Indiana Jones?',
        options: ['Hans Zimmer', 'Ennio Morricone', 'John Williams', 'Howard Shore'],
        correctIndex: 2,
        explanation: 'John Williams has received over 50 Academy Award nominations for his legendary musical scores over six decades.'
      },
      {
        id: 'p3',
        question: 'In the Marvel Cinematic Universe, what is the fictional metal mined in Wakanda that comprises Captain America’s shield?',
        options: ['Adamantium', 'Vibranium', 'Uru', 'Mithril'],
        correctIndex: 1,
        explanation: 'Vibranium is the rare kinetic-energy-absorbing extraterrestrial metal native to Wakanda.'
      }
    ]
  }
];
