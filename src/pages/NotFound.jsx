import { Link } from 'react-router-dom';
import { Card } from '../components/UI';

export default function NotFound() {
  return <Card><div className="empty-state"><div className="empty-icon">404</div><strong>Page not found</strong><span>The requested prototype page does not exist.</span><Link className="button button-primary" to="/dashboard">Back to dashboard</Link></div></Card>;
}
