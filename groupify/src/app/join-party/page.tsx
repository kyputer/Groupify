import { Suspense } from 'react';
import JoinParty from '@/components/JoinParty';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <JoinParty />
    </Suspense>
  );
}
