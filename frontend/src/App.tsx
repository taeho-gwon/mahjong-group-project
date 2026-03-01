import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MainPage from './pages/MainPage'
import MyPage from './pages/MyPage'
import GroupDetailPage from './pages/GroupDetailPage'
import GroupManagePage from './pages/GroupManagePage'
import JoinPage from './pages/JoinPage'
import GameRecordCreatePage from './pages/GameRecordCreatePage'
import ContestCreatePage from './pages/ContestCreatePage'
import ContestDetailPage from './pages/ContestDetailPage'
import GroupRankingPage from './pages/GroupRankingPage'

function App() {
  return (
    <BrowserRouter>
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
