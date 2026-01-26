import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

function Header() {
  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold hover:text-gray-300">
              Susy Recipe Viewer
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link to="/items" className="hover:text-gray-300 transition">
                Items
              </Link>
              <Link to="/fluids" className="hover:text-gray-300 transition">
                Fluids
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-700 text-white rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
