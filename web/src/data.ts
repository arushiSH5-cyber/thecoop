/* Sample content, carried over as-is from the prototype. */
export type Room = "lobby" | "feed" | "news" | "learn" | "help" | "circles";
export interface Post {
  id: string; who: string; init: string; col: string; ago: string;
  pitch: number; rate: number; voice: string; scene: string | null;
  desc?: string; qa?: [RegExp, string][]; replies?: string[]; video?: boolean;
}
export interface NewsStory { t: string; b: string; src: string[] }
export interface HelpItem { k: string; ic: string; t: string; b: string; src: string }
export interface Lesson { t: string; by: string; b: string }
export interface Circle { t: string; n: string; posts: string[] }

export const POSTS: Post[]=[
 {id:"p1",who:"Maya",init:"M",col:"var(--k1)",ago:"2 hours ago",pitch:1.25,rate:1.05,
  voice:"Ocean Beach, six in the morning. The sand is cold and packed hard, and the waves come in sets of three: boom, hiss, quiet. My cane found a line of seaweed and I followed it to the water. Salt on my lips, wind pushing my hood back. Honestly, it felt like the whole ocean was saying good morning.",
  scene:"beach",desc:"Blue-green ocean waves roll in with white foam, under a wide sky of scattered clouds. The sun is low and golden on the horizon.",
  qa:[[/wave|water|ocean|sea/,"The waves are rolling in with long lines of white foam, and the water is a deep blue-green."],[/wear|cloth|outfit|smil|happy|laugh|face|who|people|anyone|else|wet/,"There's no one in this photo, just the ocean and the sky."],[/background|behind|sky|sun|cloud/,"The sky is full of scattered white clouds, and the sun is low and golden on the horizon."],[/color|colour/,"Mostly deep blue and teal water, white foam, and a golden sky."]]},
 {id:"p2",who:"Grandpa Joe",init:"J",col:"var(--p1)",ago:"5 hours ago",pitch:.75,rate:.9,
  voice:"My garden at dusk. I find the tomato plants by smell before I touch them, sharp and green. Tonight two were soft and still warm from the sun, so I ate one standing right there. Sixty years of gardening, the last eight by feel, and it still tastes like being nine years old.",
  scene:"garden",desc:"A tomato plant tied to a wooden stake in a straw-covered garden bed. Most of the tomatoes are still green, and two near the stake are red.",
  qa:[[/how many|count/,"Two are clearly red and one is turning orange. The rest are still green."],[/wear|hat|cloth|smil|happy|face|who|people/,"There's no one in this photo, just the plant."],[/background|behind/,"Behind the plant there's straw and bare soil."],[/color|colour/,"Mostly green leaves, a few red tomatoes, and tan straw."]]},
 {id:"p5",who:"Lena",init:"L",col:"var(--b1)",ago:"6 hours ago",pitch:1.15,rate:1,
  voice:"The lantern festival tonight. You hear it before you get there: wind chimes, kids laughing, paper rustling overhead like a thousand quiet birds. My sister walked me under the lanterns and I could feel little pockets of warm air from every one. Best walk of my whole year.",
  scene:"photo",desc:"A paved path runs under hundreds of glowing paper lanterns in orange, green, pink and cream, hanging from wires against a dusk sky. Dark trees line both sides.",
  qa:[[/how many|count/,"There are hundreds of lanterns, stretching far down the path."],[/color|colour/,"Orange, green, pink, purple and cream lanterns against a blue dusk sky."],[/who|people|anyone/,"Two small figures stand far down the path. Otherwise it's just the lanterns."],[/background|behind/,"Behind the lanterns there are dark trees and a large lit-up peacock display at the end of the path."]]},
 {id:"p3",who:"Priya",init:"P",col:"var(--b1)",ago:"yesterday",pitch:1.1,rate:1.1,
  voice:"First day at my new job, testing video games for accessibility. The office smells like coffee and new carpet, and somebody's keyboard sounds like rain. I found every menu that doesn't talk. Twelve of them. They clapped. Now I'm celebrating with mango ice cream, very cold, zero regrets.",
  scene:null},
 {id:"p6",who:"Omar",init:"O",col:"var(--p1)",ago:"yesterday",pitch:.95,rate:1,
  voice:"Night hike in the redwoods. Pine needles soft underfoot, the creek on my left the whole way. Then my guide dog froze, and right above us came a long, breathy screech. A barn owl. My friend whispered that it was looking straight at us. My heart is still going.",
  scene:"photo",desc:"A barn owl with a pale heart-shaped face and big dark eyes sits on a mossy branch, tilting its head toward the camera. The forest behind it is soft and blurred.",
  qa:[[/color|colour|feather/,"Its face and chest are white, and its wings are golden brown with small dark speckles."],[/eye|look|face/,"It has big dark eyes and its head is tilted, looking right at the camera."],[/who|people|anyone/,"There are no people in this photo, just the owl."],[/background|behind/,"Behind the owl there's a soft, blurry green forest."]]},
 {id:"p4",who:"Dev",init:"D",col:"var(--k1)",ago:"yesterday",pitch:.95,rate:1,
  voice:"Saturday farmers market. I find my way by sound: the fiddle player is at the entrance, the coffee grinder is halfway, and the bakery is wherever the cinnamon is strongest. Peaches, honey, and a long chat with the honey guy. Hot tip: rubber bands on your spice jars, one for cumin, two for chili.",
  scene:null},
 {id:"p7",who:"Nina",init:"N",col:"var(--k1)",ago:"2 days ago",pitch:.9,rate:.95,
  voice:"I sat on the hill above town until the sun went down. I only see light and dark now, and this one went from bright gold, to soft orange, to gone. The crickets came in right on cue. Warm grass, cool air. I'm keeping this one.",
  scene:"photo",desc:"A sunset over rolling green hills, with the sun low on the horizon and a pink and orange sky. Wildflowers fill the grassy slope in front.",
  qa:[[/flower/,"White daisies, orange poppies and a few purple flowers fill the slope."],[/color|colour/,"A pink and orange sky, green hills, and bright wildflowers."],[/who|people|anyone/,"There are no people in this photo."],[/background|behind|sun|sky/,"Layers of hills fade into the distance under a glowing sun."]]},
 {id:"p8",who:"Theo",init:"T",col:"var(--b1)",ago:"2 days ago",pitch:1,rate:1,
  voice:"Forest walk after the rain. Everything drips. The path squishes, then crunches, then goes quiet under the moss. A woodpecker somewhere high up, knocking like it has an appointment. Somebody tell me what the light was doing in there.",
  scene:"photo",desc:"Looking straight up into a forest canopy, sunbeams slant down through bright green leaves between dark, twisting branches.",
  qa:[[/light|sun|beam/,"Rays of sunlight slant down through the leaves, making them glow bright green."],[/color|colour/,"Bright yellow-green leaves against dark brown branches."],[/who|people|anyone/,"There are no people in this photo, just the trees."],[/background|behind|tree/,"Tall, twisting trees fill the whole picture."]]},
];
export const NEWS: NewsStory[]=[
 {t:"Sample: talking campus maps spread to more colleges",b:"Student-built phone maps that announce entrances and ramps as you walk are being shared free with other campuses. This is a sample story, shown when live search is off.",src:["Sample story"]},
 {t:"Sample: libraries add audio-described movie nights",b:"Monthly screenings with audio description let blind and low-vision guests follow every scene. This is a sample story, shown when live search is off.",src:["Sample story"]},
 {t:"Sample: new research on restoring sight",b:"Teams are testing gene therapies and retinal implants for some inherited eye diseases. This is a sample story, shown when live search is off.",src:["Sample story"]}
];
export const HELP: HelpItem[]=[
 {k:"rides",ic:"bus",t:"Rides: paratransit",b:"Under the ADA, public transit agencies that run regular buses must also offer paratransit, a shared door-to-door ride, for people whose disability keeps them from using the regular bus. You apply through your local transit agency.",src:"ADA National Network (live version links the official page)"},
 {k:"books",ic:"book",t:"Free audiobooks: Talking Books",b:"The Library of Congress's National Library Service lends talking books and players free by mail to people who are blind or can't read regular print. You can also download books to your phone.",src:"National Library Service, loc.gov/nls (live version links it)"},
 {k:"jobs",ic:"brief",t:"Job training: vocational rehabilitation",b:"Every state has a vocational rehabilitation agency that helps people with disabilities train for and find work. In California it's the Department of Rehabilitation.",src:"California Department of Rehabilitation (live version links it)"}
];
export const LEARN: Lesson[]=[
 {t:"Cane travel: the two-point touch",by:"from Coach Ana",b:"Sweep your cane just wider than your shoulders, tapping left as your right foot steps and right as your left foot steps. Listen to how the tap changes on grass, gravel and curbs. Practice on a quiet block first."},
 {t:"Cooking: the finger guard",by:"from Dev",b:"Curl your fingertips under and rest your knuckles against the flat of the knife. Slide the knife down your knuckles to cut. Use a cutting board with a contrasting color, and go slow."},
 {t:"Labels you can feel",by:"from Rosa",b:"Rubber bands, puffy paint dots or Braille labels turn look-alike jars into ones you can read with your fingers. One band for cumin, two for chili."},
 {t:"Screen reader basics",by:"from Leo",b:"On an iPhone, triple-click the side button to turn VoiceOver on. Swipe right to move, double-tap to choose. Turn on Screen Curtain to save battery and privacy."}
];
export const CIRCLES: Circle[]=[
 {t:"New to vision loss",n:"38 members",posts:["Ana: Week two with my cane. Today I made it to the coffee shop alone.","Sam: The first months are hard. It gets better, I promise. Ask me anything."]},
 {t:"Guide dog handlers",n:"64 members",posts:["Kai: Retirement party for my first guide dog, Juno. Ten years, three cities, one very spoiled lab.","Mia: Tip: a little bell on the harness helps people know you're coming in a crowd."]},
 {t:"Blind cooks club",n:"91 members",posts:["Theo: Talking kitchen scale changed my baking. Bread came out right on the first try.","Priya: Tonight is mango sticky rice. Ask me how I time the rice by sound."]},
 {t:"Tech and gadgets",n:"112 members",posts:["Leo: The new audio racing game uses engine sounds to tell you the turns. So good.","Nina: Anyone tried the new talking bus-stop signs downtown?"]}
];
export const HELD={from:"unknown account",t:"Win a free phone! Send a $50 gift card to claim it.",why:"asked for gift cards, a common scam"};
export const ROOMS: [Room,string][]=[["lobby","lobby"],["feed","feed"],["news","news"],["learn","learn"],["help","help"],["circles","circles"]];
export const CMDS: Record<Room,string[]>={
 lobby:["play my feed","what's new?","send a photo to grandma","go to news","help"],
 feed:["play it","describe the photo","like it","reply","next","make a video","post something"],
 news:["read it","simpler","more like this","sources"],
 learn:["read it","next","go to feed"],
 help:["rides","free audiobooks","job training","do it for me"],
 circles:["read it","next","what got blocked?"]
};
