import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="font-marker text-6xl font-normal text-burnt">404</h1>
      <p className="text-lg">We couldn't find that page.</p>
      <Link to="/home" className="btn-primary">Back home</Link>
    </div>
  );
}
