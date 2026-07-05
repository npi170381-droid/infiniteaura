import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, DollarSign, CheckCircle, Clock8, XCircle } from 'lucide-react';

export default function MyBookings({ currentUser, API_BASE, movies }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/bookings/user/${currentUser.phoneNumber}`);
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        } else {
          setError('Failed to load transaction history.');
        }
      } catch (err) {
        console.error('Fetch bookings error:', err);
        setError('Network error. Failed to retrieve tickets.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserBookings();
    }
  }, [currentUser, API_BASE]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={14} style={{ color: '#10b981' }} />;
      case 'pending':
        return <Clock8 size={14} style={{ color: '#f59e0b' }} />;
      case 'cancelled':
        return <XCircle size={14} style={{ color: '#f43f5e' }} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner-ring" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Retrieving your tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-pink)' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-card-panel" style={{ maxWidth: '1000px', margin: '0 auto 2rem auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Ticket size={20} className="toast-icon purple" />
        My Booking Transactions
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
        Review your screening schedule and check ticket approval statuses.
      </p>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dark)' }}>
          <Ticket size={36} style={{ color: 'var(--text-dark)', marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '0.95rem', margin: 0 }}>You haven't reserved any movie tickets yet.</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Go browse movies and choose your seats to get started!</p>
        </div>
      ) : (
        <div className="bookings-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Movie Title</th>
                <th>Show Date/Time</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice().reverse().map((b) => {
                const movie = movies.find((m) => m.id === b.movieId);
                const movieTitle = movie ? movie.title : 'Movie';

                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{b.bookingRef}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{movieTitle}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                        <Calendar size={12} style={{ color: 'var(--accent-cyan)' }} />
                        {b.date}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                        {b.time}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>
                        {b.seats.map((s) => s.tier === 'vip' ? 'V' + s.number : s.tier === 'premium' ? 'P' + s.number : 'L' + s.number).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.seats.length} Tickets</div>
                    </td>
                    <td style={{ fontWeight: '600' }}>₹{b.amount.toFixed(2)}</td>
                    <td>
                      {b.utr ? (
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>UPI (QR)</div>
                          <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>UTR: {b.utr}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Card Payment</div>
                      )}
                    </td>
                    <td>
                      <div className={`status-tag ${b.status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {getStatusIcon(b.status)}
                        <span>{b.status.toUpperCase()}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
