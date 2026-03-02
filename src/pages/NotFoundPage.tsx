import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-display text-gold text-xs tracking-[0.3em] mb-6">404</p>
        <h1 className="font-heading text-4xl mb-4">Page Not Found</h1>
        <div className="gold-rule mx-auto mb-6" />
        <p className="font-body text-afinju-black/55 mb-10 leading-relaxed">
          The page you are looking for does not exist, or may have moved.
          The authority set is still very much available.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-luxury text-xs py-3 px-8">Return Home</Link>
          <Link to="/shop" className="btn-outline text-xs py-3 px-8">View the Collection</Link>
        </div>
      </div>
    </div>
  )
}
