import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Brain, Clock, ArrowRight } from "lucide-react";
import type { DiagnosticQuiz } from "@db/schema";

interface QuizResponse {
  quizId: number;
  answer: string;
  responseTime: number;
}

export default function DiagnosticQuizPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const { data: questions } = useQuery<DiagnosticQuiz[]>({
    queryKey: ["/api/diagnostic-quiz"],
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (responses: QuizResponse[]) => {
      const res = await fetch("/api/diagnostic-quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex]);

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const options = JSON.parse(currentQuestion.options);

  const handleNext = () => {
    if (!selectedAnswer) {
      toast({
        variant: "destructive",
        title: "Please select an answer",
      });
      return;
    }

    const responseTime = Math.floor((Date.now() - startTime) / 1000);
    const response: QuizResponse = {
      quizId: currentQuestion.id,
      answer: selectedAnswer,
      responseTime,
    };

    setResponses([...responses, response]);

    if (currentIndex === questions.length - 1) {
      submitQuizMutation.mutate([...responses, response], {
        onSuccess: () => {
          toast({
            title: "Quiz completed!",
            description: "Your personalized learning path is being generated.",
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
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Skill Assessment</h1>
        <p className="text-muted-foreground">
          Let's understand your current knowledge level to personalize your learning journey.
        </p>
      </div>

      <Progress value={progress} className="mb-8" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Question {currentIndex + 1} of {questions.length}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Topic: {currentQuestion.topic}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg font-medium">{currentQuestion.question}</p>

          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            className="space-y-4"
          >
            {options.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </RadioGroup>

          <Button
            onClick={handleNext}
            className="w-full"
            disabled={submitQuizMutation.isPending}
          >
            {currentIndex === questions.length - 1 ? (
              "Complete Assessment"
            ) : (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
