import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Search, ArrowRight, Star, MapPin } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address?: string;
}

export function RestaurantSelector() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch('https://backend-vijay19.vercel.app/api/v1/restaurants');
        const data = await res.json();
        if (data.success) {
          setRestaurants(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/60">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-0 w-80 h-80 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-orange-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent mb-3">
            Apna Restaurant
          </h1>
          <p className="text-white/60 text-lg">Select your restaurant to order</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        {/* Restaurant List */}
        <div className="space-y-4">
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 text-lg">No restaurants found</p>
            </div>
          ) : (
            filteredRestaurants.map((restaurant, index) => (
              <button
                key={restaurant.id}
                onClick={() => navigate(`/order/${restaurant.slug}`)}
                className="w-full group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all text-left"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                      <Utensils className="w-7 h-7 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
                        {restaurant.name}
                      </h3>
                      {restaurant.address && (
                        <p className="text-sm text-white/50 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {restaurant.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/40 group-hover:text-orange-400 group-hover:translate-x-2 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Demo Restaurant Quick Access */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-center text-white/40 text-sm mb-4">Quick Access</p>
          <button
            onClick={() => navigate('/order/apna-restaurant')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 hover:border-orange-500/50 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-orange-400" />
              <span className="text-white font-semibold">Demo Restaurant</span>
            </div>
            <span className="text-xs text-orange-400 bg-orange-500/20 px-3 py-1 rounded-full">Try Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
