import React from 'react';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

function Armchair({ seat, selected, booked, onClick, price }) {
  const getColors = () => {
    if (booked) return { bg: 'rgba(51, 65, 85, 0.3)', border: '#475569', icon: '#1e293b' };
    if (selected) return { bg: 'rgba(0, 242, 254, 0.25)', border: 'var(--accent-cyan)', icon: 'var(--accent-cyan)' };
    
    switch (seat.tier) {
      case 'vip':
        return { bg: 'rgba(245, 158, 11, 0.1)', border: 'var(--accent-gold)', icon: 'var(--accent-gold)' };
      case 'premium':
        return { bg: 'rgba(155, 81, 224, 0.1)', border: 'var(--accent-purple)', icon: 'var(--accent-purple)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.2)', icon: 'var(--text-muted)' };
    }
  };

  const colors = getColors();

  // Combine rotation and hover scaling styles
  const baseTransform = seat.rotation ? `rotate(${seat.rotation}deg)` : '';

  return (
    <div
      onClick={onClick}
      style={{
        width: '60px',
        height: '60px',
        cursor: booked ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: baseTransform,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className={!booked ? (seat.rotation ? 'armchair-rotated-hover' : 'armchair-standard-hover') : ''}
      title={`${seat.label} (${seat.tier.toUpperCase()} - ₹${price.toFixed(2)})`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.border}
        strokeWidth="1.5"
        style={{
          width: '100%',
          height: '100%',
          fill: colors.bg,
          transition: 'all 0.3s'
        }}
      >
        {/* Seat Cushion */}
        <rect x="4" y="6" width="16" height="12" rx="3" />
        {/* Backrest */}
        <path d="M4 6c0-2 2-3 8-3s8 1 8 3" />
        {/* Left Armrest */}
        <rect x="2" y="8" width="2" height="10" rx="1" />
        {/* Right Armrest */}
        <rect x="20" y="8" width="2" height="10" rx="1" />
        {/* Bottom cushion support line */}
        <path d="M5 18h14" />
      </svg>
      
      {/* Label Text Overlay */}
      <span
        style={{
          position: 'absolute',
          fontSize: '0.75rem',
          fontWeight: '800',
          color: selected ? 'var(--accent-cyan)' : booked ? 'var(--text-dark)' : '#fff',
          pointerEvents: 'none',
          userSelect: 'none',
          // Text stays readable by un-rotating against the chair's rotation
          transform: seat.rotation ? `rotate(${-seat.rotation}deg)` : 'none',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}
      >
        {seat.label}
      </span>

      {/* Booked Cross Overlay */}
      {booked && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-pink)',
          fontSize: '1.5rem',
          fontWeight: '900',
          pointerEvents: 'none',
          transform: seat.rotation ? `rotate(${-seat.rotation}deg)` : 'none',
          textShadow: '0 0 5px rgba(0,0,0,0.5)'
        }}>
          ✕
        </div>
      )}
    </div>
  );
}

export default function SeatSelection({
  movie,
  date,
  time,
  selectedSeats,
  onSeatToggle,
  onCancel,
  onProceedToCheckout,
  bookings
}) {
  
  // Custom boutique theater physical seating layout (5 seats total)
  // Row 1: Standard L1 on sidewall, VIP V1 & VIP V2 next to each other, Premium P3 on the right.
  // Row 2: Standard L2 on sidewall (directly under L1).
  const customSeats = [
    { id: 'L1', row: 'Left', number: 1, tier: 'standard', label: 'L1', rotation: 90 },
    { id: 'V1', row: 'Center', number: 1, tier: 'vip', label: 'V1', rotation: 0 },
    { id: 'L2', row: 'Left', number: 2, tier: 'standard', label: 'L2', rotation: 90 },
    { id: 'V2', row: 'Center', number: 2, tier: 'vip', label: 'V2', rotation: 0 },
    { id: 'P3', row: 'Center', number: 3, tier: 'premium', label: 'P3', rotation: 0 }
  ];

  // Determine seat price dynamically from movie price tier
  const getSeatPrice = (tier) => {
    switch (tier) {
      case 'vip':
        return movie.priceTier?.vip !== undefined ? movie.priceTier.vip : 0;
      case 'premium':
        return movie.priceTier?.premium !== undefined ? movie.priceTier.premium : 0;
      default:
        return movie.priceTier?.standard !== undefined ? movie.priceTier.standard : 0;
    }
  };

  // Only check actual database bookings, no mock seed pre-booking
  const isSeatBooked = (row, seatNum) => {
    return bookings.some((b) => {
      return (
        b.movieId === movie.id &&
        b.date === date.fullDate &&
        b.time === time &&
        b.seats.some((s) => s.row === row && s.number === seatNum) &&
        b.status !== 'cancelled'
      );
    });
  };

  const handleSeatClick = (seat) => {
    if (isSeatBooked(seat.row, seat.number)) return;
    const price = getSeatPrice(seat.tier);
    onSeatToggle({ row: seat.row, number: seat.number, price, tier: seat.tier });
  };

  const isSeatSelected = (seat) => {
    return selectedSeats.some((s) => s.row === seat.row && s.number === seat.number);
  };

  // Pricing calculations
  const subtotal = selectedSeats.reduce((acc, seat) => acc + seat.price, 0);
  const convenienceFee = subtotal * 0.08;
  const gst = subtotal * 0.18;
  const total = subtotal + convenienceFee + gst;

  return (
    <div className="seat-view-container">
      <div className="theater-workspace">
        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button className="close-modal-btn" style={{ position: 'static' }} onClick={onCancel}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Choose Seats</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {movie.title} • {date.fullDate} • {time}
            </span>
          </div>
        </div>

        {/* Cinematic Curved Screen */}
        <div className="screen-container">
          <div className="screen-curved" />
          <div className="screen-text">Cinema Screen This Way</div>
        </div>

        {/* Custom Physical Layout Box representing the room floor plan grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateRows: 'auto auto auto',
            gap: '1.25rem', 
            width: '380px', 
            margin: '0 auto 2.5rem auto',
            padding: '2rem 1.5rem',
            border: '2px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            background: 'rgba(11, 15, 25, 0.5)',
            position: 'relative',
            boxShadow: 'inset 0 4px 30px rgba(0,0,0,0.5)'
          }}
        >
          {/* Column Names Header Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', justifyItems: 'center', alignItems: 'end', opacity: 0.8 }}>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-dark)', fontWeight: '800', letterSpacing: '0.5px' }}>SIDEWALL</span>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-dark)', fontWeight: '800', letterSpacing: '0.5px' }}>VIP 1</span>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-dark)', fontWeight: '800', letterSpacing: '0.5px' }}>VIP 2</span>
            <span style={{ fontSize: '0.52rem', color: 'var(--text-dark)', fontWeight: '800', letterSpacing: '0.5px' }}>PREMIUM</span>
          </div>

          {/* Row 1: Left Standard L1, and remaining grid spaces empty */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', justifyItems: 'center', alignItems: 'center' }}>
            <Armchair
              seat={customSeats[0]} // L1
              selected={isSeatSelected(customSeats[0])}
              booked={isSeatBooked(customSeats[0].row, customSeats[0].number)}
              onClick={() => handleSeatClick(customSeats[0])}
              price={getSeatPrice(customSeats[0].tier)}
            />
            {/* Column Spacers */}
            <div />
            <div />
            <div />
          </div>

          {/* Row 2: Left Standard L2, and horizontally next to it are VIP 1, VIP 2, and Premium P3 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', justifyItems: 'center', alignItems: 'center' }}>
            <Armchair
              seat={customSeats[2]} // L2
              selected={isSeatSelected(customSeats[2])}
              booked={isSeatBooked(customSeats[2].row, customSeats[2].number)}
              onClick={() => handleSeatClick(customSeats[2])}
              price={getSeatPrice(customSeats[2].tier)}
            />
            <Armchair
              seat={customSeats[1]} // V1
              selected={isSeatSelected(customSeats[1])}
              booked={isSeatBooked(customSeats[1].row, customSeats[1].number)}
              onClick={() => handleSeatClick(customSeats[1])}
              price={getSeatPrice(customSeats[1].tier)}
            />
            <Armchair
              seat={customSeats[3]} // V2
              selected={isSeatSelected(customSeats[3])}
              booked={isSeatBooked(customSeats[3].row, customSeats[3].number)}
              onClick={() => handleSeatClick(customSeats[3])}
              price={getSeatPrice(customSeats[3].tier)}
            />
            <Armchair
              seat={customSeats[4]} // P3
              selected={isSeatSelected(customSeats[4])}
              booked={isSeatBooked(customSeats[4].row, customSeats[4].number)}
              onClick={() => handleSeatClick(customSeats[4])}
              price={getSeatPrice(customSeats[4].tier)}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="seating-legend">
          <div className="legend-item">
            <div className="legend-color available" />
            <span>Available (Std: ₹{movie.priceTier?.standard?.toFixed(2) || '0.00'})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color available" style={{ borderColor: 'var(--accent-purple)' }} />
            <span>Premium (₹{movie.priceTier?.premium?.toFixed(2) || '0.00'})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color available" style={{ borderColor: 'var(--accent-gold)', background: 'rgba(245,158,11,0.05)' }} />
            <span>VIP (₹{movie.priceTier?.vip?.toFixed(2) || '0.00'})</span>
          </div>
          <div className="legend-item">
            <div className="legend-color selected" />
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-color booked" />
            <span>Sold</span>
          </div>
        </div>
      </div>

      {/* Sidebar summary */}
      <div className="booking-summary-sidebar">
        <h3>Booking Summary</h3>
        
        <div className="summary-movie-info">
          <img src={movie.poster} alt={movie.title} className="summary-movie-poster" />
          <div className="summary-movie-details">
            <h4>{movie.title}</h4>
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> {date.fullDate}
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Clock size={12} /> {time}
            </p>
          </div>
        </div>

        {selectedSeats.length > 0 ? (
          <>
            <div className="summary-ticket-details">
              <div className="summary-row">
                <span className="label">Selected Seats</span>
                <span className="val" style={{ color: 'var(--accent-cyan)' }}>
                  {selectedSeats.map((s) => s.tier === 'vip' ? 'V' + s.number : s.tier === 'premium' ? 'P' + s.number : 'L' + s.number).join(', ')}
                </span>
              </div>
              <div className="summary-row">
                <span className="label">Ticket Count</span>
                <span className="val">{selectedSeats.length} Seats</span>
              </div>
            </div>

            <div className="summary-pricing">
              <div className="pricing-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="pricing-row">
                <span>Convenience Fee (8%)</span>
                <span>₹{convenienceFee.toFixed(2)}</span>
              </div>
              <div className="pricing-row">
                <span>Local Taxes (GST 18%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="pricing-row total">
                <span>Grand Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button className="checkout-btn" onClick={onProceedToCheckout}>
              Proceed to Checkout
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dark)' }}>
            <p>No seats selected yet.</p>
            <span style={{ fontSize: '0.75rem' }}>Select seats from the layout to see price details.</span>
          </div>
        )}

        <button className="cancel-booking-btn" onClick={onCancel}>
          Go Back
        </button>
      </div>
    </div>
  );
}
