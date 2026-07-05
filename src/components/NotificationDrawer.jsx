import React from 'react';
import { X, Bell, Mail, Info, CreditCard, CheckCircle, Plus } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, notifications, onClearAll }) {
  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'booking':
        return <TicketIcon className="toast-icon purple" />;
      case 'payment':
        return <CreditCard size={18} className="toast-icon purple" />;
      case 'add_movie':
        return <Plus size={18} className="toast-icon cyan" />;
      default:
        return <Info size={18} className="toast-icon cyan" />;
    }
  };

  // TicketIcon inline helper if Lucide doesn't have it direct
  function TicketIcon({ className }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
      </svg>
    );
  }

  return (
    <>
      <div className="modal-overlay" style={{ background: 'transparent' }} onClick={onClose} />
      <div className="notification-drawer">
        <div className="drawer-header">
          <h3>
            <Bell size={20} className="toast-icon cyan" />
            Activity Logs
          </h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {notifications.length > 0 && (
              <button className="clear-all-btn" onClick={onClearAll}>
                Clear All
              </button>
            )}
            <button className="close-modal-btn" style={{ position: 'static', width: '32px', height: '32px' }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="drawer-list">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <p>No new notifications</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                System events and booking logs will show up here.
              </span>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
                <div className="notification-item-icon">
                  {getIcon(notif.type)}
                </div>
                <div className="notification-item-body">
                  <p className="notification-item-text">{notif.message}</p>
                  <span className="notification-item-time">{notif.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
