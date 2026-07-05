import React, { useState, useEffect } from 'react';
import { Plus, Trash, Film, DollarSign, Users, Calendar, AlertCircle, FileText, CheckCircle, Clock, Pencil } from 'lucide-react';

export default function AdminConsole({
  movies,
  bookings,
  onAddMovie,
  onDeleteMovie,
  onUpdateMovie,
  onCancelBooking,
  onApproveBooking,
  activeEditMovie,
  onClearEditMovie
}) {
  // Add Movie Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [banner, setBanner] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [duration, setDuration] = useState('');
  const [rating, setRating] = useState(8.0);
  const [director, setDirector] = useState('');
  const [castInput, setCastInput] = useState('');
  const [timingsInput, setTimingsInput] = useState('11:00 AM, 2:30 PM, 6:00 PM, 9:30 PM');

  // Custom movie price tiers (defaulting initially to 0 INR as requested)
  const [standardPrice, setStandardPrice] = useState(0);
  const [premiumPrice, setPremiumPrice] = useState(0);
  const [vipPrice, setVipPrice] = useState(0);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getSevenDaysLaterStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [language, setLanguage] = useState('English');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getSevenDaysLaterStr());

  // Edit Mode state
  const [editingMovie, setEditingMovie] = useState(null);

  useEffect(() => {
    if (activeEditMovie) {
      handleStartEdit(activeEditMovie);
      onClearEditMovie();
    }
  }, [activeEditMovie]);

  // Inline delete confirm states
  const [deletingMovieId, setDeletingMovieId] = useState(null);
  const [deleteTimeout, setDeleteTimeout] = useState(null);

  const handleDeleteClick = (movieId) => {
    if (deletingMovieId === movieId) {
      if (deleteTimeout) clearTimeout(deleteTimeout);
      setDeletingMovieId(null);
      onDeleteMovie(movieId);
    } else {
      setDeletingMovieId(movieId);
      const timeout = setTimeout(() => {
        setDeletingMovieId(null);
      }, 3500);
      setDeleteTimeout(timeout);
    }
  };

  const handleStartEdit = (movie) => {
    setEditingMovie(movie);
    setTitle(movie.title);
    setDescription(movie.description);
    setPoster(movie.poster);
    setBanner(movie.banner || '');
    setGenreInput(movie.genre.join(', '));
    setDuration(movie.duration.toString());
    setRating(movie.rating.toString());
    setDirector(movie.director || '');
    setCastInput(movie.cast.join(', '));
    setTimingsInput(movie.timings.join(', '));
    setStandardPrice(movie.priceTier?.standard || 0);
    setPremiumPrice(movie.priceTier?.premium || 0);
    setVipPrice(movie.priceTier?.vip || 0);
    setLanguage(movie.language || 'English');
    setStartDate(movie.startDate || getTodayStr());
    setEndDate(movie.endDate || getSevenDaysLaterStr());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingMovie(null);
    setTitle('');
    setDescription('');
    setPoster('');
    setBanner('');
    setGenreInput('');
    setDuration('');
    setRating(8.0);
    setDirector('');
    setCastInput('');
    setTimingsInput('11:00 AM, 2:30 PM, 6:00 PM, 9:30 PM');
    setStandardPrice(0);
    setPremiumPrice(0);
    setVipPrice(0);
    setLanguage('English');
    setStartDate(getTodayStr());
    setEndDate(getSevenDaysLaterStr());
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPoster(reader.result); // Read desktop image file as base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // Derive metrics
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((acc, b) => acc + b.amount, 0);

  const activeBookingsCount = bookings.filter((b) => b.status === 'confirmed').length;
  
  const totalSeatsBooked = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((acc, b) => acc + b.seats.length, 0);

  // Derive stats for movie sales chart
  const movieSalesData = movies.map((movie) => {
    const soldCount = bookings
      .filter((b) => b.movieId === movie.id && b.status === 'confirmed')
      .reduce((acc, b) => acc + b.seats.length, 0);
    return {
      title: movie.title,
      ticketsSold: soldCount
    };
  });

  const maxTicketsSold = Math.max(...movieSalesData.map((d) => d.ticketsSold), 5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || !poster) {
      alert('Please fill in at least Title, Description, and select a Poster image file');
      return;
    }

    const genre = genreInput.split(',').map((g) => g.trim()).filter((g) => g !== '');
    const cast = castInput.split(',').map((c) => c.trim()).filter((c) => c !== '');
    const timings = timingsInput.split(',').map((t) => t.trim()).filter((t) => t !== '');

    const moviePayload = {
      title,
      description,
      poster,
      banner: banner || poster, // Fallback banner
      genre: genre.length > 0 ? genre : ['Drama'],
      duration: parseInt(duration) || 120,
      rating: parseFloat(rating) || 7.5,
      director,
      cast,
      timings: timings.length > 0 ? timings : ['2:30 PM', '8:00 PM'],
      language: language || 'English',
      startDate,
      endDate,
      priceTier: { 
        standard: parseFloat(standardPrice) || 0, 
        premium: parseFloat(premiumPrice) || 0, 
        vip: parseFloat(vipPrice) || 0 
      }
    };

    if (editingMovie) {
      onUpdateMovie(editingMovie.id, moviePayload);
      setEditingMovie(null);
    } else {
      const newMovie = {
        id: Math.max(...movies.map((m) => m.id), 0) + 1,
        ...moviePayload
      };
      onAddMovie(newMovie);
    }

    // Reset Form
    setTitle('');
    setDescription('');
    setPoster('');
    setBanner('');
    setGenreInput('');
    setDuration('');
    setRating(8.0);
    setDirector('');
    setCastInput('');
    setTimingsInput('11:00 AM, 2:30 PM, 6:00 PM, 9:30 PM');
    setStandardPrice(0);
    setPremiumPrice(0);
    setVipPrice(0);
    setLanguage('English');
    setStartDate(getTodayStr());
    setEndDate(getSevenDaysLaterStr());
  };

  return (
    <div className="admin-grid">
      <div className="catalog-title">
        <h1>Administrator Dashboard</h1>
        <p>Manage showtimes, update timings, review sales analytics, and catalog active releases.</p>
      </div>

      {/* Analytics Cards */}
      <div className="analytics-cards">
        <div className="analytics-card">
          <div className="analytics-card-info">
            <p>Total Revenue</p>
            <h3>₹{totalRevenue.toFixed(2)}</h3>
          </div>
          <div className="analytics-card-icon">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-info">
            <p>Tickets Sold</p>
            <h3>{totalSeatsBooked}</h3>
          </div>
          <div className="analytics-card-icon">
            <FileText size={22} />
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-info">
            <p>Total Bookings</p>
            <h3>{bookings.length}</h3>
          </div>
          <div className="analytics-card-icon">
            <Users size={22} />
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-info">
            <p>Active Releases</p>
            <h3>{movies.length}</h3>
          </div>
          <div className="analytics-card-icon">
            <Film size={22} />
          </div>
        </div>
      </div>

      {/* Main Admin Section */}
      <div className="admin-two-col">
        
        {/* Left Side: Recent bookings list & Sales Visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
          
          {/* Sales Chart */}
          <div className="admin-card-panel">
            <h2>
              <Users size={18} className="toast-icon purple" />
              Ticket Sales Visualizer
            </h2>
            <div className="chart-bars-container">
              {movieSalesData.map((d, index) => {
                // Calculate height percentage
                const pct = (d.ticketsSold / maxTicketsSold) * 100;
                return (
                  <div key={index} className="chart-bar-col">
                    <span className="chart-bar-val">{d.ticketsSold}</span>
                    <div
                      className="chart-bar-fill"
                      style={{ height: `${Math.max(pct, 8)}%` }}
                    />
                    <span className="chart-bar-label" title={d.title}>
                      {d.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bookings Table */}
          <div className="admin-card-panel">
            <h2>
              <CheckCircle size={18} className="toast-icon cyan" />
              Recent Booking Transactions
            </h2>
            
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)' }}>
                No tickets purchased yet.
              </div>
            ) : (
              <div className="bookings-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Movie</th>
                      <th>Seats</th>
                      <th>Showtime</th>
                      <th>Paid</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice().reverse().map((b) => {
                      const movieName = movies.find((m) => m.id === b.movieId)?.title || 'Deleted Movie';
                      return (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 'bold' }}>
                            {b.bookingRef}
                            {b.utr && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'monospace', marginTop: '2px' }}>
                                UTR: {b.utr}
                              </div>
                            )}
                            {b.phoneNumber && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Ph: {b.phoneNumber}
                              </div>
                            )}
                          </td>
                          <td>{movieName}</td>
                          <td>{b.seats.map((s) => s.tier === 'vip' ? 'V' + s.number : s.tier === 'premium' ? 'P' + s.number : 'L' + s.number).join(', ')}</td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>{b.date}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.time}</div>
                          </td>
                           <td style={{ fontWeight: '600' }}>₹{b.amount.toFixed(2)}</td>
                          <td>
                            <span className={`status-tag ${b.status}`}>
                              {b.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {b.status === 'pending' ? (
                              <button
                                className="movie-action-btn edit"
                                onClick={() => onApproveBooking(b.id)}
                                title="Approve UPI Payment"
                                style={{
                                  color: '#10b981',
                                  borderColor: 'rgba(16, 185, 129, 0.3)',
                                  background: 'rgba(16, 185, 129, 0.05)',
                                  width: 'auto',
                                  height: 'auto',
                                  padding: '4px 8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  borderRadius: '6px'
                                }}
                              >
                                <CheckCircle size={12} />
                                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Approve</span>
                              </button>
                            ) : b.status === 'confirmed' ? (
                              <button
                                className="movie-action-btn delete"
                                onClick={() => onCancelBooking(b.id)}
                                title="Refund & Cancel Ticket"
                              >
                                <Trash size={12} />
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>Cancelled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Add Movie Form & Existing Releases Manager */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
          
          {/* Uploader Form */}
          <div className="admin-card-panel">
            <h2>
              {editingMovie ? <Pencil size={18} className="toast-icon purple" /> : <Plus size={18} className="toast-icon cyan" />}
              {editingMovie ? 'Update Movie Details' : 'Upload Running Movie'}
            </h2>
            
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Movie Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Interstellar"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description / Synopsis</label>
                <textarea
                  required
                  placeholder="Summarize the storyline..."
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'var(--font-main)', resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Poster Image (Choose Local File)</label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!poster}
                    className="form-input"
                    onChange={handleFileChange}
                    style={{ padding: '0.5rem' }}
                  />
                  {poster && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Image Selected:</span>
                      <img src={poster} alt="Preview" style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Banner Wallpaper URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://banner..."
                    className="form-input"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Genres (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Action, Sci-Fi, Thriller"
                    className="form-input"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    placeholder="148"
                    className="form-input"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2" style={{ gridTemplateColumns: '1fr 1.5fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Rating (1.0 to 10.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    placeholder="8.6"
                    className="form-input"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Director</label>
                  <input
                    type="text"
                    placeholder="Christopher Nolan"
                    className="form-input"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. English, Hindi"
                    className="form-input"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Booking Start Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Booking End Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cast Crew Members (comma separated)</label>
                <input
                  type="text"
                  placeholder="Matthew McConaughey, Anne Hathaway, Jessica Chastain"
                  className="form-input"
                  value={castInput}
                  onChange={(e) => setCastInput(e.target.value)}
                />
              </div>

              {/* Movie pricing controls in INR */}
              <div className="form-row-2" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Standard Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="form-input"
                    value={standardPrice}
                    onChange={(e) => setStandardPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Premium Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="form-input"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>VIP Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="form-input"
                    value={vipPrice}
                    onChange={(e) => setVipPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Showtime Timings (comma separated)</label>
                <input
                  type="text"
                  placeholder="10:30 AM, 1:45 PM, 6:00 PM, 9:30 PM"
                  className="form-input"
                  value={timingsInput}
                  onChange={(e) => setTimingsInput(e.target.value)}
                />
                <span className="form-label-desc">Update show schedules separated by commas.</span>
              </div>

              <button 
                type="submit" 
                className="form-submit-btn"
                style={{ 
                  background: editingMovie ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))' : '',
                  boxShadow: editingMovie ? '0 6px 15px rgba(155, 81, 224, 0.2)' : '' 
                }}
              >
                {editingMovie ? 'Save Changes' : 'Add Movie & Notify Users'}
              </button>
              {editingMovie && (
                <button 
                  type="button" 
                  className="cancel-booking-btn" 
                  style={{ margin: '0.5rem 0 0 0', width: '100%' }}
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* Active Releases catalog Table */}
          <div className="admin-card-panel">
            <h2>
              <Film size={18} className="toast-icon purple" />
              Manage Active Releases
            </h2>
            
            <div className="movies-list-panel">
              {movies.map((movie) => (
                <div key={movie.id} className="movie-list-item">
                  <div className="movie-list-item-info">
                    <img src={movie.poster} alt={movie.title} className="movie-list-item-poster" />
                    <div className="movie-list-item-details">
                      <h4>{movie.title}</h4>
                      <p>{movie.genre.join(', ')} • {movie.duration} min</p>
                      <p style={{ color: 'var(--accent-cyan)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Clock size={10} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                        <span style={{ verticalAlign: 'middle' }}>{movie.timings.join(', ')}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="movie-action-btns">
                    {/* Pencil Edit button */}
                    {!deletingMovieId && (
                      <button
                        className="movie-action-btn edit"
                        type="button"
                        onClick={() => handleStartEdit(movie)}
                        title="Edit Movie Details"
                        style={{
                          color: 'var(--accent-cyan)',
                          borderColor: 'rgba(0, 242, 254, 0.3)',
                          background: 'rgba(0, 242, 254, 0.05)'
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                    )}

                    {/* Trash Delete button */}
                    <button
                      className={`movie-action-btn delete ${deletingMovieId === movie.id ? 'confirming-delete' : ''}`}
                      onClick={() => handleDeleteClick(movie.id)}
                      title={deletingMovieId === movie.id ? "Click again to confirm removal" : "Remove Movie"}
                      style={{
                        padding: deletingMovieId === movie.id ? '0.4rem 0.8rem' : '',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: deletingMovieId === movie.id ? 'var(--accent-pink)' : '',
                        borderColor: deletingMovieId === movie.id ? 'var(--accent-pink)' : '',
                        color: deletingMovieId === movie.id ? '#fff' : '',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {deletingMovieId === movie.id ? (
                        <>
                          <AlertCircle size={12} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Confirm Delete?</span>
                        </>
                      ) : (
                        <Trash size={14} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
