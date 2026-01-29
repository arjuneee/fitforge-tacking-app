import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProgramsPage } from "./pages/ProgramsPage";
import { ProgramDetailPage } from "./pages/ProgramDetailPage";
import { ProgramEditPage } from "./pages/ProgramEditPage";
import { WorkoutDetailPage } from "./pages/WorkoutDetailPage";
import { WorkoutEditPage } from "./pages/WorkoutEditPage";
import { WorkoutStartPage } from "./pages/WorkoutStartPage";
import { ActiveWorkoutPage } from "./pages/ActiveWorkoutPage";
import { SessionCompletePage } from "./pages/SessionCompletePage";
import { ExerciseHistoryPage } from "./pages/ExerciseHistoryPage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { ExerciseSelectPage } from "./pages/ExerciseSelectPage";
import { ExerciseCreatePage } from "./pages/ExerciseCreatePage";
import { PersonalRecordsPage } from "./pages/PersonalRecordsPage";
import { WeightLogPage } from "./pages/WeightLogPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { InstallPrompt } from "./components/InstallPrompt";
import { SyncStatusIndicator } from "./components/SyncStatusIndicator";

export function App() {
  return (
    <>
      <InstallPrompt />
      <SyncStatusIndicator />
      <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs"
        element={
          <ProtectedRoute>
            <ProgramsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs/new"
        element={
          <ProtectedRoute>
            <ProgramEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs/:id"
        element={
          <ProtectedRoute>
            <ProgramDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs/:id/edit"
        element={
          <ProtectedRoute>
            <ProgramEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/new"
        element={
          <ProtectedRoute>
            <WorkoutEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/:id"
        element={
          <ProtectedRoute>
            <WorkoutDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/start"
        element={
          <ProtectedRoute>
            <WorkoutStartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/active/:sessionId"
        element={
          <ProtectedRoute>
            <ActiveWorkoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts/complete/:sessionId"
        element={
          <ProtectedRoute>
            <SessionCompletePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={
          <ProtectedRoute>
            <ExercisesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises/:exerciseId/history"
        element={
          <ProtectedRoute>
            <ExerciseHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises/select"
        element={
          <ProtectedRoute>
            <ExerciseSelectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises/create"
        element={
          <ProtectedRoute>
            <ExerciseCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personal-records"
        element={
          <ProtectedRoute>
            <PersonalRecordsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weight-log"
        element={
          <ProtectedRoute>
            <WeightLogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
    </>
  );
}

