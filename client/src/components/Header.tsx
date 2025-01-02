import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { User, LogOut } from "lucide-react";

export default function Header() {
  const { user, logout } = useUser();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <NavigationMenu className="flex justify-between max-w-none">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>

          <NavigationMenuList>
            <NavigationMenuItem className="flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" />
                  {user?.username}
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => logout()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
