import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import { connectDB, collection, closeDB } from './db.js';

dotenv.config();

// Fixed ids so the data is the same every time the database is reseeded
const userId = (n) => new ObjectId(`66${String(n).padStart(22, '0')}`);
const albumId = (n) => new ObjectId(`661${String(n).padStart(21, '0')}`);
const postId = (n) => new ObjectId(`662${String(n).padStart(21, '0')}`);
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

// ---USERS
// Regular users log in with firstname@gmail.com and Lastname@123
function person(n, name, username, bio, avatar = 'default.svg', login = {}) {
  const [first, ...rest] = name.split(' ');
  return {
    _id: userId(n),
    name,
    username,
    email: login.email || `${first.toLowerCase()}@gmail.com`,
    password: login.password || `${rest.join(' ')}@123`,
    pronouns: '',
    bio,
    avatar: `/assets/avatars/${avatar}`,
    friends: [],
    friendRequests: [],
    isAdmin: Boolean(login.isAdmin),
    createdAt: hoursAgo(1500 - n * 10)
  };
}

const u = {
  keagan: person(1, 'Keagan Coetzee', 'keags', 'Multimedia student. Coffee enthusiast & amateur 3D artist.', 'keagan.svg'),
  alissa: person(2, 'Alissa Grobler', 'alissa_g', 'Living life to the fullest.', 'alissa.svg'),
  jared: person(3, 'Jared Beyleveldt', 'jared.b', 'Beach days and good company.'),
  ben: person(4, 'Ben Cornell', 'ben_cornell', 'Always up for a road trip.'),
  matthew: person(5, 'Matthew Shepherd', 'matt.shepherd', 'Music lover. Find me at the next open mic night.'),
  grace: person(6, 'Grace Lacock', 'grace_lacock', 'Chasing sunsets and low tides.'),
  ella: person(7, 'Ella Jurgenson', 'ella.j', 'Collecting memories one trip at a time.'),
  ethan: person(8, 'Ethan Maynard', 'ethan_maynard', 'Weekend explorer and part-time chef.'),
  simon: person(9, 'Simon Norton', 'simon.norton', 'Night owl with a camera.'),
  lourens: person(10, 'Lourens Coetzee', 'lourens_c', 'Looking for the next off-road adventure.', 'lourens.svg'),
  ross: person(11, 'Ross Coetzee', 'ross_c', 'Happiest in the bush.'),
  // Accounts required for marking
  test: person(12, 'Test User', 'testuser', 'Just here to try things out.', 'default.svg', { email: 'test@test.com', password: 'test1234' }),
  admin: person(13, 'Site Admin', 'admin', 'Keeping Pick n Post friendly.', 'default.svg', { email: 'admin@test.com', password: 'admin123', isAdmin: true })
};

// Friendships go both ways, so each pair is added to both users
const friendships = [
  ['keagan', 'alissa'], ['keagan', 'jared'], ['keagan', 'ben'], ['keagan', 'matthew'], ['keagan', 'lourens'], ['keagan', 'ross'],
  ['alissa', 'grace'], ['alissa', 'ella'], ['grace', 'ella'],
  ['jared', 'ben'], ['jared', 'simon'], ['ben', 'ethan'], ['matthew', 'simon'], ['lourens', 'ross'],
  ['test', 'grace'], ['test', 'ethan']
];
for (const [a, b] of friendships) {
  u[a].friends.push(u[b]._id);
  u[b].friends.push(u[a]._id);
}

// Pending requests: [from, to] - the request is stored on the person receiving it
const requests = [['simon', 'keagan'], ['ella', 'test']];
for (const [from, to] of requests) u[to].friendRequests.push(u[from]._id);

const users = Object.values(u);
const nameOf = (id) => users.find(user => user._id.equals(id)).name;

// ---POSTS (comments are stored inside each post)
const comment = (user, text, h) => ({ _id: new ObjectId(), userId: u[user]._id, text, createdAt: hoursAgo(h) });

function post(n, author, image, caption, hashtags, h, comments = []) {
  return { _id: postId(n), authorId: u[author]._id, image: `/assets/posts/${image}`, caption, hashtags, comments, createdAt: hoursAgo(h) };
}

const posts = [
  // Lourens - game drive
  post(1, 'lourens', 'giraffe.jpg', 'Spotted this gentle giant on our game drive.', ['#safari', '#wildlife', '#photography'], 480, [
    comment('keagan', 'Such a beautiful shot!', 470),
    comment('ross', 'He walked right past us, what luck.', 460)
  ]),
  post(2, 'lourens', 'elephant.jpg', 'Way closer than I expected. No zoom lens needed!', ['#safari', '#elephant', '#wildlife'], 478, [
    comment('ross', 'Those ears are massive.', 440),
    comment('keagan', 'That is unreal, how close were you?', 435)
  ]),
  post(3, 'lourens', 'rhinos.jpg', 'Traffic jam, bushveld style.', ['#safari', '#rhino', '#roadtrip'], 476, [
    comment('keagan', 'Worth every minute of waiting.', 430)
  ]),
  // Ross
  post(4, 'ross', 'waterhole.jpg', 'Still water and no wind. Perfect afternoon at the dam.', ['#landscape', '#nature', '#safari'], 474, [
    comment('lourens', 'We should have stayed longer.', 420)
  ]),
  post(5, 'ross', 'formal-night.jpg', 'Suited up for the big night.', ['#formal', '#throwback', '#friends'], 300, [
    comment('keagan', 'Throwback of the century.', 290),
    comment('lourens', 'Cleanest group photo of the year.', 280)
  ]),
  post(6, 'ross', 'catch-up.jpg', 'Finally caught up with this guy after months.', ['#friends', '#weekend'], 30, [
    comment('keagan', 'About time!', 25)
  ]),
  // Ella
  post(7, 'ella', 'safari-mirror.jpg', 'Behind the lens for once on the drive through the reserve.', ['#photography', '#roadtrip', '#safari'], 472, [
    comment('grace', 'The photographer finally gets photographed.', 410)
  ]),
  post(8, 'ella', 'beach-day.jpg', 'Low tide walks are the best walks.', ['#beach', '#summer', '#holiday'], 170, [
    comment('alissa', 'Take me back!', 160),
    comment('grace', 'That sky is perfect.', 150)
  ]),
  post(9, 'ella', 'signing-the-wall.jpg', 'Left our mark on the most famous wall in town.', ['#roadtrip', '#memories', '#holiday'], 96, [
    comment('grace', 'Did you find a spot for our names too?', 90),
    comment('alissa', 'Love this place.', 80)
  ]),
  // Jared
  post(10, 'jared', 'the-boys.jpg', 'Sunny afternoon with the boys.', ['#friends', '#summer'], 260, [
    comment('ben', 'Legendary day.', 255),
    comment('simon', 'Need to do this again soon.', 250)
  ]),
  post(11, 'jared', 'strawberries.jpg', 'Strawberry season is officially here.', ['#strawberries', '#weekend', '#market'], 250, [
    comment('keagan', 'Save me a punnet!', 245),
    comment('ben', 'How many did you end up buying?', 240)
  ]),
  // Matthew
  post(12, 'matthew', 'hangout.jpg', 'Movie night turned into a whole evening of catching up.', ['#friends', '#nightin'], 240, [
    comment('keagan', 'Good times.', 235),
    comment('simon', 'Missed this one, next time.', 230)
  ]),
  // Only photo in Matthew's "Rooftop Sunsets" album - delete it to demo the album being deleted too
  post(13, 'matthew', 'rooftop-sunset.jpg', 'Golden hour from the rooftop.', ['#sunset', '#city', '#friends'], 140, [
    comment('keagan', 'That sky is unreal.', 135)
  ]),
  // Ben - the squad selfie has 7 comments to demo "show earlier comments"
  post(14, 'ben', 'campus-selfie.jpg', 'Campus day out in the sun.', ['#campus', '#friends'], 200, [
    comment('jared', 'Great day!', 195),
    comment('keagan', 'Looking happy there.', 190)
  ]),
  post(15, 'ben', 'squad-selfie.jpg', 'Sunday squad.', ['#friends', '#weekend', '#selfie'], 60, [
    comment('keagan', 'Best Sunday in ages.', 55),
    comment('jared', 'We need to do this more often.', 50),
    comment('ethan', 'Everyone actually smiling for once!', 40),
    comment('jared', 'Where was my invite?', 36),
    comment('ben', 'Next Sunday, you are coming!', 34),
    comment('keagan', 'Great photo of all of us.', 28),
    comment('ethan', 'Frame this one.', 22)
  ]),
  // Grace
  post(16, 'grace', 'road-trip.jpg', 'Road trip mode: activated.', ['#roadtrip', '#friends'], 110, [
    comment('alissa', 'Where are you off to?', 105),
    comment('ella', 'Have the best time!', 100)
  ]),
  post(17, 'grace', 'car-crew.jpg', 'The car crew, ready for the long drive.', ['#roadtrip', '#friends', '#holiday'], 90, [
    comment('alissa', 'Best travel buddies.', 85),
    comment('ella', 'Snacks were elite.', 82)
  ]),
  // Ethan - the shop run has 3 reports, so it is hidden in the feed
  post(18, 'ethan', 'shop-run.jpg', 'Quick shop run before practice.', ['#friends', '#weekend'], 40, [
    comment('ben', 'Did you save me a snack?', 38)
  ]),
  post(19, 'ethan', 'dress-up.jpg', 'Dress-up day. Nobody held back.', ['#dressup', '#friends', '#throwback'], 150, [
    comment('ben', 'That hat is iconic.', 145),
    comment('test', 'Best costume award goes to...', 140)
  ]),
  // Simon
  post(20, 'simon', 'dorm-cone.jpg', 'Found a new room decoration. Do not ask.', ['#res', '#student', '#funny'], 130, [
    comment('jared', 'Classic.', 125),
    comment('matthew', 'It suits the room.', 120)
  ]),
  // Test user (required: at least 1 post)
  post(21, 'test', 'campsite.jpg', 'Quiet morning at the campsite before everyone woke up.', ['#camping', '#outdoors', '#bushveld'], 18, [
    comment('grace', 'Looks so peaceful.', 12),
    comment('ethan', 'Next time I am coming along.', 8)
  ]),
  // Alissa
  post(22, 'alissa', 'smoothie.jpg', 'Smoothie in the sun. Perfect afternoon.', ['#summer', '#weekend'], 45, [
    comment('keagan', 'That looks so good.', 42),
    comment('grace', 'Where is this?', 38)
  ]),
  post(23, 'alissa', 'cat.jpg', 'My study buddy refuses to let me work.', ['#cat', '#studybuddy'], 6, [
    comment('ella', 'That face!', 4),
    comment('keagan', 'Best study buddy ever.', 3)
  ]),
  // Keagan
  post(24, 'keagan', 'open-mic.jpg', 'Open mic night was a vibe. Great set from everyone.', ['#music', '#livemusic', '#openmic'], 220, [
    comment('matthew', 'Sounded amazing from the back.', 210),
    comment('jared', 'When is the next one?', 200)
  ]),
  post(25, 'keagan', 'lunch.jpg', 'Good food and good company.', ['#lunch', '#weekend'], 12, [
    comment('alissa', 'Such a lovely day.', 10)
  ]),
  post(26, 'keagan', 'milkshake.jpg', 'Milkshake stop on the way home.', ['#milkshake', '#treat'], 3, [
    comment('ben', 'Which flavour?', 2)
  ])
];

// ---ALBUMS (each album is created after the posts inside it)
function album(n, owner, name, description, hashtags, postNumbers, h) {
  return { _id: albumId(n), userId: u[owner]._id, name, description, hashtags, posts: postNumbers.map(postId), createdAt: hoursAgo(h) };
}

const albums = [
  album(1, 'lourens', 'Safari Trip', 'Highlights from our game drive through the reserve.', ['#safari', '#wildlife'], [1, 2, 3], 470),
  album(2, 'ross', 'Bushveld', 'Wide open spaces and the animals that live there.', ['#nature', '#bushveld'], [3, 4], 465),
  album(3, 'jared', 'Summer With The Boys', 'Sunny days and good company.', ['#summer', '#friends'], [10, 11], 245),
  album(4, 'matthew', 'Rooftop Sunsets', 'Golden hour from up high.', ['#sunset', '#city'], [13], 135),
  album(5, 'grace', 'Road Trips', 'Long drives, loud music and the best people.', ['#roadtrip', '#friends'], [16, 17], 85),
  album(6, 'ella', 'Beach Days', 'Sun, sand and trips along the coast.', ['#beach', '#holiday'], [8, 9], 90),
  album(7, 'keagan', 'Good Times', 'The people and places that make every weekend better.', ['#friends', '#memories'], [24, 25, 15], 11),
  album(8, 'test', 'Camping Weekends', 'Early mornings and campfire nights.', ['#camping', '#outdoors'], [21], 17)
];

// ---ACTIVITY is built from the posts and albums so the feed always matches the data
const activity = [
  ...posts.map(p => ({
    userId: p.authorId, type: 'post', postId: p._id, albumId: null,
    text: `${nameOf(p.authorId)} shared a new photo`, createdAt: p.createdAt
  })),
  ...albums.map(a => ({
    userId: a.userId, type: 'album', postId: null, albumId: a._id,
    text: `${nameOf(a.userId)} created the album ${a.name}`, createdAt: a.createdAt
  }))
];

// ---REPORTS
const reportReasons = ['Spam', 'Inappropriate content', 'Harassment or bullying', 'False information']
  .map(reason => ({ reason, createdAt: hoursAgo(2000) }));

const report = (post, reporter, reason, h) => ({ postId: postId(post), reporterId: u[reporter]._id, reason, createdAt: hoursAgo(h) });

const reports = [
  // Ethan's shop run has three reports, so it is hidden from the feed
  report(18, 'simon', 'Spam', 15),
  report(18, 'matthew', 'Inappropriate content', 10),
  report(18, 'ross', 'Spam', 6),
  // Ross's waterhole photo has a single report, so it still shows normally
  report(4, 'alissa', 'False information', 100)
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB(process.env.MONGO_URI);

    const data = { users, posts, albums, activity, reportReasons, reports };
    for (const [name, docs] of Object.entries(data)) {
      await collection(name).deleteMany({});
      await collection(name).insertMany(docs);
      console.log(`Inserted ${docs.length} ${name}`);
    }

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

seed();
