import SharedOnboardingSplashScreen from "@/pages/shared/OnboardingSplashScreen";
import { useAuth } from "@/hooks/useAuth";

function OnboardingSplashScreen() {
  const { user } = useAuth();

  return (
    <SharedOnboardingSplashScreen 
      imageSrc="/onboarding-student.png" 
      navigatePath="/student-onboarding/form" 
      // Hapus onboardingBackground di sini
    />
  );
}
export default OnboardingSplashScreen;