import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface SignupPromptProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignupPromptDialog({
  isOpen,
  onOpenChange,
}: SignupPromptProps) {
  const router = useRouter();

  const handleSignup = () => {
    router.push("/auth/signup");
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlock Unlimited Generations</AlertDialogTitle>
          <AlertDialogDescription>
            You've used your 2 free image generations. Sign up or log in to
            unlock unlimited generations and access all premium features.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue as Guest</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>Sign In</AlertDialogAction>
          <AlertDialogAction onClick={handleSignup} className="bg-primary">
            Sign Up
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
