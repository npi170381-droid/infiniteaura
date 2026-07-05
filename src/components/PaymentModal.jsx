import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Ticket, QrCode, AlertCircle, X, Download, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentModal({
  movie,
  date,
  time,
  seats,
  currentUser,
  onPaymentSuccess,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // General fields
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return currentUser ? currentUser.phoneNumber : '';
  });

  // Card Form states
  const [cardName, setCardName] = useState(() => {
    return currentUser ? currentUser.name.toUpperCase() : '';
  });
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI Form states
  const [upiId, setUpiId] = useState('');
  const [utr, setUtr] = useState('');

  const subtotal = seats.reduce((acc, s) => acc + s.price, 0);
  const fee = subtotal * 0.08;
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + fee + tax;

  useEffect(() => {
    // Generate a unique booking ID
    const randomId = 'IAR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setBookingId(randomId);
  }, []);

  const handlePayment = (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      alert('Phone number is required');
      return;
    }
    if (activeTab === 'upi') {
      if (!utr || utr.length !== 12) {
        alert('Please enter a valid 12-digit UPI UTR Transaction Reference Number.');
        return;
      }
    }

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // Trigger confetti celebration!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#9b51e0', '#f43f5e', '#10b981', '#f59e0b']
      });
      onPaymentSuccess(bookingId, grandTotal, phoneNumber, activeTab === 'upi' ? utr : null);
    }, 2200);
  };

  // Mask card number for live preview
  const getMaskedCardNumber = () => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const trimmed = cardNumber.replace(/\s?/g, '');
    const segments = [];
    for (let i = 0; i < trimmed.length; i += 4) {
      segments.push(trimmed.substring(i, i + 4));
    }
    const displayStr = segments.join(' ');
    return displayStr.padEnd(19, '•').replace(/(.{4})\s?/g, '$1 ').trim();
  };

  return (
    <div className="modal-overlay">
      {!success ? (
        <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
          
          <h2 className="payment-title">Secure Checkout</h2>

          {loading ? (
            <div className="payment-success-spinner">
              <div className="spinner-ring" />
              <h3>Verifying Payment Details</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Please do not close this window or click refresh.
              </p>
            </div>
          ) : (
            <>
              {/* General Phone Number Input */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Phone Number (for Ticket confirmation via SMS/WhatsApp) <span style={{ color: 'var(--accent-pink)' }}>*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +919876543210"
                  className="form-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              {/* Payment Methods selector */}
              <div className="payment-methods">
                <button
                  className={`payment-tab ${activeTab === 'card' ? 'active' : ''}`}
                  onClick={() => setActiveTab('card')}
                >
                  Credit/Debit Card
                </button>
                <button
                  className={`payment-tab ${activeTab === 'upi' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upi')}
                >
                  UPI Payment (QR)
                </button>
              </div>

              {activeTab === 'card' ? (
                <form onSubmit={handlePayment} className="payment-form">
                  {/* Card Visual Preview */}
                  <div className="card-visual">
                    <div className="card-header-v">
                      <div className="chip" />
                      <span className="logo-v">AURA SECURE</span>
                    </div>
                    <div className="card-num-v">{getMaskedCardNumber()}</div>
                    <div className="card-footer-v">
                      <div>
                        <div style={{ fontSize: '0.65rem' }}>Card Holder</div>
                        <div className="val">{cardName || 'YOUR FULL NAME'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem' }}>Expires</div>
                        <div className="val">{cardExpiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      className="form-input"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength="19"
                      placeholder="4111 2222 3333 4444"
                      className="form-input"
                      value={cardNumber}
                      onChange={(e) => {
                        // Numeric only, space grouping
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength="5"
                        placeholder="MM/YY"
                        className="form-input"
                        value={cardExpiry}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) {
                            setCardExpiry(val.substring(0, 2) + '/' + val.substring(2, 4));
                          } else {
                            setCardExpiry(val);
                          }
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV / CVC</label>
                      <input
                        type="password"
                        required
                        maxLength="4"
                        placeholder="•••"
                        className="form-input"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="checkout-btn"
                    style={{ marginTop: '1rem', padding: '1rem' }}
                  >
                    Pay ₹{grandTotal.toFixed(2)} Securely
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePayment} className="payment-form">
                  <div className="upi-checkout-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', margin: '0 0 1rem 0' }}>
                    <div className="qr-code-wrapper" style={{ padding: '0.75rem', background: '#fff', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--glass-border)' }}>
                      {/* Dynamically generated UPI QR Code */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                          `upi://pay?pa=7708371161@ybl&pn=Infinity%20Aura%20Cinema&am=${grandTotal.toFixed(2)}&cu=INR&tn=Booking_${bookingId}`
                        )}`}
                        alt="UPI QR Code"
                        style={{ display: 'block', width: '150px', height: '150px' }}
                      />
                    </div>
                    
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                      Scan the QR code to transfer <strong>₹{grandTotal.toFixed(2)}</strong> using Google Pay, PhonePe, Paytm, or BHIM.
                    </p>
                  </div>

                  <div className="form-group">
                    <label>Your UPI ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. username@upi"
                      className="form-input"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>12-digit Transaction Reference (UTR) <span style={{ color: 'var(--accent-pink)' }}>*</span></label>
                    <input
                      type="text"
                      required
                      maxLength="12"
                      minLength="12"
                      placeholder="e.g. 301234567890"
                      className="form-input"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))} // Numeric only
                      style={{ letterSpacing: '2px', fontWeight: 'bold', fontFamily: 'monospace' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="checkout-btn"
                    style={{ marginTop: '1rem', padding: '1rem' }}
                  >
                    Submit Booking & UTR Reference
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      ) : (
        /* Dynamic Ticket Receipt Visual Panel */
        <div className="payment-modal ticket-wrapper" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <div className="ticket-card">
            <div className="ticket-header">
              <h2>Infinity Aura Reservations</h2>
              <p>Booking Confirmed • Electronic Ticket</p>
            </div>
            
            <div className="ticket-body">
              <h3 className="ticket-movie-title">{movie.title}</h3>
              
              <div className="ticket-info-grid">
                <div className="ticket-info-item">
                  <span className="ticket-info-label">Date</span>
                  <span className="ticket-info-val">{date.fullDate}</span>
                </div>
                <div className="ticket-info-item">
                  <span className="ticket-info-label">Showtime</span>
                  <span className="ticket-info-val">{time}</span>
                </div>
                <div className="ticket-info-item">
                  <span className="ticket-info-label">Seats</span>
                  <span className="ticket-info-val" style={{ color: 'var(--accent-purple)' }}>
                    {seats.map((s) => s.tier === 'vip' ? 'V' + s.number : s.tier === 'premium' ? 'P' + s.number : 'L' + s.number).join(', ')}
                  </span>
                </div>
                <div className="ticket-info-item">
                  <span className="ticket-info-label">Ticket ID</span>
                  <span className="ticket-info-val">{bookingId}</span>
                </div>
              </div>

              <div className="ticket-info-grid" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <div className="ticket-info-item">
                  <span className="ticket-info-label">Transaction Status</span>
                  <span className="ticket-info-val" style={{ color: activeTab === 'upi' ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {activeTab === 'upi' ? (
                      <>Pending Verification</>
                    ) : (
                      <><Check size={14} strokeWidth={3} /> Paid</>
                    )}
                  </span>
                </div>
                <div className="ticket-info-item">
                  <span className="ticket-info-label">Paid Amount</span>
                  <span className="ticket-info-val">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {activeTab === 'upi' ? (
                <div className="ticket-info-grid" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                  <div className="ticket-info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="ticket-info-label">UPI Reference No. (UTR)</span>
                    <span className="ticket-info-val" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{utr}</span>
                  </div>
                  <div className="ticket-info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="ticket-info-label">Mobile Number</span>
                    <span className="ticket-info-val">{phoneNumber}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem', fontStyle: 'italic', lineHeight: 1.3 }}>
                    * Booking status is currently pending. An administrator will verify the payment using your UTR Ref.
                  </div>
                </div>
              ) : (
                <div className="ticket-info-grid" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                  <div className="ticket-info-item" style={{ gridColumn: 'span 2' }}>
                    <span className="ticket-info-label">Mobile Number</span>
                    <span className="ticket-info-val">{phoneNumber}</span>
                  </div>
                </div>
              )}

              <div className="ticket-divider" />

              <div className="ticket-barcode-area">
                <div className="barcode-visual" />
                <span className="barcode-val">{bookingId}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  className="checkout-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  Print Ticket
                </button>
                <button
                  className="cancel-booking-btn"
                  style={{ margin: 0, color: '#0f172a', borderColor: '#cbd5e1' }}
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
