import { useState, useEffect } from 'react';
import api from '../services/api';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import styles from './Events.module.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/events');
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.date) >= now);
  const recentEvents = events.filter(e => new Date(e.date) < now);

  // Pagination Logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentUpcomingEvents = upcomingEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(upcomingEvents.length / eventsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const getGridClass = (count) => {
    if (count === 1) return styles.grid1;
    if (count === 2) return styles.grid2;
    return '';
  };

  if (loading) {
    return (
      <div className={styles.events}>
        <section className={styles.header}>
          <div className={styles.headerInner}>
            <span className={styles.eyebrow}>Gatherings</span>
            <h1>Our <em>Events</em></h1>
            <p className={styles.loading}>Loading events...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.events}>
      {/* Header */}
      <section className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.eyebrow}>Gatherings</span>
          <h1>Our <em>Events</em></h1>
          <div className="ornament"><span /></div>
          <p>
            Join us for pop-ups, workshops, and cookie celebrations. 
            We love meeting our community in person.
          </p>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="eyebrow">The Calendar</span>
            <h2 className={styles.sectionTitle}>Upcoming <em>Gatherings</em></h2>
            <div className="ornament"><span /></div>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className={styles.emptyState}>No upcoming events scheduled at the moment. Check back soon!</p>
          ) : (
            <div className={`${styles.eventGrid} ${getGridClass(currentUpcomingEvents.length)}`}>
              {currentUpcomingEvents.map((event) => (
                <div key={event._id} className={styles.eventCard}>
                  {event.image && (
                    <div className={styles.imageWrap}>
                      <img src={event.image} alt={event.title} />
                    </div>
                  )}
                  <div className={styles.contentWrap}>
                    <div className={styles.eventMeta}>
                      <div className={styles.metaRow}>
                        <span className={styles.metaIcon}><FaCalendarAlt /></span>
                        <span className={styles.eventDate}>{formatDate(event.date)}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaIcon}><FaClock /></span>
                        <span className={styles.eventTime}>{event.time || 'TBA'}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaIcon}><FaMapMarkerAlt /></span>
                        {event.googleMapsLink ? (
                          <a 
                            href={event.googleMapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.locationLink}
                          >
                            {event.location}
                          </a>
                        ) : (
                          <span className={styles.eventLocation}>{event.location}</span>
                        )}
                      </div>
                    </div>
                    <h3>{event.title}</h3>
                    <p className={styles.eventDesc}>{event.description}</p>
                    {event.link && (
                      <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.eventLink}
                      >
                        Learn More <FaArrowRight />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <section className={`${styles.section} ${styles.recentSection}`}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className="eyebrow">Memories</span>
              <h2 className={styles.sectionTitle}>Recent <em>Moments</em></h2>
              <div className="ornament"><span /></div>
              <p>Highlights from our gatherings this past week.</p>
            </div>

            <div className={styles.eventGrid}>
              {recentEvents.map((event) => (
                <div key={event._id} className={styles.eventCard}>
                  {event.image && (
                    <div className={styles.imageWrap}>
                      <img src={event.image} alt={event.title} />
                    </div>
                  )}
                  <div className={styles.contentWrap}>
                    <div className={styles.eventMeta}>
                      <div className={styles.metaRow}>
                        <span className={styles.metaIcon}><FaCalendarAlt /></span>
                        <span className={styles.eventDate}>{formatDate(event.date)}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaIcon}><FaClock /></span>
                        <span className={styles.eventTime}>{event.time || 'TBA'}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaIcon}><FaMapMarkerAlt /></span>
                        {event.googleMapsLink ? (
                          <a 
                            href={event.googleMapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.locationLink}
                          >
                            {event.location}
                          </a>
                        ) : (
                          <span className={styles.eventLocation}>{event.location}</span>
                        )}
                      </div>
                    </div>
                    <h3>{event.title}</h3>
                    <p className={styles.eventDesc}>{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Events;
