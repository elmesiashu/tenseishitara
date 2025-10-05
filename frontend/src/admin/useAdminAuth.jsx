import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function useAdminAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/me`, { withCredentials: true });
        const currentUser = res.data?.user;

        if (!currentUser || !currentUser.isAdmin) {
          navigate("/login");
          return;
        }

        setUser(currentUser);
      } catch (err) {
        console.error("Admin auth failed:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [navigate, API]);

  return { user, loading };
}
