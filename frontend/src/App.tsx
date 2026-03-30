import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import AuthGuard from './components/AuthGuard'
import ErrorBoundary from './components/ErrorBoundary'
import NavBar from './components/NavBar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MainPage from './pages/MainPage'
import MyPage from './pages/MyPage'
import GroupCreatePage from './pages/GroupCreatePage'
import GroupDetailPage from './pages/GroupDetailPage'
import GroupManagePage from './pages/GroupManagePage'
import JoinPage from './pages/JoinPage'
import GameRecordCreatePage from './pages/GameRecordCreatePage'
import GameRecordEditPage from './pages/GameRecordEditPage'
import GameRecordListPage from './pages/GameRecordListPage'
import GameRecordManagePage from './pages/GameRecordManagePage'
import EventCreatePage from './pages/EventCreatePage'
import EventDetailPage from './pages/EventDetailPage'
import EventManagePage from './pages/EventManagePage'
import GroupRankingPage from './pages/GroupRankingPage'
import MemberStatsPage from './pages/MemberStatsPage'
import UserProfilePage from './pages/UserProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import ForbiddenPage from './pages/ForbiddenPage'

function NavLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Toaster position="top-right" richColors theme="system" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<NavLayout />}>
          <Route element={<AuthGuard />}>
            <Route path="/join" element={<JoinPage />} />
            <Route path="/" element={<MainPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/groups/new" element={<GroupCreatePage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/groups/:id/manage" element={<GroupManagePage />} />
            <Route path="/groups/:id/games/new" element={<GameRecordCreatePage />} />
            <Route path="/groups/:id/ranking" element={<GroupRankingPage />} />
            <Route path="/groups/:groupId/members/:userId/stats" element={<MemberStatsPage />} />
            <Route path="/groups/:id/events/new" element={<EventCreatePage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/events/:eventId/manage" element={<EventManagePage />} />
            <Route path="/game-records/:recordId/edit" element={<GameRecordEditPage />} />
            <Route path="/groups/:groupId/records" element={<GameRecordListPage />} />
            <Route path="/groups/:groupId/records/manage" element={<GameRecordManagePage />} />
            <Route path="/users/:userId" element={<UserProfilePage />} />
          </Route>
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
