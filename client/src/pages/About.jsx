import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import styles from './About.module.css';

const About = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await api.get('/site-content/about');
        setContent(data);
      } catch { /* fallback handled by defaults on server */ }
    };
    fetchContent();
  }, []);

  if (!content) {
    return (
      <div className={styles.about}>
        <section className={styles.header}>
          <div className={styles.headerInner}>
            <span className={styles.eyebrow}>Our Story</span>
            <h1>About <em>Daun Dulce</em></h1>
            <p>Loading…</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.about}>
      <section className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.eyebrow}>Our Story</span>
          <h1>{content.heading}</h1>
          <div className="ornament"><span /></div>
          <p>{content.subtitle}</p>
        </div>
      </section>

      <section className={styles.story}>
        <div className="container">
          <div className={styles.storyContent}>
            {content.image && (
              <div className={styles.storyImage}>
                <img src={content.image} alt="About Daun Dulce" />
              </div>
            )}
            <div className={styles.storyText}>
              <span className="eyebrow">Chapter One</span>
              <h2>{content.storyTitle}</h2>
              <div className="ornament"><span /></div>
              {content.storyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.values}>
        <div className="container">
          <div className={styles.valuesHeader}>
            <span className="eyebrow">What We Stand For</span>
            <h2 className={styles.valuesTitle}>{content.valuesTitle}</h2>
            <div className="ornament"><span /></div>
          </div>
          <div className={styles.valuesGrid}>
            {content.values.map((v, i) => (
              <div key={i} className={styles.valueCard}>
                <span className={styles.valueNum}>0{i + 1}</span>
                <span className={styles.valueIcon}>{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaBackdrop} aria-hidden="true" />
        <div className="container">
          <div className={styles.ctaInner}>
            <span className={styles.ctaEyebrow}>Taste the Difference</span>
            <h2>{content.ctaTitle}</h2>
            <p>{content.ctaSubtitle}</p>
            <Link to="/pre-order" className={styles.ctaBtn}>Pre-Order Now</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
