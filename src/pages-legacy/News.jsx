import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Newspaper } from "lucide-react";
import NewsFeed from "@/components/news/NewsFeed";

export default function NewsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Newspaper className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Notícias Financeiras</h1>
            <p className="text-gray-400">Acompanhe as últimas notícias personalizadas para você</p>
          </div>
        </div>

        {/* News Feed */}
        {!loading && user && (
          <NewsFeed userEmail={user.email} compact={false} />
        )}
      </div>
    </div>
  );
}