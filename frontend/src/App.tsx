import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { ErrorBoundary, AuthModal } from './shared/components'
import { useAppDispatch } from './app/hooks'
import { fetchUser } from './features/auth/authSlice'

function AppInner() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchUser());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      <AppRoutes />
      <AuthModal />
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}

export default App