import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CodeReview AI Agent | MiMo-Powered Code Analysis',
  description: 'AI-powered code review agent using MiMo v2.5 Pro for deep multi-pass analysis of pull requests.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0a0a0f' }}>
        {children}
      </body>
    </html>
  );
}
