import "./globals.css";

export const metadata = {
  title: "Zomoky Checkout",
  description: "Fast, conversion-focused checkout for Zomoky",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
