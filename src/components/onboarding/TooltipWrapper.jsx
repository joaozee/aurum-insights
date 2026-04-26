import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ContextualTooltip from "./ContextualTooltip";

export default function TooltipWrapper({ 
  id, 
  title, 
  description, 
  children, 
  position = "bottom",
  userEmail,
  className = ""
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (userEmail) {
      checkIfShouldShow();
    }
  }, [userEmail]);

  const checkIfShouldShow = async () => {
    try {
      const onboarding = await base44.entities.UserOnboarding.filter({ user_email: userEmail });
      
      if (onboarding.length > 0) {
        const isDismissed = onboarding[0].dismissed_tooltips?.includes(id);
        const showTooltips = onboarding[0].show_tooltips !== false;
        const completedWizard = onboarding[0].completed_wizard;
        
        // Mostrar tooltip se: completou wizard, tooltips ativos, e não foi dispensado
        if (completedWizard && showTooltips && !isDismissed) {
          setDismissed(false);
          setTimeout(() => setShowTooltip(true), 500);
        } else {
          setDismissed(true);
        }
      } else {
        setDismissed(true);
      }
    } catch (error) {
      console.error(error);
      setDismissed(true);
    }
  };

  const handleDismiss = async () => {
    setShowTooltip(false);
    
    try {
      const onboarding = await base44.entities.UserOnboarding.filter({ user_email: userEmail });
      if (onboarding.length > 0) {
        const currentDismissed = onboarding[0].dismissed_tooltips || [];
        await base44.entities.UserOnboarding.update(onboarding[0].id, {
          dismissed_tooltips: [...currentDismissed, id]
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Sempre renderizar children
  if (!userEmail) {
    return children;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      {showTooltip && !dismissed && (
        <ContextualTooltip
          id={id}
          title={title}
          description={description}
          position={position}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}