import AdminClient from "./admin-client";
export const metadata = {
  title: "Owner bookings | Casa Atlante",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Page() {
  return <AdminClient />;
}
