import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Authorise() {
  const router = useRouter();

  useEffect(() => {
    router.push('/api/authorise');
  }, [router]);

  return <p>Redirecting to Spotify authorization...</p>;
}
