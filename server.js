import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

const seedMoviesList = [
  {
    id: 1,
    title: "Inception",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
    poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop",
    genre: ["Action", "Sci-Fi", "Thriller"],
    duration: 148,
    rating: 8.8,
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    timings: ["10:30 AM", "1:45 PM", "5:00 PM", "8:15 PM", "11:30 PM"],
    language: "English",
    priceTier: { standard: 0, premium: 0, vip: 0 }
  },
  {
    id: 2,
    title: "Interstellar",
    description: "When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival.",
    poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop",
    genre: ["Adventure", "Drama", "Sci-Fi"],
    duration: 169,
    rating: 8.7,
    director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    timings: ["11:00 AM", "3:00 PM", "6:30 PM", "10:00 PM"],
    language: "English",
    priceTier: { standard: 0, premium: 0, vip: 0 }
  },
  {
    id: 3,
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    poster: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1547483238-2cbf88ba2443?q=80&w=1200&auto=format&fit=crop",
    genre: ["Action", "Adventure", "Sci-Fi"],
    duration: 166,
    rating: 8.9,
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler"],
    timings: ["12:00 PM", "3:45 PM", "7:30 PM", "11:15 PM"],
    language: "English",
    priceTier: { standard: 0, premium: 0, vip: 0 }
  },
  {
    id: 4,
    title: "The Dark Knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    poster: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=600&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop",
    genre: ["Action", "Crime", "Drama"],
    duration: 152,
    rating: 9.0,
    director: "Christopher Nolan",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Maggie Gyllenhaal"],
    timings: ["10:00 AM", "1:15 PM", "4:30 PM", "7:45 PM", "11:00 PM"],
    language: "English",
    priceTier: { standard: 0, premium: 0, vip: 0 }
  }
];

// Database read/write helpers
async function readDb() {
  try {
    const raw = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { movies: [], bookings: [], notifications: [] };
  }
}

async function writeDb(data) {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing database file:', error);
  }
}

// Live activity logs helper
async function addNotification(message, type = 'info') {
  const db = await readDb();
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const newNotif = {
    id: Date.now() + Math.random(),
    message,
    time: timeStr,
    type,
    unread: true
  };
  
  db.notifications = [newNotif, ...(db.notifications || [])];
  await writeDb(db);
  
  // Broadcast live via Socket.io
  io.emit('notification_received', newNotif);
}

// Admin Security Middleware
function verifyAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  const adminPass = process.env.ADMIN_PASSWORD || 'auraAdmin123';
  if (password === adminPass) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Admin password required' });
  }
}

// Socket IO Setup
io.on('connection', (socket) => {
  console.log(`[SOCKET] Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[SOCKET] Socket disconnected: ${socket.id}`);
  });
});

// ==========================================
// REST API ROUTES
// ==========================================

// Cryptographic Password Hashing (using built-in PBKDF2)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) return false;
  const [salt, hash] = storedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// ------------------------------------------
// USER AUTHENTICATION API
// ------------------------------------------

// 1. User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const db = await readDb();
    const { name, phoneNumber, password } = req.body;

    if (!name || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Name, Phone Number, and Password are required.' });
    }

    if (!db.users) {
      db.users = [];
    }

    const exists = db.users.some((u) => u.phoneNumber === phoneNumber);
    if (exists) {
      return res.status(400).json({ error: 'Phone number is already registered.' });
    }

    const newUser = {
      id: Date.now() + Math.random(),
      name,
      phoneNumber,
      password: hashPassword(password)
    };

    db.users.push(newUser);
    await writeDb(db);

    console.log(`[AUTH] User registered: ${name} (${phoneNumber})`);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const db = await readDb();
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    if (!db.users) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const user = db.users.find((u) => u.phoneNumber === phoneNumber);
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    console.log(`[AUTH] User logged in: ${user.name} (${phoneNumber})`);
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Get User Bookings
app.get('/api/bookings/user/:phoneNumber', async (req, res) => {
  try {
    const db = await readDb();
    const phoneNumber = req.params.phoneNumber;
    const userBookings = (db.bookings || []).filter((b) => b.phoneNumber === phoneNumber);
    res.json(userBookings);
  } catch (error) {
    console.error('Fetch user bookings error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Admin Login endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || 'auraAdmin123';
  if (password === adminPass) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

// 1. Get running movies list (Public)
app.get('/api/movies', async (req, res) => {
  const db = await readDb();
  res.json(db.movies);
});

// 2. Add a running movie (Admin Protected)
app.post('/api/movies', verifyAdmin, async (req, res) => {
  const db = await readDb();
  const newMovie = req.body;
  
  if (!newMovie.title || !newMovie.description || !newMovie.poster) {
    return res.status(400).json({ error: 'Title, Description, and Poster URL are required.' });
  }

  const nextId = db.movies.reduce((max, m) => (m.id > max ? m.id : max), 0) + 1;
  newMovie.id = nextId;
  
  db.movies.push(newMovie);
  await writeDb(db);
  
  io.emit('movie_added', newMovie);

  const message = `Now Showing: "${newMovie.title}" is now screening! Genres: ${newMovie.genre.join(', ')}. Rating: ${newMovie.rating.toFixed(1)}/10.`;
  await addNotification(message, 'add_movie');

  console.log(`[CATALOG] Movie uploaded by admin: ${newMovie.title}`);
  res.status(201).json(newMovie);
});

// 3. Remove a movie (Admin Protected)
app.delete('/api/movies/:id', verifyAdmin, async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id);
  const movie = db.movies.find((m) => m.id === id);

  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' });
  }

  db.movies = db.movies.filter((m) => m.id !== id);
  await writeDb(db);

  io.emit('movie_removed', id);

  const message = `System Update: "${movie.title}" scheduling has ended and is no longer available.`;
  await addNotification(message, 'info');

  console.log(`[CATALOG] Movie deleted by admin: ${movie.title}`);
  res.json({ success: true, message: `Removed movie ID ${id}` });
});

// 3.5 Update a movie (Admin Protected)
app.put('/api/movies/:id', verifyAdmin, async (req, res) => {
  const db = await readDb();
  const id = parseInt(req.params.id);
  const index = db.movies.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Movie not found' });
  }

  const updatedMovie = { ...db.movies[index], ...req.body, id };
  db.movies[index] = updatedMovie;
  await writeDb(db);

  io.emit('movie_updated', updatedMovie);

  const message = `System Update: "${updatedMovie.title}" details have been updated by admin.`;
  await addNotification(message, 'info');

  console.log(`[CATALOG] Movie updated by admin: ${updatedMovie.title}`);
  res.json(updatedMovie);
});

// 4. Get booking transactions (Admin Protected)
app.get('/api/bookings', verifyAdmin, async (req, res) => {
  const db = await readDb();
  res.json(db.bookings);
});

// 5. Create a ticket booking (Public checkout)
app.post('/api/bookings', async (req, res) => {
  const db = await readDb();
  const { bookingRef, movieId, date, time, seats, amount, phoneNumber, utr } = req.body;

  if (!bookingRef || !movieId || !date || !time || !seats || !amount) {
    return res.status(400).json({ error: 'Missing booking details' });
  }

  const newBooking = {
    id: Date.now(),
    bookingRef,
    movieId,
    date,
    time,
    seats,
    amount,
    phoneNumber,
    utr,
    status: utr ? 'pending' : 'confirmed'
  };

  db.bookings.push(newBooking);
  await writeDb(db);

  const movie = db.movies.find((m) => m.id === movieId);
  const movieTitle = movie ? movie.title : 'Unknown Movie';
  const seatList = seats.map((s) => `${s.row}${s.number}`).join(', ');

  io.emit('booking_received', newBooking);

  const clientMsg = utr
    ? `Booking Submitted! Reference ${bookingRef} for ${movieTitle} on ${date} at ${time}. Status: Pending Verification.`
    : `Booking Confirmed! Reference ${bookingRef} for ${movieTitle} on ${date} at ${time}. Seats: ${seatList}.`;
  await addNotification(clientMsg, 'booking');

  const adminMsg = utr
    ? `Pending Verification: A user submitted booking ${bookingRef} using UPI (UTR: ${utr}) for ${movieTitle}. Amount: ₹${amount.toFixed(2)}.`
    : `Revenue Update: A user booked ${seats.length} seats (${seatList}) for ${movieTitle}. Paid: ₹${amount.toFixed(2)}.`;
  await addNotification(adminMsg, 'payment');

  console.log('\n==================================================================');
  console.log('[NOTIFICATION GATEWAY] - TRIGGERING SYSTEM NOTIFICATIONS');
  if (utr) {
    console.log(`💬 [WHATSAPP OUTBOX] Sent to User (Ph: ${phoneNumber}):`);
    console.log(`   🎟️ Infinity Aura Reservations 🎟️`);
    console.log(`   Dear Customer, your booking ref ${bookingRef} is received.`);
    console.log(`   We are verifying your UPI transaction UTR: ${utr}.`);
    console.log(`   Seats: ${seatList} | Time: ${date} at ${time}`);
    console.log(`   Amount: ₹${amount.toFixed(2)}`);
  } else {
    console.log(`📩 [EMAIL OUTBOX] Sent to User:`);
    console.log(`   Subject: Booking Confirmed - Infinity Aura Reservations`);
    console.log(`   Dear Customer, your ticket for "${movieTitle}" is confirmed!`);
    console.log(`   Seats: ${seatList} | Time: ${date} at ${time} | Ref: ${bookingRef}`);
    console.log(`   Paid: ₹${amount.toFixed(2)}`);
  }
  console.log('------------------------------------------------------------------');
  console.log(`📱 [SMS OUTBOX] Sent to Admin (Owner):`);
  console.log(`   New seats booked! Movie: "${movieTitle}" | Seats: ${seatList}`);
  console.log(`   Transaction Amount: +₹${amount.toFixed(2)} | Reference: ${bookingRef}`);
  console.log('==================================================================\n');

  res.status(201).json(newBooking);
});

// 6. Approve booking (Admin Protected)
app.post('/api/bookings/:id/approve', verifyAdmin, async (req, res) => {
  const db = await readDb();
  const bookingId = parseInt(req.params.id);
  const booking = db.bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'confirmed';
  await writeDb(db);

  const movie = db.movies.find((m) => m.id === booking.movieId);
  const movieTitle = movie ? movie.title : 'Unknown Movie';
  const seatList = booking.seats.map((s) => `${s.row}${s.number}`).join(', ');

  io.emit('booking_approved', { id: bookingId, booking });

  const clientMsg = `Booking Approved! Reference ${booking.bookingRef} for ${movieTitle} is confirmed. Seats: ${seatList}.`;
  await addNotification(clientMsg, 'booking');

  const adminMsg = `Revenue Confirmed: Admin approved UPI booking ref ${booking.bookingRef} (UTR: ${booking.utr}). Amount: +₹${booking.amount.toFixed(2)}.`;
  await addNotification(adminMsg, 'payment');

  console.log('\n==================================================================');
  console.log('[NOTIFICATION GATEWAY] - UPI TRANSACTION APPROVED');
  console.log(`💬 [WHATSAPP OUTBOX] Sent to User (Ph: ${booking.phoneNumber}):`);
  console.log(`   🎟️ Infinity Aura Reservations 🎟️`);
  console.log(`   Dear Customer, your booking ref ${booking.bookingRef} has been APPROVED!`);
  console.log(`   Seats: ${seatList} | Time: ${booking.date} at ${booking.time} | Ref: ${booking.bookingRef}`);
  console.log(`   Thank you for your payment of ₹${booking.amount.toFixed(2)}.`);
  console.log('==================================================================\n');

  res.json({ success: true, booking });
});

// 6. Cancel booking (Admin Protected)
app.post('/api/bookings/:id/cancel', verifyAdmin, async (req, res) => {
  const db = await readDb();
  const bookingId = parseInt(req.params.id);
  const booking = db.bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'cancelled';
  await writeDb(db);

  const movie = db.movies.find((m) => m.id === booking.movieId);
  const movieTitle = movie ? movie.title : 'Unknown Movie';
  const seatList = booking.seats.map((s) => `${s.row}${s.number}`).join(', ');

  io.emit('booking_cancelled', { id: bookingId, booking });

  const userMsg = `Refund Processed: Ticket ref ${booking.bookingRef} for ${movieTitle} (${seatList}) has been cancelled & refunded.`;
  await addNotification(userMsg, 'info');

  const adminMsg = `Admin Event: Booking ref ${booking.bookingRef} was cancelled. Seats ${seatList} for ${movieTitle} are released.`;
  await addNotification(adminMsg, 'admin');

  console.log('\n==================================================================');
  console.log('[NOTIFICATION GATEWAY] - REFUND NOTIFICATION SENT');
  console.log(`📩 [EMAIL OUTBOX] Sent to User:`);
  console.log(`   Subject: Refund Processed - Infinity Aura Reservations`);
  console.log(`   Your booking ${booking.bookingRef} has been cancelled.`);
  console.log(`   Refund of ₹${booking.amount.toFixed(2)} is processed.`);
  console.log('------------------------------------------------------------------');
  console.log(`📱 [SMS OUTBOX] Sent to Admin (Owner):`);
  console.log(`   Cancellation ref ${booking.bookingRef} processed. Seats: ${seatList}`);
  console.log(`   Refund issued: -₹${booking.amount.toFixed(2)}`);
  console.log('==================================================================\n');

  res.json({ success: true, booking });
});

// 7. Get notifications (Public)
app.get('/api/notifications', async (req, res) => {
  const db = await readDb();
  res.json(db.notifications || []);
});

// 8. Clear notification log (Admin Protected)
app.post('/api/notifications/clear', verifyAdmin, async (req, res) => {
  const db = await readDb();
  db.notifications = [];
  await writeDb(db);
  res.json({ success: true });
});

// 9. Read raw seed data reset helper
app.post('/api/reset', async (req, res) => {
  const defaultDb = {
    movies: seedMoviesList,
    bookings: [],
    notifications: []
  };
  await writeDb(defaultDb);
  res.json({ success: true });
});

// Serve static files from the React frontend build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback all non-API GET requests to index.html for React Router compatibility
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Dynamic Port Assignment
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Infinity Aura Back-End Active on http://localhost:${PORT}`);
  console.log('📡 Socket.io Listener configured. REST routes ready.\n');
});
