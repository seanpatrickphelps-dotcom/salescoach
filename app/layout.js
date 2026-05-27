export const metadata = {
  title: 'Sales Coach',
  description: 'AI coaching for in-home estimates',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
