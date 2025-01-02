import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { CodingExercise } from "@db/schema";

interface CodeEditorProps {
  exercise: CodingExercise;
  onComplete: (passed: boolean) => void;
}

export default function CodeEditor({ exercise, onComplete }: CodeEditorProps) {
  const [code, setCode] = useState(exercise.initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    message: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const hints = JSON.parse(exercise.hints) as string[];
  const [currentHint, setCurrentHint] = useState(0);

  useEffect(() => {
    // Reset state when exercise changes
    setCode(exercise.initialCode);
    setResult(null);
    setShowHint(false);
    setCurrentHint(0);
  }, [exercise]);

  const runCode = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const testCases = JSON.parse(exercise.testCases);
      
      // Create pyodide instance and run the code
      const { loadPyodide } = await import("pyodide");
      const pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
      });
      
      // Run the code and test cases
      await pyodide.loadPackagesFromImports(code);
      await pyodide.runPythonAsync(code);
      
      let allPassed = true;
      let failedMessage = "";

      for (const test of testCases) {
        const result = await pyodide.runPythonAsync(test.test);
        if (!result) {
          allPassed = false;
          failedMessage = test.message || "Test case failed";
          break;
        }
      }

      if (allPassed) {
        setResult({
          passed: true,
          message: "All test cases passed! Great job!"
        });
        onComplete(true);
      } else {
        setResult({
          passed: false,
          message: failedMessage
        });
      }
    } catch (error: any) {
      setResult({
        passed: false,
        message: error.message || "An error occurred while running your code"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const showNextHint = () => {
    if (currentHint < hints.length - 1) {
      setCurrentHint(prev => prev + 1);
    }
    setShowHint(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0 min-h-[400px]">
          <Editor
            height="400px"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={value => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              automaticLayout: true,
            }}
          />
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4 border-t">
          <Button
            variant="outline"
            onClick={showNextHint}
            disabled={currentHint === hints.length - 1 && showHint}
          >
            {showHint ? "Next Hint" : "Show Hint"}
          </Button>
          <Button onClick={runCode} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              "Run Code"
            )}
          </Button>
        </CardFooter>
      </Card>

      {showHint && (
        <Alert>
          <AlertDescription>
            Hint {currentHint + 1}: {hints[currentHint]}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert variant={result.passed ? "default" : "destructive"}>
          {result.passed ? (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          ) : (
            <XCircle className="h-4 w-4 mr-2" />
          )}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
