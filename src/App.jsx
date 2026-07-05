import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, X, Lock, Key, ShieldCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import UserDashboard from './components/UserDashboard';
import MovieDetailModal from './components/MovieDetailModal';
import SeatSelection from './components/SeatSelection';
import PaymentModal from './components/PaymentModal';
import AdminConsole from './components/AdminConsole';
import NotificationDrawer from './components/NotificationDrawer';
import AuthModal from './components/AuthModal';
import MyBookings from './components/MyBookings';

// Connect to Socket.io server (uses Vite proxy in dev, direct URL in production)
const API_BASE = import.meta.env.VITE_API_URL || '';
const socket = io(API_BASE, { autoConnect: false });

export default function App() {
  // Navigation / Role states
  const [activeView, setActiveView] = useState('user'); // 'user' | 'admin' | 'seats'
  
  // Security Authentication states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('iar_is_admin') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState(() => {
    return sessionStorage.getItem('iar_admin_password') || '';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // User Authentication states
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = sessionStorage.getItem('iar_current_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Data lists synced with backend APIs
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Active Transaction states
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeEditMovie, setActiveEditMovie] = useState(null);
  
  // Modals Visibility
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  
  // On-screen floating Toast Alerts
  const [toasts, setToasts] = useState([]);

  // Keep a stable ref of movies for socket event lookups
  const moviesRef = useRef(movies);
  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  // Load initial databases from Node Express Server
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const moviesRes = await fetch(`${API_BASE}/api/movies`);
        const moviesData = await moviesRes.json();
        setMovies(moviesData);

        const notificationsRes = await fetch(`${API_BASE}/api/notifications`);
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching data from API backend:', error);
        addToast('Connection Error', 'Failed to connect to the backend server API.', 'info');
      }
    };
    
    fetchPublicData();
  }, []);

  // Fetch admin bookings when logged in
  useEffect(() => {
    if (isAdminAuthenticated && adminPassword) {
      fetchBookings();
    }
  }, [isAdminAuthenticated, adminPassword]);

  const fetchBookings = async () => {
    try {
      const bookingsRes = await fetch(`${API_BASE}/api/bookings`, {
        headers: { 'x-admin-password': adminPassword }
      });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Connect WebSockets and setup event listeners
  useEffect(() => {
    socket.connect();

    socket.on('notification_received', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    socket.on('movie_added', (movie) => {
      setMovies((prev) => {
        if (prev.some((m) => m.id === movie.id)) return prev;
        return [...prev, movie];
      });
      addToast('New Release Alert!', `"${movie.title}" is now screening!`, 'info');
    });

    socket.on('movie_removed', (id) => {
      const deletedMovie = moviesRef.current.find((m) => m.id === id);
      const title = deletedMovie ? deletedMovie.title : 'Movie';
      setMovies((prev) => prev.filter((m) => m.id !== id));
      addToast('Release Ended', `"${title}" was removed from the catalog.`, 'info');
    });

    socket.on('movie_updated', (updatedMovie) => {
      setMovies((prev) =>
        prev.map((m) => (m.id === updatedMovie.id ? updatedMovie : m))
      );
      addToast('Catalog Updated', `"${updatedMovie.title}" details have been updated.`, 'info');
    });

    socket.on('booking_received', (booking) => {
      // Reload admin bookings if authenticated
      if (isAdminAuthenticated) {
        setBookings((prev) => {
          if (prev.some((b) => b.id === booking.id)) return prev;
          return [...prev, booking];
        });
      }
      const movieTitle = moviesRef.current.find((m) => m.id === booking.movieId)?.title || 'Movie';
      const seatsStr = booking.seats.map((s) => `${s.row}${s.number}`).join(', ');
      
      addToast(
        'New Ticket Booked!',
        `Admin Notice: Booked seats ${seatsStr} for "${movieTitle}".`,
        'admin'
      );
    });

    socket.on('booking_cancelled', ({ id, booking }) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      );
      const movieTitle = moviesRef.current.find((m) => m.id === booking.movieId)?.title || 'Movie';
      addToast(
        'Booking Refunded',
        `Ref ${booking.bookingRef} for "${movieTitle}" has been cancelled.`,
        'info'
      );
    });

    socket.on('booking_approved', ({ id, booking }) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'confirmed' } : b))
      );
      const movieTitle = moviesRef.current.find((m) => m.id === booking.movieId)?.title || 'Movie';
      addToast(
        'Booking Approved',
        `Ref ${booking.bookingRef} for "${movieTitle}" has been approved.`,
        'success'
      );
    });

    return () => {
      socket.off('notification_received');
      socket.off('movie_added');
      socket.off('movie_removed');
      socket.off('movie_updated');
      socket.off('booking_received');
      socket.off('booking_cancelled');
      socket.off('booking_approved');
      socket.disconnect();
    };
  }, [isAdminAuthenticated]);

  // Toast alert system helpers
  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Nav Switch Roles Checker
  const handleNavSwitch = (view) => {
    if (view === 'admin') {
      if (isAdminAuthenticated) {
        setActiveView('admin');
      } else {
        setLoginError('');
        setPasswordInput('');
        setShowLoginModal(true);
      }
    } else {
      setActiveView(view);
      setSelectedMovie(null);
    }
  };

  // Handle Admin Authorization request
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      if (res.ok) {
        setIsAdminAuthenticated(true);
        setAdminPassword(passwordInput);
        sessionStorage.setItem('iar_is_admin', 'true');
        sessionStorage.setItem('iar_admin_password', passwordInput);
        setShowLoginModal(false);
        setActiveView('admin');
        addToast('Admin Authenticated', 'Access granted to owner console.', 'admin');
      } else {
        setLoginError('Incorrect access key. Access denied.');
      }
    } catch (error) {
      setLoginError('Could not communicate with secure portal server.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword('');
    sessionStorage.removeItem('iar_is_admin');
    sessionStorage.removeItem('iar_admin_password');
    setActiveView('user');
    addToast('Admin Logged Out', 'Owner dashboard credentials cleared.', 'info');
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    sessionStorage.setItem('iar_current_user', JSON.stringify(userData));
    addToast('Authenticated', `Welcome back, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('iar_current_user');
    setActiveView('user');
    addToast('Logged Out', 'Successfully logged out.', 'info');
  };

  // Select movie detail triggers
  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setIsDetailModalOpen(true);
  };

  // Move from modal detail to seats selector
  const handleProceedToBooking = (movie, date, time) => {
    setSelectedMovie(movie);
    setSelectedDate(date);
    setSelectedTime(time);
    setSelectedSeats([]);
    setIsDetailModalOpen(false);
    setActiveView('seats');
  };

  // Seat toggle selection
  const handleSeatToggle = (seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.row === seat.row && s.number === seat.number);
      if (exists) {
        return prev.filter((s) => !(s.row === seat.row && s.number === seat.number));
      } else {
        return [...prev, seat];
      }
    });
  };

  // REST Write: Payment checkout booking success
  const handlePaymentSuccess = async (bookingRef, paidAmount, phoneNumber, utr) => {
    const payload = {
      bookingRef,
      movieId: selectedMovie.id,
      date: selectedDate.fullDate,
      time: selectedTime,
      seats: selectedSeats,
      amount: paidAmount,
      phoneNumber,
      utr
    };

    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      // Update local bookings state
      setBookings((prev) => {
        if (prev.some((b) => b.id === data.id)) return prev;
        return [...prev, data];
      });
      setSelectedSeats([]);
    } catch (error) {
      console.error('Error posting booking:', error);
      addToast('Booking Failure', 'Failed to store booking on server database.', 'info');
    }
  };

  // REST Write: Admin add movie
  const handleAddMovie = async (newMovie) => {
    try {
      const res = await fetch(`${API_BASE}/api/movies`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify(newMovie)
      });
      
      if (res.ok) {
        const data = await res.json();
        setMovies((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      } else if (res.status === 413) {
        addToast('Upload Error', 'Image size is too large. Please select a smaller poster file.', 'info');
      } else if (res.status === 401) {
        addToast('Error', 'Unauthorized admin action. Please check your passcode.', 'info');
      } else {
        addToast('Error', 'Failed to add movie to catalog.', 'info');
      }
    } catch (error) {
      console.error('Error adding movie to server:', error);
      addToast('Upload Error', 'Could not post new release to server database.', 'info');
    }
  };

  // REST Write: Admin delete movie
  const handleDeleteMovie = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/movies/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword }
      });
      
      if (res.ok) {
        setMovies((prev) => prev.filter((m) => m.id !== id));
      } else {
        addToast('Error', 'Unauthorized admin action.', 'info');
      }
    } catch (error) {
      console.error('Error deleting movie:', error);
      addToast('Deletion Error', 'Failed to remove movie from the server.', 'info');
    }
  };

  // REST Write: Admin update movie details
  const handleUpdateMovie = async (id, updatedMovie) => {
    try {
      const res = await fetch(`${API_BASE}/api/movies/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify(updatedMovie)
      });
      
      if (res.ok) {
        const data = await res.json();
        setMovies((prev) =>
          prev.map((m) => (m.id === id ? data : m))
        );
      } else if (res.status === 413) {
        addToast('Update Error', 'Image size is too large. Please select a smaller poster file.', 'info');
      } else if (res.status === 401) {
        addToast('Error', 'Unauthorized admin action. Please check your passcode.', 'info');
      } else {
        addToast('Error', 'Failed to update movie details.', 'info');
      }
    } catch (error) {
      console.error('Error updating movie details:', error);
      addToast('Update Error', 'Could not apply catalog updates on server database.', 'info');
    }
  };

  // REST Write: Admin cancel/refund ticket
  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'x-admin-password': adminPassword }
      });
      
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
        );
      } else {
        addToast('Error', 'Unauthorized admin action.', 'info');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      addToast('Cancel Error', 'Could not process refund status on server.', 'info');
    }
  };

  // REST Write: Admin approve booking
  const handleApproveBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/approve`, {
        method: 'POST',
        headers: { 'x-admin-password': adminPassword }
      });
      
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
        );
        addToast('Payment Approved', 'Booking status updated to confirmed.', 'success');
      } else {
        addToast('Error', 'Unauthorized admin action.', 'info');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      addToast('Approval Error', 'Could not approve booking on server.', 'info');
    }
  };

  // Clear unread notices and reset notification drawer
  const handleOpenDrawer = () => {
    setIsNotifDrawerOpen(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/clear`, {
        method: 'POST',
        headers: { 'x-admin-password': adminPassword }
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="app-container">
      
      {/* Navbar UI */}
      <nav className="navbar">
        <a href="#" className="brand" onClick={() => handleNavSwitch('user')}>
          <div className="brand-icon">
            <Sparkles size={20} color="#fff" />
          </div>
          <span className="brand-text">Infinity Aura</span>
        </a>

        <div className="nav-actions">
          <button className="nav-link" onClick={() => handleNavSwitch('user')}>
            Browse Movies
          </button>

          {currentUser ? (
            <>
              <button 
                className={`nav-link ${activeView === 'my-bookings' ? 'active' : ''}`} 
                onClick={() => handleNavSwitch('my-bookings')}
              >
                My Bookings
              </button>
              <span className="nav-user-name" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                Hi, {currentUser.name}
              </span>
              <button 
                className="nav-link" 
                onClick={handleLogout}
                style={{ color: 'var(--accent-pink)' }}
              >
                Logout
              </button>
            </>
          ) : (
            <button className="nav-link" onClick={() => setShowAuthModal(true)}>
              Login / Sign Up
            </button>
          )}
          
          {/* Admin switcher */}
          <div className="role-switcher">
            <button
              className={`role-btn ${activeView !== 'admin' ? 'active' : ''}`}
              onClick={() => handleNavSwitch('user')}
            >
              User Booking
            </button>
            <button
              className={`role-btn ${activeView === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavSwitch('admin')}
            >
              Admin Panel
            </button>
          </div>

          {/* Admin Logout Button */}
          {isAdminAuthenticated && activeView === 'admin' && (
            <button 
              className="role-btn" 
              style={{ background: 'transparent', color: 'var(--accent-pink)', border: '1px solid rgba(244, 63, 94, 0.2)' }}
              onClick={handleAdminLogout}
            >
              Lock Panel
            </button>
          )}

          {/* Unread Alert Drawer Badge */}
          <button className="notification-badge-btn" onClick={handleOpenDrawer} title="View activity logs">
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge-dot" />}
          </button>
        </div>
      </nav>

      {/* Primary view coordinates */}
      <main className="main-content">
        {activeView === 'user' && (
          <UserDashboard
            movies={movies}
            onSelectMovie={handleSelectMovie}
            isAdmin={isAdminAuthenticated}
            onDeleteMovie={handleDeleteMovie}
          />
        )}

        {activeView === 'seats' && selectedMovie && (
          <SeatSelection
            movie={selectedMovie}
            date={selectedDate}
            time={selectedTime}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
            onCancel={() => handleNavSwitch('user')}
            onProceedToCheckout={() => {
              if (!currentUser) {
                setShowAuthModal(true);
                addToast('Authentication Required', 'Please log in or sign up to book tickets.', 'info');
              } else {
                setIsPaymentModalOpen(true);
              }
            }}
            bookings={bookings}
          />
        )}

        {activeView === 'my-bookings' && currentUser && (
          <MyBookings
            currentUser={currentUser}
            API_BASE={API_BASE}
            movies={movies}
          />
        )}

        {activeView === 'admin' && isAdminAuthenticated && (
          <AdminConsole
            movies={movies}
            bookings={bookings}
            onAddMovie={handleAddMovie}
            onDeleteMovie={handleDeleteMovie}
            onUpdateMovie={handleUpdateMovie}
            onCancelBooking={handleCancelBooking}
            onApproveBooking={handleApproveBooking}
            activeEditMovie={activeEditMovie}
            onClearEditMovie={() => setActiveEditMovie(null)}
          />
        )}
      </main>

      {/* Popups & Drawers */}
      {isDetailModalOpen && selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setIsDetailModalOpen(false)}
          onProceedToBooking={handleProceedToBooking}
          isAdmin={isAdminAuthenticated}
          onDeleteMovie={handleDeleteMovie}
          onEditMovie={(movie) => {
            setActiveEditMovie(movie);
            handleNavSwitch('admin');
          }}
        />
      )}

      {isPaymentModalOpen && selectedMovie && (
        <PaymentModal
          movie={selectedMovie}
          date={selectedDate}
          time={selectedTime}
          seats={selectedSeats}
          currentUser={currentUser}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onClearAll={handleClearNotifications}
      />

      {/* Lock Admin Authorization Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="payment-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowLoginModal(false)}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="brand-icon" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))', boxShadow: '0 0 15px rgba(244, 63, 94, 0.3)' }}>
                <Lock size={20} color="#fff" />
              </div>
              <h2 className="payment-title" style={{ margin: 0 }}>Secure Admin Access</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
                Please enter your administrator passkey to view sales history, manage movie catalogs, and process bookings.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="payment-form">
              <div className="form-group">
                <label>Admin Passkey</label>
                <input
                  type="password"
                  required
                  placeholder="Enter administrator passcode"
                  className="form-input"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
              </div>

              {loginError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-pink)', fontSize: '0.75rem', fontWeight: '600', marginTop: '4px' }}>
                  <Key size={12} />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="checkout-btn"
                style={{ marginTop: '1rem', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))' }}
              >
                Authenticate Owner
              </button>
            </form>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        API_BASE={API_BASE}
      />

      {/* Floating Toast Notification alerts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-message ${toast.type === 'admin' ? 'admin-toast' : 'info-toast'}`}>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <p className="toast-body">{toast.message}</p>
            </div>
            <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
