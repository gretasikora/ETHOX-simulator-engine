import { useState, FormEvent } from 'react';
import { authAPI } from '../utils/auth';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authAPI.login(password);
    
    if (result) {
      window.location.reload();
    } else {
      setError('Invalid password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aurora-bg0 via-aurora-bg1 to-aurora-surface0 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-aurora-surface1 rounded-lg shadow-aurora-glow p-8 border border-aurora-border-strong">
          <div className="text-center mb-8">
            <img 
              src="/logo-no-bg (1).png" 
              alt="Epistemea" 
              className="w-24 h-24 mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-aurora-text0 mb-2">Epistemea</h1>
            <p className="text-base text-aurora-text2">Enter password to access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-base font-medium text-aurora-text1 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-aurora-surface2 border border-aurora-border rounded-lg text-base text-aurora-text0 placeholder-aurora-text2 focus:outline-none focus:ring-2 focus:ring-aurora-accent1 focus:border-transparent"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-aurora-danger/20 border border-aurora-danger rounded-lg p-3 text-aurora-danger text-base">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-aurora-accent1 to-aurora-accent0 hover:opacity-90 disabled:opacity-50 text-aurora-bg0 font-semibold py-3 px-4 rounded-lg text-base transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-aurora-accent1 focus:ring-offset-2 focus:ring-offset-aurora-bg1 shadow-aurora-glow-sm"
            >
              {loading ? 'Authenticating...' : 'Access Application'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-aurora-text2">
            <p>Belief dynamics simulation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
