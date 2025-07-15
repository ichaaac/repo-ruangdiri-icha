import SharedOnboardingSplashScreen from "@/pages/shared/OnboardingSplashScreen";
import { useAuth } from "@/hooks/useAuth"; 

function OnboardingSplashScreen() {
  const { user } = useAuth();
  // Hapus definisi employeeBg jika tidak dipakai lagi di sini

  return (
    <SharedOnboardingSplashScreen 
      imageSrc="/onboarding-employee.png" 
      navigatePath="/employee-onboarding/form" 
      // Hapus onboardingBackground={employeeBg}
    />
  );
}
export default OnboardingSplashScreen;