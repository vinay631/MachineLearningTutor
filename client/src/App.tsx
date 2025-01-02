import { Switch, Route } from "wouter";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import LessonPage from "./pages/LessonPage";
import ProfilePage from "./pages/ProfilePage";
import Header from "./components/Header";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/lesson/:id" component={LessonPage} />
          <Route path="/profile" component={ProfilePage} />
        </Switch>
      </main>
    </div>
  );
}

export default App;
