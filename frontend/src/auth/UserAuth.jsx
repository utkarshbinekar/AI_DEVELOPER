import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';

const UserAuth = ({ children }) => {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      axios.get('/users/verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((res) => {
        setUser(res.data.user);
        setLoading(false);
      }).catch(() => {
        navigate('/login');
      });
    }
  }, [token, navigate, setUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default UserAuth;