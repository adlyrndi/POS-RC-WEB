import './globals.css';

export const metadata = {
  title: 'POS RoomCollection',
  description: 'Point of Sale & Business Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
