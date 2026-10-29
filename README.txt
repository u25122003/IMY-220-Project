Project name: Pick n Post
Student name: Keagan Coetzee, u25122003
GitHub repo: https://github.com/u25122003/IMY-220-Project.git

Description: Pick n Post is a photo sharing website where users share photos, organise them into
albums, add friends and follow a local (friends) or global activity feed.

Structure:

- /frontend: Vite + React app styled with TailwindCSS. All data is loaded with the native Fetch API
  through relative /api routes (src/api.js). forwards /api to the backend.

- /backend: Express.js API using the official "mongodb" package.
    server.js       -> Express app, mounts the routes
    db.js           -> MongoDB connection and helpers
    api/*.js        -> CRUD functions for each collection (users, posts, albums, activity, reports)
    routes/*.js     -> Express routes that call the api functions
    seed.js         -> fills the database with the starting data

Database: MongoDB Atlas (database "PhotoShare"). The connection string is in docker-compose.yml
(MONGO_URI) and in backend/.env.
Collections: users, posts (comments are stored inside each post), albums, activity, reports, reportReasons.

-------------------------
HOW TO RUN WITH DOCKER 
--------------------------
Build the images and start both containers:
    docker compose up --build

Open http://localhost:5173 in your browser. The API runs on http://localhost:3000.

Stop the containers:
    docker compose down

Reset the database to the starting data (run this once after the first build, and any time
you want to start fresh):
    docker compose run --rm backend npm run seed

----------------------------------------------------------------------------------------------
TEST ACCOUNTS (all created by seed.js - passwords are stored as plain text for marking)
----------------------------------------------------------------------------------------------
    test@test.com     / test1234      (required test account: 1 post, 1 album, 2 friends,
                                       pending friend request from Ella)
    admin@test.com    / admin123      (administrator - sees the Admin tab)

    Regular users log in with their first name @gmail.com and their surname@123:
    keagan@gmail.com  / Coetzee@123   (6 friends, pending friend request from Simon)
    alissa@gmail.com  / Grobler@123
    jared@gmail.com   / Beyleveldt@123
    ben@gmail.com     / Cornell@123
    matthew@gmail.com / Shepherd@123
    grace@gmail.com   / Lacock@123
    ella@gmail.com    / Jurgenson@123
    ethan@gmail.com   / Maynard@123
    simon@gmail.com   / Norton@123
    lourens@gmail.com / Coetzee@123
    ross@gmail.com    / Coetzee@123

Starting data: 13 users, 26 posts with comments, 8 albums, 16 friendships, 2 pending friend
requests, 4 report reasons and 4 reports (Ethan's shop run photo has 3 reports, so it is hidden
in the feed). Post images are in frontend/public/assets/posts.
