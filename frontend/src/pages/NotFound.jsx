import React from 'react';

/**
 * Page: NotFound
 *
 * Displays a 404 error message for routes that do not match any defined page.
 *
 * Features:
 *   - Shows a user-friendly 404 message
 *   - Provides a simple, centered layout
 *
 * Usage:
 *   Used as a fallback route in the app's router.
 */

export default function NotFound(){
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-3xl font-bold mb-2">404</h1>
				<p>Page not found</p>
			</div>
		</div>
	);
}
