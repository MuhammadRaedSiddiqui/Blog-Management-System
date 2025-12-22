import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/actions/users';
import { ProfileForm } from '@/components/forms/profile-form';
import { User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Get current user profile
  const result = await getCurrentUserProfile();

  if (result.error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const user = result.data!;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your public profile information
          </p>
        </div>
      </div>

      <ProfileForm
        initialData={{
          name: user.name,
          bio: user.bio,
          email: user.email,
        }}
      />
    </div>
  );
}
