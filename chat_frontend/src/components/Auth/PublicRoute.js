import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
    const { currentUser } = useAuth();

    if (currentUser) {
        return <Navigate to="/chat" replace />;
    }
    return children;
};

export default PublicRoute;
