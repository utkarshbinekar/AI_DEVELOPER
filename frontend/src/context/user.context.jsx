import React, { createContext, useState, useContext,useEffect } from 'react';

// Create a context with default value
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({});

  
  

  return (
    <UserContext.Provider value={{ user, setUser }}>
       
      {children}
      
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
