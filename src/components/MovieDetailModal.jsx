import React, { useState } from 'react';
import { X, Calendar, Clock, Star, Play, Award, Trash, Pencil, AlertCircle } from 'lucide-react';

export default function MovieDetailModal({ 
  movie, 
  onClose, 
  onProceedToBooking,
  isAdmin,
  onDeleteMovie,
  onEditMovie
}) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Custom inline delete confirm state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTimeout, setDeleteTimeout] = useState(null);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      if (deleteTimeout) clearTimeout(deleteTimeout);
      setConfirmDelete(false);
      onDeleteMovie(movie.id);
      onClose();
    } else {
      setConfirmDelete(true);
      const timeout = setTimeout(() => {
        setConfirmDelete(false);
      }, 3500);
      setDeleteTimeout(timeout);
    }
  };

  // Generate dates in range [movie.startDate, movie.endDate]
  const generateDatesInRange = (startStr, endStr) => {
    const datesList = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = startStr ? new Date(startStr) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endStr ? new Date(endStr) : new Date();
    if (!endStr) {
      end.setDate(start.getDate() + 7);
    }
    end.setHours(0, 0, 0, 0);
    
    // Show dates starting from whichever is later: today or start date
    const current = new Date(Math.max(today.getTime(), start.getTime()));

    let count = 0;
    while (current <= end && count < 30) {
      datesList.push({
        dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: current.getDate(),
        fullDate: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      current.setDate(current.getDate() + 1);
      count++;
    }
    return datesList;
  };

  const dates = generateDatesInRange(movie.startDate, movie.endDate);

  const handleBookingStart = () => {
    if (selectedDate && selectedTime) {
      onProceedToBooking(movie, selectedDate, selectedTime);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="detail-modal-banner">
          <img
            src={movie.banner || movie.poster}
            alt={movie.title}
            className="detail-modal-banner-img"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop';
            }}
          />
          <div className="detail-modal-banner-overlay" />
          
          <div className="detail-modal-header-content">
            <img
              src={movie.poster}
              alt={movie.title}
              className="detail-modal-poster"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop';
              }}
            />
            <div className="detail-modal-title-area">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {movie.genre && movie.genre.map((g) => (
                  <span key={g} className="movie-tag" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--accent-cyan)' }}>
                    {g}
                  </span>
                ))}
              </div>
              <h2>{movie.title}</h2>
              <div className="detail-modal-info">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-gold)' }}>
                  <Star size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />
                  <strong>{movie.rating.toFixed(1)}</strong>
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  {movie.duration} minutes
                </span>
                <span>•</span>
                <span>{movie.language || 'English'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-modal-body">
          <div className="detail-modal-synopsis">
            <h3>Synopsis</h3>
            <p>{movie.description}</p>
            
            <div className="cast-crew">
              <h4>Director</h4>
              <p>{movie.director || 'N/A'}</p>
              <h4>Cast</h4>
              <p>{movie.cast ? movie.cast.join(', ') : 'N/A'}</p>
            </div>

            {isAdmin && (
              <div 
                style={{ 
                  marginTop: '2rem', 
                  padding: '1.25rem', 
                  border: '1px solid rgba(244, 63, 94, 0.25)', 
                  borderRadius: '16px', 
                  background: 'rgba(244, 63, 94, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <h4 style={{ margin: 0, color: 'var(--accent-pink)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)' }}>
                  <Award size={14} /> Admin Quick Actions
                </h4>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="role-btn active"
                    style={{ flex: 1, padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', border: 'none', borderRadius: '20px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                    onClick={() => {
                      onClose();
                      onEditMovie(movie);
                    }}
                  >
                    <Pencil size={12} /> Edit Details
                  </button>

                  <button
                    className="cancel-booking-btn"
                    style={{ 
                      flex: 1, 
                      margin: 0, 
                      color: '#fff', 
                      borderColor: 'var(--accent-pink)', 
                      background: confirmDelete ? 'var(--accent-pink)' : 'rgba(244, 63, 94, 0.05)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px', 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={handleDeleteClick}
                  >
                    {confirmDelete ? (
                      <>
                        <AlertCircle size={12} />
                        <span>Tap again to confirm</span>
                      </>
                    ) : (
                      <>
                        <Trash size={12} />
                        <span>Delete Movie</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="booking-section-wrapper">
            <h3>Select Date & Showtime</h3>
            
            {dates.length === 0 ? (
              <div style={{ color: 'var(--text-dark)', padding: '1rem 0', fontSize: '0.85rem', textAlign: 'center' }}>
                No active bookings open. Tickets for this release are currently closed or have ended.
              </div>
            ) : (
              <div className="date-selector">
                {dates.map((date, idx) => (
                  <div
                    key={idx}
                    className={`date-btn ${selectedDate?.fullDate === date.fullDate ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null); // Reset timing when date changes
                    }}
                  >
                    <span className="date-btn-day">{date.dayName}</span>
                    <span className="date-btn-num">{date.dayNum}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedDate && (
              <>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Available Showtimes</h4>
                <div className="showtime-grid">
                  {movie.timings && movie.timings.length > 0 ? (
                    movie.timings.map((time) => (
                      <button
                        key={time}
                        className={`showtime-btn ${selectedTime === time ? 'active' : ''}`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-dark)', gridColumn: '1 / -1', fontSize: '0.8rem' }}>
                      No timings scheduled for this date.
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              className="book-now-trigger-btn"
              disabled={!selectedDate || !selectedTime}
              onClick={handleBookingStart}
            >
              <Play size={16} fill="#fff" />
              Reserve Seats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
