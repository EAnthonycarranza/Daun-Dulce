import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound = () => {
  return (
    <div className={styles.notFound}>
      <h1>404</h1>
      <p>Oops! This page doesn't exist.</p>
      <Link to="/" className={styles.homeLink}>Back to Home</Link>
    </div>
  );
};

export default NotFound;
