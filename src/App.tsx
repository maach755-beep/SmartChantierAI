import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppShell } from '@/layouts/AppShell';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute, GuestRoute } from '@/components/auth/ProtectedRoute';
import { PageLoader } from '@/components/ui/PageLoader';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const TeamPage = lazy(() => import('@/pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const MaterialsPage = lazy(() => import('@/pages/MaterialsPage').then((m) => ({ default: m.MaterialsPage })));
const AiAnalysisPage = lazy(() => import('@/pages/AiAnalysisPage').then((m) => ({ default: m.AiAnalysisPage })));
const PhotoUploadPage = lazy(() => import('@/pages/PhotoUploadPage').then((m) => ({ default: m.PhotoUploadPage })));
const PlanAnalysisPage = lazy(() => import('@/pages/PlanAnalysisPage').then((m) => ({ default: m.PlanAnalysisPage })));
const PlanExtractionPage = lazy(() =>
  import('@/pages/plan-extraction/PlanExtractionPage').then((m) => ({ default: m.PlanExtractionPage }))
);
const FlooringPage = lazy(() => import('@/pages/FlooringPage').then((m) => ({ default: m.FlooringPage })));
const SiteTrackingPage = lazy(() => import('@/pages/SiteTrackingPage').then((m) => ({ default: m.SiteTrackingPage })));
const SiteDetailPage = lazy(() => import('@/pages/SiteDetailPage').then((m) => ({ default: m.SiteDetailPage })));
const ModificationsPage = lazy(() => import('@/pages/ModificationsPage').then((m) => ({ default: m.ModificationsPage })));
const RisksPage = lazy(() => import('@/pages/RisksPage').then((m) => ({ default: m.RisksPage })));
const ContractPage = lazy(() => import('@/pages/ContractPage').then((m) => ({ default: m.ContractPage })));
const AttendancePage = lazy(() => import('@/pages/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const SuppliersPage = lazy(() => import('@/pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage })));
const FinancePage = lazy(() => import('@/pages/FinancePage').then((m) => ({ default: m.FinancePage })));
const PlanningPage = lazy(() => import('@/pages/PlanningPage').then((m) => ({ default: m.PlanningPage })));
const FieldToOfficePage = lazy(() => import('@/pages/FieldToOfficePage').then((m) => ({ default: m.FieldToOfficePage })));
const PhotoComparisonPage = lazy(() =>
  import('@/pages/PhotoComparisonPage').then((m) => ({ default: m.PhotoComparisonPage }))
);
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const AssistantPage = lazy(() => import('@/pages/AssistantPage').then((m) => ({ default: m.AssistantPage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const CommandCenterPage = lazy(() => import('@/pages/CommandCenterPage').then((m) => ({ default: m.CommandCenterPage })));
const SituationAnalysisPage = lazy(() =>
  import('@/pages/SituationAnalysisPage').then((m) => ({ default: m.SituationAnalysisPage }))
);
const PurchaseAssistantPage = lazy(() =>
  import('@/pages/PurchaseAssistantPage').then((m) => ({ default: m.PurchaseAssistantPage }))
);
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const DirectorAssistantPage = lazy(() =>
  import('@/pages/DirectorAssistantPage').then((m) => ({ default: m.DirectorAssistantPage }))
);
const MaterialsLibraryPage = lazy(() =>
  import('@/pages/MaterialsLibraryPage').then((m) => ({ default: m.MaterialsLibraryPage }))
);
const DevisAssistantPage = lazy(() =>
  import('@/pages/DevisAssistantPage').then((m) => ({ default: m.DevisAssistantPage }))
);
const TechnicalSheetAssistantPage = lazy(() =>
  import('@/pages/AssistantFicheTechniquePage').then((m) => ({ default: m.AssistantFicheTechniquePage }))
);
const ProfitabilityCenterPage = lazy(() =>
  import('@/pages/ProfitabilityCenterPage').then((m) => ({ default: m.ProfitabilityCenterPage }))
);
const SiteJournalPage = lazy(() => import('@/pages/SiteJournalPage').then((m) => ({ default: m.SiteJournalPage })));
const DelayDetectionPage = lazy(() =>
  import('@/pages/DelayDetectionPage').then((m) => ({ default: m.DelayDetectionPage }))
);
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
                  <Route path="/register" element={<Lazy><RegisterPage /></Lazy>} />
                  <Route path="/forgot-password" element={<Lazy><ForgotPasswordPage /></Lazy>} />
                </Route>
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                      <Route path="/" element={<Lazy><DashboardPage /></Lazy>} />
                      <Route path="/projets" element={<Lazy><ProjectsPage /></Lazy>} />
                      <Route path="/taches" element={<Lazy><TasksPage /></Lazy>} />
                      <Route path="/equipe" element={<Lazy><TeamPage /></Lazy>} />
                      <Route path="/materiaux" element={<Lazy><MaterialsPage /></Lazy>} />
                      <Route path="/analyse-ia" element={<Lazy><AiAnalysisPage /></Lazy>} />
                      <Route path="/photos" element={<Lazy><PhotoUploadPage /></Lazy>} />
                      <Route path="/plans" element={<Lazy><PlanAnalysisPage /></Lazy>} />
                      <Route path="/plan-extraction" element={<Lazy><PlanExtractionPage /></Lazy>} />
                      <Route path="/revetements" element={<Lazy><FlooringPage /></Lazy>} />
                      <Route path="/suivi" element={<Lazy><SiteTrackingPage /></Lazy>} />
                      <Route path="/suivi/:id" element={<Lazy><SiteDetailPage /></Lazy>} />
                      <Route path="/modifications" element={<Lazy><ModificationsPage /></Lazy>} />
                      <Route path="/risques" element={<Lazy><RisksPage /></Lazy>} />
                      <Route path="/contrat" element={<Lazy><ContractPage /></Lazy>} />
                      <Route path="/pointage" element={<Lazy><AttendancePage /></Lazy>} />
                      <Route path="/fournisseurs" element={<Lazy><SuppliersPage /></Lazy>} />
                      <Route path="/finances" element={<Lazy><FinancePage /></Lazy>} />
                      <Route path="/planning" element={<Lazy><PlanningPage /></Lazy>} />
                      <Route path="/terrain" element={<Lazy><FieldToOfficePage /></Lazy>} />
                      <Route path="/photo-comparison" element={<Lazy><PhotoComparisonPage /></Lazy>} />
                      <Route path="/rapports" element={<Lazy><ReportsPage /></Lazy>} />
                      <Route path="/assistant" element={<Lazy><AssistantPage /></Lazy>} />
                      <Route path="/recherche" element={<Lazy><SearchPage /></Lazy>} />
                      <Route path="/pilotage" element={<Lazy><CommandCenterPage /></Lazy>} />
                      <Route path="/centre-pilotage" element={<Navigate to="/pilotage" replace />} />
                      <Route path="/directeur-ia-chantier" element={<Navigate to="/pilotage" replace />} />
                      <Route path="/analyse-situation-chantier" element={<Lazy><SituationAnalysisPage /></Lazy>} />
                      <Route path="/assistant-achat" element={<Lazy><PurchaseAssistantPage /></Lazy>} />
                      <Route path="/assistant-directeur-ia" element={<Lazy><DirectorAssistantPage /></Lazy>} />
                      <Route path="/bibliotheque-materiaux" element={<Lazy><MaterialsLibraryPage /></Lazy>} />
                      <Route path="/assistant-devis-ia" element={<Lazy><DevisAssistantPage /></Lazy>} />
                      <Route path="/assistant-fiche-technique" element={<Lazy><TechnicalSheetAssistantPage /></Lazy>} />
                      <Route path="/centre-rentabilite" element={<Lazy><ProfitabilityCenterPage /></Lazy>} />
                      <Route path="/journal-chantier-ia" element={<Lazy><SiteJournalPage /></Lazy>} />
                      <Route path="/detection-retard" element={<Lazy><DelayDetectionPage /></Lazy>} />
                      <Route path="/documents" element={<Lazy><DocumentsPage /></Lazy>} />
                      <Route path="/parametres" element={<Lazy><SettingsPage /></Lazy>} />
                      <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
