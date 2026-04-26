import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SetupWizard from "./SetupWizard";
import InteractiveTutorial from "./InteractiveTutorial";

export default function OnboardingManager({ userEmail, children }) {
  const [showWizard, setShowWizard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (userEmail) {
      checkOnboarding();
    }
  }, [userEmail]);

  const checkOnboarding = async () => {
    try {
      const data = await base44.entities.UserOnboarding.filter({ user_email: userEmail });
      
      if (data.length === 0) {
        // Novo usuário - criar registro e mostrar wizard
        await base44.entities.UserOnboarding.create({
          user_email: userEmail,
          onboarding_started_at: new Date().toISOString()
        });
        setShowWizard(true);
      } else {
        // Verificar se precisa mostrar wizard ou tutorial
        if (!data[0].completed_wizard) {
          setShowWizard(true);
        } else if (!data[0].completed_tutorial) {
          setShowTutorial(true);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    setShowTutorial(true);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  return (
    <>
      {children}
      {userEmail && showWizard && (
        <SetupWizard 
          open={showWizard} 
          onComplete={handleWizardComplete}
          userEmail={userEmail}
        />
      )}
      {userEmail && showTutorial && (
        <InteractiveTutorial 
          open={showTutorial}
          onComplete={handleTutorialComplete}
          userEmail={userEmail}
        />
      )}
    </>
  );
}