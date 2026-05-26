import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Lock } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 max-w-md w-full">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-destructive/10 rounded-lg">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-center">
            Access Denied
          </h1>
          <p className="text-base text-muted-foreground text-center">
            You do not have the required permissions to access the Styly Admin Dashboard. Only administrators can access this area.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
          >
            Sign in as Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
