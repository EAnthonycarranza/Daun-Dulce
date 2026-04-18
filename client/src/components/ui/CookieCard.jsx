import { useState } from 'react';
import styles from './CookieCard.module.css';

const CookieCard = ({ cookie }) => {
  const [imgError, setImgError] = useState(false);

  const hasImage = cookie.image && !imgError;

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {hasImage ? (
          <img
            src={cookie.image}
            alt={cookie.name}
            className={styles.image}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.placeholder}>
            <span>🍪</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{cookie.name}</h3>
        <p className={styles.description}>{cookie.description}</p>
        {cookie.tags && cookie.tags.length > 0 && (
          <div className={styles.tags}>
            {cookie.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieCard;
