import React from 'react';
import { ExperienceProvider } from '../context/ExperienceContext';
import { ScrollProvider } from '../context/ScrollContext';

interface ExperienceRootProps {
  children: React.ReactNode;
}

/**
 * ExperienceRoot
 * High-level orchestration wrapper providing Experience and single-Lenis Scroll context.
 */
export const ExperienceRoot: React.FC<ExperienceRootProps> = ({ children }) => {
  return (
    <ExperienceProvider>
      <ScrollProvider>{children}</ScrollProvider>
    </ExperienceProvider>
  );
};
