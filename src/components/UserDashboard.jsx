import React, { useState } from 'react';
import { Search, Star, Clock, Video, Trash, AlertCircle } from 'lucide-react';

export default function UserDashboard({ movies, onSelectMovie, isAdmin, onDeleteMovie }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  
  // Custom inline delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteTimeout, setDeleteTimeout] = useState(null);

  const handleDeleteClick = (e, movieId) => {
    e.stopPropagation();
    if (confirmDeleteId === movieId) {
      if (deleteTimeout) clearTimeout(deleteTimeout);
      setConfirmDeleteId(null);
      onDeleteMovie(movieId);
    } else {
      setConfirmDeleteId(movieId);
      const timeout = setTimeout(() => {
        setConfirmDeleteId(null);
      }, 3500);
      setDeleteTimeout(timeout);
    }
  };

  // Derive unique genres
  const genres = ['All', ...new Set(movies.flatMap((m) => m.genre || []))];

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          movie.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || (movie.genre && movie.genre.includes(selectedGenre));
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="user-dashboard">
      <div className="catalog-header">
        <div className="catalog-title">
          <h1>Infinity Aura Reservations</h1>
          <p>Book premium cinematic experiences. Select your favorite movie below to reserve seats.</p>
        </div>
        
        <div className="search-filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search running movies..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="genre-tabs">
            {genres.map((genre) => (
              <button
                key={genre}
                className={`genre-tab ${selectedGenre === genre ? 'active' : ''}`}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <h3>No Movies Found</h3>
          <p>Try searching for a different keyword or category.</p>
        </div>
      ) : (
        <div className="movie-grid">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="movie-card"
              onClick={() => onSelectMovie(movie)}
            >
              <div className="movie-poster-wrapper">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="movie-poster"
                  onError={(e) => {
                    // Fallback visual design if image fails to load
                    e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop';
                  }}
                />
                {isAdmin && (
                  <button
                    className={`movie-action-btn delete ${confirmDeleteId === movie.id ? 'confirming' : ''}`}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 10,
                      background: confirmDeleteId === movie.id ? 'var(--accent-pink)' : 'rgba(20, 24, 33, 0.85)',
                      border: confirmDeleteId === movie.id ? '1px solid var(--accent-pink)' : '1px solid rgba(255,255,255,0.08)',
                      color: confirmDeleteId === movie.id ? '#fff' : 'var(--text-muted)',
                      borderRadius: confirmDeleteId === movie.id ? '8px' : '50%',
                      padding: confirmDeleteId === movie.id ? '0.25rem 0.5rem' : '0',
                      width: confirmDeleteId === movie.id ? 'auto' : '32px',
                      height: '32px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                    onClick={(e) => handleDeleteClick(e, movie.id)}
                    title={confirmDeleteId === movie.id ? "Click again to confirm removal" : "Delete Movie"}
                  >
                    {confirmDeleteId === movie.id ? (
                      <>
                        <AlertCircle size={12} />
                        <span>Confirm?</span>
                      </>
                    ) : (
                      <Trash size={14} />
                    )}
                  </button>
                )}
                <div className="movie-rating-badge">
                  <Star size={12} fill="var(--accent-gold)" color="var(--accent-gold)" />
                  <span>{movie.rating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="movie-card-info">
                <div className="movie-tags">
                  {movie.genre && movie.genre.slice(0, 3).map((g) => (
                    <span key={g} className="movie-tag">{g}</span>
                  ))}
                </div>
                <h3 className="movie-card-title">{movie.title}</h3>
                
                <div className="movie-card-meta">
                  <span>
                    <Clock size={12} />
                    {movie.duration} min
                  </span>
                  <span>
                    <Video size={12} />
                    {movie.formats ? movie.formats.join(', ') : '2D/3D'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
