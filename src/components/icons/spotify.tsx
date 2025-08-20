import * as React from "react";

export function SpotifyLogo({ className }: { className?: string }){
  // Simple Icons Spotify glyph path (CC0), using currentColor for fill so it renders white on primary buttons
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="currentColor"
      role="img"
    >
      <path d="M12 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 12 12s12-5.372 12-12C24 5.373 18.628 0 12 0zm10.178 17.313c-.127.209-.401.274-.61.146-3.355-2.047-7.577-2.512-12.552-1.378-.236.054-.474-.093-.528-.33-.055-.236.093-.474.33-.528 5.206-1.193 9.652-.685 13.199 1.505.21.127.276.401.161.585zm1.366-3.045c-.16.258-.498.34-.756.182-3.838-2.349-9.685-3.032-14.254-1.662-.286.086-.59-.077-.676-.362-.086-.285.077-.59.362-.676 4.944-1.428 11.14-.671 15.29 1.86.26.16.341.498.182.758zm.075-3.158c-.192.31-.602.406-.912.214-4.373-2.677-11.04-2.917-15.01-1.61-.31.096-.64-.08-.736-.39-.095-.31.08-.64.39-.736 4.29-1.325 11.426-1.056 16.206 1.825.31.192.406.602.214.912z"/>
    </svg>
  );
}

export default SpotifyLogo;
