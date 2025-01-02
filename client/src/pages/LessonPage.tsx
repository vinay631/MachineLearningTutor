import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import type { Lesson, Question, CodingExercise } from "@db/schema";

type LessonWithContent = Lesson & {
  questions: Question[];
  codingExercises: CodingExercise[];
};

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const { data: lesson } = useQuery<LessonWithContent>({
    queryKey: [`/api/lessons/${id}`],
  });

  const submitProgress = useMutation({
    mutationFn: async (score: number) => {
      const res = await fetch(`/api/progress/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  if (!lesson) {
    return null;
  }

  const content = lesson.type === 'quiz' ? lesson.questions : lesson.codingExercises;
  const totalItems = content.length;
  const currentItem = content[currentIndex];
  const progress = ((currentIndex + 1) / totalItems) * 100;

  const handleNext = (passed: boolean) => {
    if (lesson.type === 'quiz' && !selectedAnswer) {
      toast({
        variant: "destructive",
        title: "Please select an answer",
      });
      return;
    }

    if (lesson.type === 'quiz') {
      const currentQ = currentItem as Question;
      const correct = selectedAnswer === currentQ.correctAnswer;
      if (correct) {
        setScore(score + 1);
      }

      toast({
        variant: correct ? "default" : "destructive",
        title: correct ? "Correct!" : "Incorrect",
        description: currentQ.explanation,
      });
    } else if (passed) {
      setScore(score + 1);
    }

    if (currentIndex === totalItems - 1) {
      const finalScore = ((score + (passed ? 1 : 0)) / totalItems) * 100;
      submitProgress.mutate(finalScore, {
        onSuccess: () => {
          toast({
            title: "Lesson completed!",
            description: `You scored ${finalScore.toFixed(0)}%`,
          });
          setLocation("/");
        },
      });
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Lessons
      </Button>

      <Progress value={progress} className="mb-8" />

      <Card>
        <CardContent className="pt-6">
          {lesson.type === 'quiz' ? (
            <>
              <h2 className="text-xl font-semibold mb-4">
                {(currentItem as Question).question}
              </h2>

              <RadioGroup
                value={selectedAnswer}
                onValueChange={setSelectedAnswer}
                className="space-y-4"
              >
                {JSON.parse((currentItem as Question).options).map((option: string) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>

              <Button
                onClick={() => handleNext(false)}
                className="mt-6 w-full"
              >
                {currentIndex === totalItems - 1 ? (
                  "Complete Lesson"
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <CodeEditor
              exercise={currentItem as CodingExercise}
              onComplete={handleNext}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}