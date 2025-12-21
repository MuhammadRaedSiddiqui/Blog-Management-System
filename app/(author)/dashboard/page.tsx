import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to posts page by default
  redirect('/dashboard/posts');
}
