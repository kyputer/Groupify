import { useDispatch } from 'react-redux';
import { resetAll } from '@/lib/actions';


export const LogOutButton = () => {
    const dispatch = useDispatch();

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        dispatch(resetAll());
        window.location.href = '/login'; // Redirect to login page
      };

    return (
    <button
        className="ml-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        onClick={handleLogout}
    >
        Logout
    </button>
    )
}

