import React from 'react';

/**
 * Demo component to visualize the Last Login Toast
 * This is just for demonstration purposes
 */
export default function LastLoginToastDemo() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-8">Last Login Toast Preview</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Toast Appearance (Top-Right Corner):</h2>

        {/* Demo Toast */}
        <div className="fixed top-4 right-4 space-y-2 z-50">
          <div className="px-6 py-4 rounded-xl shadow-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white max-w-md animate-slide-in border-2 border-white/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-base mb-1.5 flex items-center gap-2">
                  <span>🔐 Last Login</span>
                </div>
                <div className="text-sm opacity-95 font-medium leading-relaxed">
                  October 21, 2025 at 6:30 PM
                </div>
                <div className="text-xs opacity-75 mt-2">Welcome back! 👋</div>
              </div>
              <button className="flex-shrink-0 text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Enhanced Features:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>✨ Beautiful gradient background (indigo to purple)</li>
          <li>🔐 Lock emoji + Clock icon in circular badge</li>
          <li>📍 Positioned at TOP-RIGHT for maximum visibility</li>
          <li>💫 Clear heading with emoji: "🔐 Last Login"</li>
          <li>📅 Human-readable date format</li>
          <li>👋 Friendly "Welcome back!" message</li>
          <li>❌ Manual close button (X)</li>
          <li>🎬 Smooth slide-in + fade-in animation</li>
          <li>⏱️ Auto-dismisses after 5 seconds</li>
          <li>📱 Responsive and mobile-friendly</li>
          <li>🎨 White border for depth</li>
          <li>✅ Shows ONCE per login session</li>
        </ul>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ How It Works</h3>
        <ol className="text-blue-700 space-y-2 list-decimal list-inside">
          <li>User logs in (Admin or Student)</li>
          <li>
            Backend returns <code className="bg-blue-100 px-2 py-1 rounded">last_login_at</code>{' '}
            timestamp
          </li>
          <li>Frontend stores it in localStorage</li>
          <li>User is redirected to dashboard</li>
          <li>Dashboard detects stored timestamp</li>
          <li>Beautiful toast appears at top-right</li>
          <li>Timestamp is cleared (shows only once)</li>
          <li>Toast auto-dismisses after 5 seconds</li>
        </ol>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Backend Required</h3>
        <p className="text-yellow-700 mb-3">
          For this feature to work, your backend must include the{' '}
          <code className="bg-yellow-100 px-2 py-1 rounded">last_login_at</code> field in the login
          response. See{' '}
          <code className="bg-yellow-100 px-2 py-1 rounded">LAST_LOGIN_FEATURE.md</code> for
          details.
        </p>
        <div className="bg-yellow-100 p-4 rounded mt-3">
          <p className="font-mono text-sm text-yellow-900">
            {`{`}
            <br />
            &nbsp;&nbsp;"token": "eyJhbGci...",
            <br />
            &nbsp;&nbsp;"role": "ADMIN",
            <br />
            &nbsp;&nbsp;
            <span className="font-bold">"last_login_at": "2025-10-21T18:30:00.000Z"</span>
            <br />
            {`}`}
          </p>
        </div>
      </div>
    </div>
  );
}
