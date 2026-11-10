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
  voice:"Guess who finally stood up on a surfboard! Three tries, one mouthful of saltwater, zero regrets.",
  scene:"beach",desc:"Blue-green ocean waves roll in with white foam, under a wide sky of scattered clouds. The sun is low and golden on the horizon.",
  qa:[[/wave|water|ocean|sea/,"The waves are rolling in with long lines of white foam, and the water is a deep blue-green."],[/wear|cloth|outfit|smil|happy|laugh|face|who|people|anyone|else|wet/,"There's no one in this photo, just the ocean and the sky."],[/background|behind|sky|sun|cloud/,"The sky is full of scattered white clouds, and the sun is low and golden on the horizon."],[/color|colour/,"Mostly deep blue and teal water, white foam, and a golden sky."]]},
 {id:"p2",who:"Grandpa Joe",init:"J",col:"var(--p1)",ago:"5 hours ago",pitch:.75,rate:.9,
  voice:"First tomatoes of the season. I grew these by feel and by smell, and they're the sweetest ones yet.",
  scene:"garden",desc:"A tomato plant tied to a wooden stake in a straw-covered garden bed. Most of the tomatoes are still green, and two near the stake are red.",
  qa:[[/how many|count/,"Two are clearly red and one is turning orange. The rest are still green."],[/wear|hat|cloth|smil|happy|face|who|people/,"There's no one in this photo, just the plant."],[/background|behind/,"Behind the plant there's straw and bare soil."],[/color|colour/,"Mostly green leaves, a few red tomatoes, and tan straw."]]},
 {id:"p5",who:"Lena",init:"L",col:"var(--b1)",ago:"6 hours ago",pitch:1.15,rate:1,
  voice:"We walked through the lantern festival tonight. My sister told me there were hundreds, and I could feel the warm air from every one of them.",
  scene:"photo",desc:"A paved path runs under hundreds of glowing paper lanterns in orange, green, pink and cream, hanging from wires against a dusk sky. Dark trees line both sides.",
  qa:[[/how many|count/,"There are hundreds of lanterns, stretching far down the path."],[/color|colour/,"Orange, green, pink, purple and cream lanterns against a blue dusk sky."],[/who|people|anyone/,"Two small figures stand far down the path. Otherwise it's just the lanterns."],[/background|behind/,"Behind the lanterns there are dark trees and a large lit-up peacock display at the end of the path."]]},
 {id:"p3",who:"Priya",init:"P",col:"var(--b1)",ago:"yesterday",pitch:1.1,rate:1.1,
  voice:"I got the job! Accessibility tester at a game studio. I'll literally be paid to tell them their menus don't talk. Celebrating with mango ice cream.",
  scene:null},
 {id:"p6",who:"Omar",init:"O",col:"var(--p1)",ago:"yesterday",pitch:.95,rate:1,
  voice:"I heard this owl before anyone saw it. My guide dog froze, I froze, and then my friend whispered that it was looking right at us.",
  scene:"photo",desc:"A barn owl with a pale heart-shaped face and big dark eyes sits on a mossy branch, tilting its head toward the camera. The forest behind it is soft and blurred.",
  qa:[[/color|colour|feather/,"Its face and chest are white, and its wings are golden brown with small dark speckles."],[/eye|look|face/,"It has big dark eyes and its head is tilted, looking right at the camera."],[/who|people|anyone/,"There are no people in this photo, just the owl."],[/background|behind/,"Behind the owl there's a soft, blurry green forest."]]},
 {id:"p4",who:"Dev",init:"D",col:"var(--k1)",ago:"yesterday",pitch:.95,rate:1,
  voice:"Hot tip: I put rubber bands on my spice jars. One band for cumin, two for chili. No more surprise curry.",
  scene:null},
 {id:"p7",who:"Nina",init:"N",col:"var(--k1)",ago:"2 days ago",pitch:.9,rate:.95,
  voice:"Sat on the hill until the sun went down. I can only see light and dark now, and this one was very, very light. I'm keeping it.",
  scene:"photo",desc:"A sunset over rolling green hills, with the sun low on the horizon and a pink and orange sky. Wildflowers fill the grassy slope in front.",
  qa:[[/flower/,"White daisies, orange poppies and a few purple flowers fill the slope."],[/color|colour/,"A pink and orange sky, green hills, and bright wildflowers."],[/who|people|anyone/,"There are no people in this photo."],[/background|behind|sun|sky/,"Layers of hills fade into the distance under a glowing sun."]]},
 {id:"p8",who:"Theo",init:"T",col:"var(--b1)",ago:"2 days ago",pitch:1,rate:1,
  voice:"Forest walk with the cane today. It smelled like rain, and the leaves got so quiet. Somebody tell me what the light was doing.",
  scene:"photo",desc:"Looking straight up into a forest canopy, sunbeams slant down through bright green leaves between dark, twisting branches.",
  qa:[[/light|sun|beam/,"Rays of sunlight slant down through the leaves, making them glow bright green."],[/color|colour/,"Bright yellow-green leaves against dark brown branches."],[/who|people|anyone/,"There are no people in this photo, just the trees."],[/background|behind|tree/,"Tall, twisting trees fill the whole picture."]]},
];
export const NEWS: NewsStory[]=[
 {t:"Students build a talking campus map",b:"A student team made a phone map that announces building entrances and ramps as you walk. It's free and open source.",src:["Campus Paper (sample)","Tech Desk (sample)"]},
 {t:"Library adds free audio-described movie nights",b:"The main library will host monthly movie nights with audio description, so blind and low-vision guests can follow every scene. Snacks are free.",src:["City Paper (sample)","Library newsletter (sample)"]},
 {t:"Transit agency tests talking bus-stop signs",b:"Ten bus stops downtown will announce the next arrivals out loud when you press a button. Riders can leave feedback in a short phone survey.",src:["Local TV (sample)","Transit agency notice (sample)"]}
];
export const HELP: HelpItem[]=[
 {k:"rides",ic:"bus",t:"Rides: paratransit",b:"Under the ADA, public transit agencies that run regular buses must also offer paratransit, a shared door-to-door ride, for people whose disability keeps them from using the regular bus. You apply through your local transit agency.",src:"ADA National Network (live version links the official page)"},
 {k:"books",ic:"book",t:"Free audiobooks: Talking Books",b:"The Library of Congress's National Library Service lends talking books and players free by mail to people who are blind or can't read regular print. You can also download books to your phone.",src:"National Library Service, loc.gov/nls (live version links it)"},
 {k:"jobs",ic:"brief",t:"Job training: vocational rehabilitation",b:"Every state has a vocational rehabilitation agency that helps people with disabilities train for and find work. In California it's the Department of Rehabilitation.",src:"California Department of Rehabilitation (live version links it)"}
];
export const LEARN: Lesson[]=[
 {t:"Rubber-band labels for your kitchen",by:"from Dev",b:"Wrap one rubber band around the first jar, two around the second. Your fingers read the label in a second. Works for shampoo versus conditioner too."},
 {t:"Find the bottom of a cup with your finger",by:"from Rosa",b:"When pouring a drink, rest your fingertip just inside the rim. When you feel the liquid, stop. Use cold drinks while you practice."}
];
export const CIRCLES: Circle[]=[
 {t:"New to vision loss",n:"38 members",posts:["Ana: Week two with my cane. Today I made it to the coffee shop alone.","Sam: The first months are hard. It gets better, I promise. Ask me anything."]},
 {t:"Blind gamers",n:"112 members",posts:["Leo: Anyone tried the new audio racing game? The engine sounds tell you the turns."]}
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
