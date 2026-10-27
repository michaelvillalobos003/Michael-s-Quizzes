import db, { memStore } from './index.js';

export const SEED_DATA = [
  {
    title: 'Video Games & Metaverse',
    description: 'Level up your gaming IQ with trivia on Minecraft, Roblox, Fortnite, and Nintendo classics!',
    category: 'Gaming',
    difficulty: 'easy',
    is_approved: true,
    is_daily_challenge: false,
    questions: [
      {
        question_text: 'In Minecraft, which rare ore is required to upgrade diamond gear at a smithing table?',
        choices: [
          { choice_text: 'Netherite Ingot', is_correct: true },
          { choice_text: 'Obsidian Shard', is_correct: false },
          { choice_text: 'Redstone Crystal', is_correct: false },
          { choice_text: 'Lapis Lazuli Gem', is_correct: false }
        ]
      },
      {
        question_text: 'What is the standard virtual currency used to buy items, skins, and game passes across Roblox?',
        choices: [
          { choice_text: 'V-Bucks', is_correct: false },
          { choice_text: 'Robux', is_correct: true },
          { choice_text: 'Minecoins', is_correct: false },
          { choice_text: 'Blox Coins', is_correct: false }
        ]
      },
      {
        question_text: 'In Fortnite Battle Royale, what iconic vehicle drops all 100 players onto the island?',
        choices: [
          { choice_text: 'The Battle Bus', is_correct: true },
          { choice_text: 'The Storm Glider', is_correct: false },
          { choice_text: 'The Sky Zeppelin', is_correct: false },
          { choice_text: 'The Supply Cruiser', is_correct: false }
        ]
      },
      {
        question_text: 'What is the full name of Mario’s loyal green dinosaur companion in the Super Mario series?',
        choices: [
          { choice_text: 'T. Yoshisaur Munchakoopas (Yoshi)', is_correct: true },
          { choice_text: 'Rex Koopa', is_correct: false },
          { choice_text: 'Dino Berto', is_correct: false },
          { choice_text: 'Spike Saurian', is_correct: false }
        ]
      },
      {
        question_text: 'In Minecraft, which hostile mob explodes when it gets within close proximity of the player?',
        choices: [
          { choice_text: 'Enderman', is_correct: false },
          { choice_text: 'Creeper', is_correct: true },
          { choice_text: 'Silverfish', is_correct: false },
          { choice_text: 'Drowned', is_correct: false }
        ]
      },
      {
        question_text: 'Which legendary game creation engine powers user-made experiences in Roblox Studio using the Luau language?',
        choices: [
          { choice_text: 'Roblox Studio', is_correct: true },
          { choice_text: 'Unreal Engine 5', is_correct: false },
          { choice_text: 'Source 2', is_correct: false },
          { choice_text: 'Unity 3D', is_correct: false }
        ]
      },
      {
        question_text: 'In Nintendo’s The Legend of Zelda: Breath of the Wild, what tablet device does Link use for runes and maps?',
        choices: [
          { choice_text: 'Sheikah Slate', is_correct: true },
          { choice_text: 'Hylian Pad', is_correct: false },
          { choice_text: 'Triforce Compass', is_correct: false },
          { choice_text: 'Ancient Scanner', is_correct: false }
        ]
      },
      {
        question_text: 'What is the maximum number of players on a single standard team in Fortnite Squads mode?',
        choices: [
          { choice_text: '2 players', is_correct: false },
          { choice_text: '3 players', is_correct: false },
          { choice_text: '4 players', is_correct: true },
          { choice_text: '5 players', is_correct: false }
        ]
      },
      {
        question_text: 'In Pokémon, which Electric-type mouse Pokémon has National Pokédex number #0025?',
        choices: [
          { choice_text: 'Pichu', is_correct: false },
          { choice_text: 'Pikachu', is_correct: true },
          { choice_text: 'Raichu', is_correct: false },
          { choice_text: 'Plusle', is_correct: false }
        ]
      },
      {
        question_text: 'Which popular Roblox horror game challenges players to sneak through 100 hotel rooms while evading monsters like Rush and Ambush?',
        choices: [
          { choice_text: 'Piggy', is_correct: false },
          { choice_text: 'DOORS', is_correct: true },
          { choice_text: 'Rainbow Friends', is_correct: false },
          { choice_text: 'Tower of Hell', is_correct: false }
        ]
      }
    ]
  },
  {
    title: 'Superheroes & Comic Legends',
    description: 'Test your knowledge on Earth’s mightiest heroes, web-slingers, Gotham’s vigilantes, and iconic comic lore.',
    category: 'Comics & Heroes',
    difficulty: 'medium',
    is_approved: true,
    is_daily_challenge: false,
    questions: [
      {
        question_text: 'What is the real identity of the teenage web-slinger from Brooklyn who becomes Spider-Man in Into the Spider-Verse?',
        choices: [
          { choice_text: 'Peter Parker', is_correct: false },
          { choice_text: 'Miles Morales', is_correct: true },
          { choice_text: 'Miguel O’Hara', is_correct: false },
          { choice_text: 'Ned Leeds', is_correct: false }
        ]
      },
      {
        question_text: 'Which mythical metal alloy coats Wolverine’s skeleton and lethal retractable claws in Marvel lore?',
        choices: [
          { choice_text: 'Vibranium', is_correct: false },
          { choice_text: 'Adamantium', is_correct: true },
          { choice_text: 'Uru Metal', is_correct: false },
          { choice_text: 'Kryptonite', is_correct: false }
        ]
      },
      {
        question_text: 'What is the secret subterranean headquarters of Bruce Wayne (Batman) beneath Wayne Manor called?',
        choices: [
          { choice_text: 'The Fortress of Solitude', is_correct: false },
          { choice_text: 'The Batcave', is_correct: true },
          { choice_text: 'The Hall of Justice', is_correct: false },
          { choice_text: 'The Watchtower', is_correct: false }
        ]
      },
      {
        question_text: 'What magical item grants Tony Stark power to survive shrapnel and fuel his Iron Man armor suits?',
        choices: [
          { choice_text: 'Arc Reactor', is_correct: true },
          { choice_text: 'Tesseract', is_correct: false },
          { choice_text: 'Gamma Core', is_correct: false },
          { choice_text: 'Quantum Cell', is_correct: false }
        ]
      },
      {
        question_text: 'What is the native superhero realm and hidden kingdom ruled by Black Panther (T’Challa)?',
        choices: [
          { choice_text: 'Latveria', is_correct: false },
          { choice_text: 'Wakanda', is_correct: true },
          { choice_text: 'Genosha', is_correct: false },
          { choice_text: 'Themyscira', is_correct: false }
        ]
      },
      {
        question_text: 'What is the name of Thor’s enchanted mystical hammer forged in the heart of a dying star?',
        choices: [
          { choice_text: 'Stormbreaker', is_correct: false },
          { choice_text: 'Mjolnir', is_correct: true },
          { choice_text: 'Gungnir', is_correct: false },
          { choice_text: 'Aegis', is_correct: false }
        ]
      },
      {
        question_text: 'What city is Superman’s primary home and the base of his civilian job at the Daily Planet newspaper?',
        choices: [
          { choice_text: 'Gotham City', is_correct: false },
          { choice_text: 'Metropolis', is_correct: true },
          { choice_text: 'Central City', is_correct: false },
          { choice_text: 'Star City', is_correct: false }
        ]
      },
      {
        question_text: 'Which member of the Teen Titans is an alien princess from the faraway planet Tamaran?',
        choices: [
          { choice_text: 'Raven', is_correct: false },
          { choice_text: 'Starfire', is_correct: true },
          { choice_text: 'Terra', is_correct: false },
          { choice_text: 'Wonder Girl', is_correct: false }
        ]
      },
      {
        question_text: 'Who is known as the "Merc with a Mouth" capable of breaking the 4th wall and regenerating rapidly?',
        choices: [
          { choice_text: 'Deadpool (Wade Wilson)', is_correct: true },
          { choice_text: 'The Punisher', is_correct: false },
          { choice_text: 'Moon Knight', is_correct: false },
          { choice_text: 'Ghost Rider', is_correct: false }
        ]
      },
      {
        question_text: 'What color ring does DC’s Green Lantern Corps draw emotional willpower from to form solid energy constructs?',
        choices: [
          { choice_text: 'Blue (Hope)', is_correct: false },
          { choice_text: 'Green (Willpower)', is_correct: true },
          { choice_text: 'Yellow (Fear)', is_correct: false },
          { choice_text: 'Violet (Love)', is_correct: false }
        ]
      }
    ]
  },
  {
    title: 'Animated Blockbusters',
    description: 'Relive classic movie magic from Disney, Pixar, and DreamWorks animation masterpieces!',
    category: 'Movies & Animation',
    difficulty: 'easy',
    is_approved: true,
    is_daily_challenge: false,
    questions: [
      {
        question_text: 'In Disney’s Frozen, who is the magical talking snowman created by Elsa who loves warm hugs?',
        choices: [
          { choice_text: 'Sven', is_correct: false },
          { choice_text: 'Olaf', is_correct: true },
          { choice_text: 'Kristoff', is_correct: false },
          { choice_text: 'Marshmallow', is_correct: false }
        ]
      },
      {
        question_text: 'In Pixar’s Toy Story, what famous phrase is voiced by Space Ranger Buzz Lightyear?',
        choices: [
          { choice_text: '"To infinity and beyond!"', is_correct: true },
          { choice_text: '"Reach for the sky!"', is_correct: false },
          { choice_text: '"There’s a snake in my boot!"', is_correct: false },
          { choice_text: '"Blast off into hyperspace!"', is_correct: false }
        ]
      },
      {
        question_text: 'In DreamWorks’ Kung Fu Panda, what species of animal is the Dragon Warrior Po?',
        choices: [
          { choice_text: 'Red Panda', is_correct: false },
          { choice_text: 'Giant Panda', is_correct: true },
          { choice_text: 'Grizzly Bear', is_correct: false },
          { choice_text: 'Snow Leopard', is_correct: false }
        ]
      },
      {
        question_text: 'In Pixar’s Coco, what holiday festival celebration sets the backdrop for Miguel’s musical adventure?',
        choices: [
          { choice_text: 'Cinco de Mayo', is_correct: false },
          { choice_text: 'Día de los Muertos (Day of the Dead)', is_correct: true },
          { choice_text: 'Las Posadas', is_correct: false },
          { choice_text: 'Nochebuena', is_correct: false }
        ]
      },
      {
        question_text: 'In DreamWorks’ Shrek, what kind of fantastical creature is Shrek who loves his peaceful swamp?',
        choices: [
          { choice_text: 'Troll', is_correct: false },
          { choice_text: 'Ogre', is_correct: true },
          { choice_text: 'Goblin', is_correct: false },
          { choice_text: 'Gargoyle', is_correct: false }
        ]
      },
      {
        question_text: 'In Pixar’s Finding Nemo, what type of ocean fish are Nemo and his cautious father Marlin?',
        choices: [
          { choice_text: 'Clownfish', is_correct: true },
          { choice_text: 'Blue Tang', is_correct: false },
          { choice_text: 'Angelfish', is_correct: false },
          { choice_text: 'Pufferfish', is_correct: false }
        ]
      },
      {
        question_text: 'In Disney’s Moana, what magical shapeshifting demigod teams up with Moana across the ocean?',
        choices: [
          { choice_text: 'Maui', is_correct: true },
          { choice_text: 'Tamatoa', is_correct: false },
          { choice_text: 'Heihei', is_correct: false },
          { choice_text: 'Te Fiti', is_correct: false }
        ]
      },
      {
        question_text: 'In DreamWorks’ How to Train Your Dragon, what ultra-rare dragon breed is Toothless?',
        choices: [
          { choice_text: 'Deadly Nadder', is_correct: false },
          { choice_text: 'Night Fury', is_correct: true },
          { choice_text: 'Monstrous Nightmare', is_correct: false },
          { choice_text: 'Gronckle', is_correct: false }
        ]
      },
      {
        question_text: 'In Pixar’s Inside Out, which emotion takes the primary console control at Headquarters at the start?',
        choices: [
          { choice_text: 'Sadness', is_correct: false },
          { choice_text: 'Joy', is_correct: true },
          { choice_text: 'Anger', is_correct: false },
          { choice_text: 'Disgust', is_correct: false }
        ]
      },
      {
        question_text: 'In Disney’s Zootopia, what mammal species is the ambitious rookie police officer Judy Hopps?',
        choices: [
          { choice_text: 'Fennec Fox', is_correct: false },
          { choice_text: 'European Rabbit', is_correct: true },
          { choice_text: 'River Otter', is_correct: false },
          { choice_text: 'Cheetah', is_correct: false }
        ]
      }
    ]
  },
  {
    title: 'Pop Culture & Trending Beats',
    description: 'From viral memes and trending dances to chart-topping hits and internet phenomena.',
    category: 'Pop Culture',
    difficulty: 'medium',
    is_approved: true,
    is_daily_challenge: false,
    questions: [
      {
        question_text: 'Which global pop superstar embarked on the historic, record-shattering "Eras Tour"?',
        choices: [
          { choice_text: 'Taylor Swift', is_correct: true },
          { choice_text: 'Ariana Grande', is_correct: false },
          { choice_text: 'Billie Eilish', is_correct: false },
          { choice_text: 'Dua Lipa', is_correct: false }
        ]
      },
      {
        question_text: 'What internet slang term refers to effortless charisma or romantic charm?',
        choices: [
          { choice_text: 'Cap', is_correct: false },
          { choice_text: 'Rizz', is_correct: true },
          { choice_text: 'Bet', is_correct: false },
          { choice_text: 'Flex', is_correct: false }
        ]
      },
      {
        question_text: 'Which popular viral dance craze became a massively popular Fortnite emote originated by backpack kid?',
        choices: [
          { choice_text: 'The Floss', is_correct: true },
          { choice_text: 'The Macarena', is_correct: false },
          { choice_text: 'The Harlem Shake', is_correct: false },
          { choice_text: 'The Dab', is_correct: false }
        ]
      },
      {
        question_text: 'Who is the famous YouTuber known for wild multi-million dollar challenge videos and recreation of Squid Game in real life?',
        choices: [
          { choice_text: 'MrBeast (Jimmy Donaldson)', is_correct: true },
          { choice_text: 'Markiplier', is_correct: false },
          { choice_text: 'DanTDM', is_correct: false },
          { choice_text: 'PewDiePie', is_correct: false }
        ]
      },
      {
        question_text: 'What does the viral slang term "No Cap" universally mean online?',
        choices: [
          { choice_text: 'No hats allowed', is_correct: false },
          { choice_text: 'No lie / Being completely honest', is_correct: true },
          { choice_text: 'No internet connection', is_correct: false },
          { choice_text: 'No maximum limit', is_correct: false }
        ]
      },
      {
        question_text: 'Which hit song by Lil Nas X featuring Billy Ray Cyrus topped the Billboard Hot 100 for a record 19 weeks?',
        choices: [
          { choice_text: 'Montero', is_correct: false },
          { choice_text: 'Old Town Road', is_correct: true },
          { choice_text: 'Industry Baby', is_correct: false },
          { choice_text: 'Rodeo', is_correct: false }
        ]
      },
      {
        question_text: 'What short-form video platform’s algorithm is known for its customized "For You Page" (FYP)?',
        choices: [
          { choice_text: 'TikTok', is_correct: true },
          { choice_text: 'Vimeo', is_correct: false },
          { choice_text: 'Tumblr', is_correct: false },
          { choice_text: 'Twitch', is_correct: false }
        ]
      },
      {
        question_text: 'What is the real first name of the multi-platinum singer-songwriter behind "Bad Guy" and "Birds of a Feather"?',
        choices: [
          { choice_text: 'Billie (Eilish)', is_correct: true },
          { choice_text: 'Olivia (Rodrigo)', is_correct: false },
          { choice_text: 'Sabrina (Carpenter)', is_correct: false },
          { choice_text: 'Finneas', is_correct: false }
        ]
      },
      {
        question_text: 'Which game popularized phrases like "sus" (suspicious) and "impostor" during its massive 2020 resurgence?',
        choices: [
          { choice_text: 'Fall Guys', is_correct: false },
          { choice_text: 'Among Us', is_correct: true },
          { choice_text: 'Phasmophobia', is_correct: false },
          { choice_text: 'Genshin Impact', is_correct: false }
        ]
      },
      {
        question_text: 'Which popular singer had massive 2024 hits with "Espresso" and "Please Please Please"?',
        choices: [
          { choice_text: 'Sabrina Carpenter', is_correct: true },
          { choice_text: 'Charli XCX', is_correct: false },
          { choice_text: 'Chappell Roan', is_correct: false },
          { choice_text: 'Tate McRae', is_correct: false }
        ]
      }
    ]
  },
  {
    title: 'Fast Food, Candy & Snack Lore',
    description: 'Crispy nuggets, iconic mascots, secret sauces, and famous sweet treats from across the snack aisle!',
    category: 'Food & Snacks',
    difficulty: 'easy',
    is_approved: true,
    is_daily_challenge: false,
    questions: [
      {
        question_text: 'What famous fast food burger chain features the slogan "Have It Your Way"?',
        choices: [
          { choice_text: 'McDonald’s', is_correct: false },
          { choice_text: 'Burger King', is_correct: true },
          { choice_text: 'Wendy’s', is_correct: false },
          { choice_text: 'Sonic Drive-In', is_correct: false }
        ]
      },
      {
        question_text: 'Which candy invites you to "Taste the Rainbow" with its fruit-flavored bite-sized chews?',
        choices: [
          { choice_text: 'Starburst', is_correct: false },
          { choice_text: 'Skittles', is_correct: true },
          { choice_text: 'M&M’s', is_correct: false },
          { choice_text: 'Jolly Ranchers', is_correct: false }
        ]
      },
      {
        question_text: 'In McDonald’s lore, which large purple mascot is known for loving milkshakes and burgers?',
        choices: [
          { choice_text: 'Grimace', is_correct: true },
          { choice_text: 'The Hamburglar', is_correct: false },
          { choice_text: 'Mayor McCheese', is_correct: false },
          { choice_text: 'Birdie the Early Bird', is_correct: false }
        ]
      },
      {
        question_text: 'What is the name of the popular sour powdered candy that comes with a hard candy dipping stick?',
        choices: [
          { choice_text: 'Fun Dip', is_correct: true },
          { choice_text: 'Pop Rocks', is_correct: false },
          { choice_text: 'Pixy Stix', is_correct: false },
          { choice_text: 'Airheads', is_correct: false }
        ]
      },
      {
        question_text: 'What Mexican-inspired fast food restaurant is famous for the "Crunchwrap Supreme" and "Baja Blast"?',
        choices: [
          { choice_text: 'Chipotle', is_correct: false },
          { choice_text: 'Taco Bell', is_correct: true },
          { choice_text: 'Del Taco', is_correct: false },
          { choice_text: 'Qdoba', is_correct: false }
        ]
      },
      {
        question_text: 'Which chocolate bar brand consists of chocolate-coated crispy wafer fingers, famously encouraging you to "Have a break"?',
        choices: [
          { choice_text: 'Twix', is_correct: false },
          { choice_text: 'Kit Kat', is_correct: true },
          { choice_text: 'Snickers', is_correct: false },
          { choice_text: 'Milky Way', is_correct: false }
        ]
      },
      {
        question_text: 'What is the mascot of Cheetos snacks, known for wearing sunglasses and cool sneakers?',
        choices: [
          { choice_text: 'Tony the Tiger', is_correct: false },
          { choice_text: 'Chester Cheetah', is_correct: true },
          { choice_text: 'Snap, Crackle, and Pop', is_correct: false },
          { choice_text: 'The Noid', is_correct: false }
        ]
      },
      {
        question_text: 'What fast food fried chicken chain was founded by Colonel Harland Sanders?',
        choices: [
          { choice_text: 'Popeyes', is_correct: false },
          { choice_text: 'KFC (Kentucky Fried Chicken)', is_correct: true },
          { choice_text: 'Raising Cane’s', is_correct: false },
          { choice_text: 'Church’s Texas Chicken', is_correct: false }
        ]
      },
      {
        question_text: 'Which chocolate candy features chocolate buttons with the letter "M" printed on each shell?',
        choices: [
          { choice_text: 'M&M’s', is_correct: true },
          { choice_text: 'Reese’s Pieces', is_correct: false },
          { choice_text: 'Sixlets', is_correct: false },
          { choice_text: 'Junior Mints', is_correct: false }
        ]
      },
      {
        question_text: 'What frozen beverage dispensed at 7-Eleven convenience stores has been an iconic icy treat since 1966?',
        choices: [
          { choice_text: 'ICEE', is_correct: false },
          { choice_text: 'Slurpee', is_correct: true },
          { choice_text: 'Frappuccino', is_correct: false },
          { choice_text: 'Freeze-Pop', is_correct: false }
        ]
      }
    ]
  },
  {
    title: 'Daily Mega Challenge: Ultimate Knowledge Gauntlet',
    description: 'Exclusive high-stakes daily test spanning top-tier gaming, comic heroes, pop hits, and world records! High cash reward ($50/question + $150 perfect bonus)!',
    category: 'Mega Challenge',
    difficulty: 'hard',
    is_approved: true,
    is_daily_challenge: true,
    questions: [
      {
        question_text: 'In Minecraft, how many obsidian blocks are required at minimum to construct a functioning Nether Portal frame?',
        choices: [
          { choice_text: '8 blocks', is_correct: false },
          { choice_text: '10 blocks', is_correct: true },
          { choice_text: '12 blocks', is_correct: false },
          { choice_text: '14 blocks', is_correct: false }
        ]
      },
      {
        question_text: 'Which Infinity Stone in the Marvel Cinematic Universe was held inside the mystical Tesseract cube?',
        choices: [
          { choice_text: 'Power Stone (Purple)', is_correct: false },
          { choice_text: 'Space Stone (Blue)', is_correct: true },
          { choice_text: 'Reality Stone (Red)', is_correct: false },
          { choice_text: 'Mind Stone (Yellow)', is_correct: false }
        ]
      },
      {
        question_text: 'In Disney Pixar’s The Incredibles, what is the superhero alter-ego and freezing power identity of Lucius Best?',
        choices: [
          { choice_text: 'Frozone', is_correct: true },
          { choice_text: 'Iceman', is_correct: false },
          { choice_text: 'Blizzard', is_correct: false },
          { choice_text: 'Sub-Zero', is_correct: false }
        ]
      },
      {
        question_text: 'What was the very first video ever uploaded to YouTube in April 2005 by co-founder Jawed Karim?',
        choices: [
          { choice_text: '"Me at the zoo"', is_correct: true },
          { choice_text: '"Charlie bit my finger"', is_correct: false },
          { choice_text: '"Hello World"', is_correct: false },
          { choice_text: '"Guitar Solo"', is_correct: false }
        ]
      },
      {
        question_text: 'Which Nintendo franchise features the pocket monsters originating from the Kanto region created by Satoshi Tajiri?',
        choices: [
          { choice_text: 'Digimon', is_correct: false },
          { choice_text: 'Pokémon', is_correct: true },
          { choice_text: 'Yo-kai Watch', is_correct: false },
          { choice_text: 'Monster Hunter', is_correct: false }
        ]
      },
      {
        question_text: 'What secret formula ingredients are famously guarded by Mr. Krabs in SpongeBob SquarePants?',
        choices: [
          { choice_text: 'The Krabby Patty Secret Formula', is_correct: true },
          { choice_text: 'The Chum Bucket Delight', is_correct: false },
          { choice_text: 'Kelp Shake Recipe', is_correct: false },
          { choice_text: 'Barnacle Batter', is_correct: false }
        ]
      },
      {
        question_text: 'In the DC Universe, what is Batman’s strict moral rule that he vows never to cross?',
        choices: [
          { choice_text: 'Never use gadgets', is_correct: false },
          { choice_text: 'Never take a human life (no-kill rule)', is_correct: true },
          { choice_text: 'Never reveal his identity to anyone', is_correct: false },
          { choice_text: 'Never leave Gotham City', is_correct: false }
        ]
      },
      {
        question_text: 'In the game Among Us, what color is the default astronaut seen in most promotional game art?',
        choices: [
          { choice_text: 'Blue', is_correct: false },
          { choice_text: 'Red', is_correct: true },
          { choice_text: 'Green', is_correct: false },
          { choice_text: 'Yellow', is_correct: false }
        ]
      },
      {
        question_text: 'What popular spicy snack chip brand made by Frito-Lay features the famous fiery "Flamin’ Hot" flavor?',
        choices: [
          { choice_text: 'Takis Fuego', is_correct: false },
          { choice_text: 'Flamin’ Hot Cheetos', is_correct: true },
          { choice_text: 'Doritos Dinamita', is_correct: false },
          { choice_text: 'Hot Fries', is_correct: false }
        ]
      },
      {
        question_text: 'What is the highest-grossing animated movie of all time at the global box office as of 2024?',
        choices: [
          { choice_text: 'Frozen II', is_correct: false },
          { choice_text: 'Inside Out 2', is_correct: true },
          { choice_text: 'The Super Mario Bros. Movie', is_correct: false },
          { choice_text: 'Incredibles 2', is_correct: false }
        ]
      }
    ]
  }
];

export async function seedQuizzes() {
  console.log('[Seed] Starting quiz seeding process...');

  // Always seed in-memory store so fallback works seamlessly
  memStore.quizzes = [];
  memStore.questions = [];
  memStore.choices = [];
  memStore.counters.quizzes = 1;
  memStore.counters.questions = 1;
  memStore.counters.choices = 1;

  for (const quizData of SEED_DATA) {
    const qId = memStore.counters.quizzes++;
    const quizRecord = {
      id: qId,
      title: quizData.title,
      description: quizData.description,
      category: quizData.category,
      difficulty: quizData.difficulty,
      is_approved: quizData.is_approved,
      is_daily_challenge: quizData.is_daily_challenge,
      status: 'Approved',
      creator_user_id: 1,
      rejection_feedback: null,
      created_at: new Date()
    };
    memStore.quizzes.push(quizRecord);

    quizData.questions.forEach((q, qIndex) => {
      const questionId = memStore.counters.questions++;
      memStore.questions.push({
        id: questionId,
        quiz_id: qId,
        question_text: q.question_text,
        order_num: qIndex + 1
      });

      q.choices.forEach((c) => {
        const choiceId = memStore.counters.choices++;
        memStore.choices.push({
          id: choiceId,
          question_id: questionId,
          choice_text: c.choice_text,
          is_correct: Boolean(c.is_correct)
        });
      });
    });
  }

  // Seed sample Pending student quiz (for Educator Review Queue)
  const pendingQuizId = memStore.counters.quizzes++;
  memStore.quizzes.push({
    id: pendingQuizId,
    title: 'Anime & Shonen Powerups',
    description: 'Trivia on Saiyan forms, bankai releases, breathing styles, and cursed techniques created by PixelGamer99.',
    category: 'Anime',
    difficulty: 'medium',
    is_approved: false,
    is_daily_challenge: false,
    status: 'Pending',
    creator_user_id: 2,
    rejection_feedback: null,
    created_at: new Date(Date.now() - 3600000 * 3)
  });

  for (let i = 1; i <= 10; i++) {
    const qId = memStore.counters.questions++;
    memStore.questions.push({
      id: qId,
      quiz_id: pendingQuizId,
      question_text: `Sample Anime Question #${i}: Which legendary transformation unlocks this aura?`,
      order_num: i
    });
    ['Super Saiyan', 'Gear 5', 'Bankai', 'Domain Expansion'].forEach((cText, cIdx) => {
      memStore.choices.push({
        id: memStore.counters.choices++,
        question_id: qId,
        choice_text: cText,
        is_correct: cIdx === 0
      });
    });
  }

  // Seed sample Rejected student quiz (for My Created Quizzes and Edit & Resubmit workflow)
  const rejectedQuizId = memStore.counters.quizzes++;
  memStore.quizzes.push({
    id: rejectedQuizId,
    title: 'Space Explorers & Rocket Science',
    description: 'Orbital mechanics, Apollo missions, and Mars rovers created by Michael.',
    category: 'Science',
    difficulty: 'hard',
    is_approved: false,
    is_daily_challenge: false,
    status: 'Rejected',
    creator_user_id: 1,
    rejection_feedback: 'Question 4 needs clearer answer options. Please revise and resubmit!',
    created_at: new Date(Date.now() - 3600000 * 24)
  });

  for (let i = 1; i <= 10; i++) {
    const qId = memStore.counters.questions++;
    memStore.questions.push({
      id: qId,
      quiz_id: rejectedQuizId,
      question_text: i === 4 
        ? 'Question 4 (Needs revision): Which propulsion system was tested on Artemis 1?' 
        : `Space Exploration Question #${i}: What is the primary propellant used in standard liquid rocket engines?`,
      order_num: i
    });
    ['Liquid Hydrogen & LOX', 'Hydrazine', 'Solid Fuel Booster', 'Kerosene RP-1'].forEach((cText, cIdx) => {
      memStore.choices.push({
        id: memStore.counters.choices++,
        question_id: qId,
        choice_text: cText,
        is_correct: cIdx === 0
      });
    });
  }

  console.log(`[Seed - Memory] Seeded ${memStore.quizzes.length} quizzes, ${memStore.questions.length} questions, ${memStore.choices.length} choices into in-memory store.`);

  if (memStore.attempts.length === 0) {
    const sampleAttempts = [
      { user_id: 1, quiz_id: 1, score: 10, total_questions: 10, percentage: 100, cash_earned: 125, completed_at: new Date(Date.now() - 3600000 * 4) },
      { user_id: 1, quiz_id: 6, score: 10, total_questions: 10, percentage: 100, cash_earned: 650, completed_at: new Date(Date.now() - 3600000 * 2) },
      { user_id: 2, quiz_id: 1, score: 10, total_questions: 10, percentage: 100, cash_earned: 125, completed_at: new Date(Date.now() - 3600000 * 12) },
      { user_id: 2, quiz_id: 2, score: 9, total_questions: 10, percentage: 90, cash_earned: 90, completed_at: new Date(Date.now() - 3600000 * 8) },
      { user_id: 2, quiz_id: 3, score: 8, total_questions: 10, percentage: 80, cash_earned: 80, completed_at: new Date(Date.now() - 3600000 * 5) },
      { user_id: 3, quiz_id: 1, score: 9, total_questions: 10, percentage: 90, cash_earned: 90, completed_at: new Date(Date.now() - 3600000 * 16) },
      { user_id: 3, quiz_id: 4, score: 10, total_questions: 10, percentage: 100, cash_earned: 125, completed_at: new Date(Date.now() - 3600000 * 10) },
      { user_id: 3, quiz_id: 5, score: 9, total_questions: 10, percentage: 90, cash_earned: 90, completed_at: new Date(Date.now() - 3600000 * 3) },
      { user_id: 4, quiz_id: 1, score: 8, total_questions: 10, percentage: 80, cash_earned: 80, completed_at: new Date(Date.now() - 3600000 * 20) },
      { user_id: 4, quiz_id: 2, score: 10, total_questions: 10, percentage: 100, cash_earned: 125, completed_at: new Date(Date.now() - 3600000 * 14) },
      { user_id: 5, quiz_id: 1, score: 7, total_questions: 10, percentage: 70, cash_earned: 70, completed_at: new Date(Date.now() - 3600000 * 24) },
      { user_id: 6, quiz_id: 1, score: 6, total_questions: 10, percentage: 60, cash_earned: 60, completed_at: new Date(Date.now() - 3600000 * 30) }
    ];

    for (const a of sampleAttempts) {
      memStore.attempts.push({
        id: memStore.counters.attempts++,
        ...a
      });
    }
    console.log(`[Seed - Memory] Seeded ${sampleAttempts.length} sample attempts for leaderboards.`);
  }

  // If connected to PostgreSQL, seed into database tables
  if (db.isPostgres()) {
    const pool = db.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing seed data to ensure fresh matching state
      await client.query('TRUNCATE TABLE choices, questions, quizzes CASCADE');

      for (const quizData of SEED_DATA) {
        const quizRes = await client.query(
          `INSERT INTO quizzes (title, description, category, difficulty, is_approved, is_daily_challenge)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            quizData.title,
            quizData.description,
            quizData.category,
            quizData.difficulty,
            quizData.is_approved,
            quizData.is_daily_challenge
          ]
        );
        const quizId = quizRes.rows[0].id;

        for (let i = 0; i < quizData.questions.length; i++) {
          const q = quizData.questions[i];
          const questionRes = await client.query(
            `INSERT INTO questions (quiz_id, question_text, order_num)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [quizId, q.question_text, i + 1]
          );
          const questionId = questionRes.rows[0].id;

          for (const c of q.choices) {
            await client.query(
              `INSERT INTO choices (question_id, choice_text, is_correct)
               VALUES ($1, $2, $3)`,
              [questionId, c.choice_text, Boolean(c.is_correct)]
            );
          }
        }
      }

      await client.query('COMMIT');
      console.log('[Seed - PostgreSQL] Successfully seeded all 6 quizzes into PostgreSQL database!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Seed - PostgreSQL] Error seeding database:', err);
    } finally {
      client.release();
    }
  }

  return {
    quizzesCount: memStore.quizzes.length,
    questionsCount: memStore.questions.length,
    choicesCount: memStore.choices.length
  };
}

// Auto-run if executed directly via `node db/seed-quizzes.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  seedQuizzes()
    .then((result) => {
      console.log('Seeding complete:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
