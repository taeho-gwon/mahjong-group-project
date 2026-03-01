import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import AuthGuard from './components/AuthGuard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MainPage from './pages/MainPage'
import MyPage from './pages/MyPage'
import GroupDetailPage from './pages/GroupDetailPage'
import GroupManagePage from './pages/GroupManagePage'
import JoinPage from './pages/JoinPage'
import GameRecordCreatePage from './pages/GameRecordCreatePage'
import GameRecordEditPage from './pages/GameRecordEditPage'
import GameRecordManagePage from './pages/GameRecordManagePage'
import ContestCreatePage from './pages/ContestCreatePage'
import ContestDetailPage from './pages/ContestDetailPage'
import ContestManagePage from './pages/ContestManagePage'
import GroupRankingPage from './pages/GroupRankingPage'
import UserProfilePage from './pages/UserProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route element={<AuthGuard />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/groups/:id/manage" element={<GroupManagePage />} />
          <Route path="/groups/:id/games/new" element={<GameRecordCreatePage />} />
          <Route path="/groups/:id/ranking" element={<GroupRankingPage />} />
          <Route path="/groups/:id/contests/new" element={<ContestCreatePage />} />
          <Route path="/contests/:contestId" element={<ContestDetailPage />} />
          <Route path="/contests/:contestId/manage" element={<ContestManagePage />} />
          <Route path="/game-records/:recordId/edit" element={<GameRecordEditPage />} />
          <Route path="/groups/:groupId/records/manage" element={<GameRecordManagePage />} />
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
