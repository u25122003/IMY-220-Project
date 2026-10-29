import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Header from './components/Header';
import SplashPage from './pages/SplashPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PostPage from './pages/PostPage';
import AlbumPage from './pages/AlbumPage';
import SearchPage from './pages/SearchPage';
import CreatePostPage from './pages/CreatePostPage';
import CreateAlbumPage from './pages/CreateAlbumPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Every page except the splash page needs a logged-in user and shares the header
function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="py-6 text-center font-marker text-muted">Pick n Post</footer>
    </div>
  );
}

function AdminOnly() {
  const { user } = useAuth();
  return user?.isAdmin ? <Outlet /> : <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/album/:id" element={<AlbumPage />} />
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/create-album" element={<CreateAlbumPage />} />
            <Route element={<AdminOnly />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
