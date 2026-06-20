import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "Faith and Deliverance Ministries Global | Faith. Deliverance. Transformation.",
  description:
    "Faith and Deliverance Ministries Global — a worldwide family of believers pursuing faith, deliverance, and transformation through Christ. HQ in The Gambia.",
  openGraph: {
    title: "Faith and Deliverance Ministries Global",
    description:
      "Faith, deliverance, and transformation through Christ. Join us live for worship and the Word of God.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
