import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, MessageCircle, Heart, Share2, Users, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import moment from "moment";
import "moment/locale/pt-br";

moment.locale('pt-br');

export default function RecentActivitySection({ userEmail }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      loadActivities();
    }
  }, [userEmail]);

  const loadActivities = async () => {
    try {
      const allActivities = [];

      // Posts created
      const posts = await base44.entities.CommunityPost.filter({
        author_email: userEmail
      }, '-created_date', 5);
      
      posts.forEach(post => {
        allActivities.push({
          type: 'post_created',
          icon: MessageCircle,
          color: 'text-blue-500',
          description: 'Criou um post',
          content: post.content?.substring(0, 80) + (post.content?.length > 80 ? '...' : ''),
          timestamp: post.created_date
        });
      });

      // Course enrollments
      const enrollments = await base44.entities.UserEnrollment.filter({
        user_email: userEmail
      }, '-started_at', 3);

      enrollments.forEach(enrollment => {
        allActivities.push({
          type: 'course_enrolled',
          icon: BookOpen,
          color: 'text-emerald-500',
          description: 'Iniciou um curso',
          timestamp: enrollment.started_at
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(allActivities.slice(0, 10));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, idx) => (
              <Skeleton key={idx} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-500" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={`p-2 rounded-full bg-white dark:bg-gray-900`}>
                    <Icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    {activity.content && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {activity.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {moment(activity.timestamp).fromNow()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma atividade recente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}