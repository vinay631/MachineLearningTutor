import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Brain, BookOpen, Award, Sparkles } from "lucide-react";
import type { Lesson } from "@db/schema";

interface RecommendedLesson extends Lesson {
  recommendationScore: number;
  recommendationReason: string;
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: recommendations } = useQuery<RecommendedLesson[]>({
    queryKey: ["/api/recommendations"],
  });

  const modules = lessons
    ? Array.from(new Set(lessons.map((l) => l.module)))
    : [];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Learn Machine Learning
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Master ML concepts through interactive lessons and hands-on practice
        </p>
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Recommended for You
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((lesson) => (
              <Card
                key={lesson.id}
                className="hover:shadow-lg transition-shadow border-2 border-primary/20"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">
                      Match Score: {lesson.recommendationScore}%
                    </Badge>
                    <Badge variant="outline">
                      Level {lesson.difficulty}
                    </Badge>
                  </div>
                  <CardTitle>{lesson.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-2">
                    {lesson.description}
                  </p>
                  <p className="text-sm text-primary/80 italic mb-4">
                    {lesson.recommendationReason}
                  </p>
                  <Button
                    onClick={() => setLocation(`/lesson/${lesson.id}`)}
                    className="w-full"
                  >
                    Start Lesson
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {modules.map((module) => (
        <div key={module} className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            {module}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lessons
              ?.filter((l) => l.module === module)
              .map((lesson) => (
                <Card
                  key={lesson.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{lesson.title}</span>
                      <Badge variant="secondary">
                        Level {lesson.difficulty}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {lesson.description}
                    </p>
                    <Button
                      onClick={() => setLocation(`/lesson/${lesson.id}`)}
                      className="w-full"
                    >
                      Start Lesson
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}