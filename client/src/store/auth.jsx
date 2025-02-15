import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sensorData, setSensorData] = useState([]);
  const [sensorLoading, setSensorLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to store the token in local storage
  const storeTokenInLS = (serverToken) => {
    setToken(serverToken);
    localStorage.setItem("token", serverToken);
  };

  // Function to log out the user
  const LogoutUser = () => {
    console.log("Logging out..."); // For debugging
    setToken(""); // Clear token from state
    localStorage.removeItem("token"); // Remove token from local storage
    setUser(null); // Clear user data
    setSensorData([]); // Clear sensor data on logout
  };

  // Fetch user data when the token is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/auth/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.msg); // Assuming data.msg contains user details
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  // Function to fetch sensor data
  const fetchSensorData = async () => {
    if (!token) {
      setError("User not authenticated");
      return;
    }

    setSensorLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/data/sensor", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sensor data: ${response.statusText}`);
      }

      const newData = await response.json();
      console.log("Fetched sensor data:", newData); // Log fetched data

      // Update sensor data while keeping the latest 50 data points
      setSensorData((prevData) => {
        const updatedData = [...prevData, ...newData].slice(-50);
        return updatedData;
      });
    } catch (err) {
      console.error("Error fetching sensor data:", err);
      setError(err.message);
      setSensorData([]); // Clear data on error
    } finally {
      setSensorLoading(false);
    }
  };

  // useEffect to fetch sensor data every second when token is available
  useEffect(() => {
    if (token) {
      fetchSensorData(); // Initial fetch
      const interval = setInterval(() => {
        fetchSensorData(); // Fetch data every second
      }, 1000);

      return () => clearInterval(interval); // Clear interval on component unmount
    }
  }, [token]); // Dependency on token

  const isLoggedIn = !!token; // Determine if the user is logged in

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loading,
        sensorData,
        sensorLoading,
        error,
        storeTokenInLS,
        LogoutUser,
        fetchSensorData, // Expose fetch function if needed
      }}
    >
      {loading ? <p>Loading...</p> : children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the Auth context
export const useAuth = () => {
  const authContextValue = useContext(AuthContext);
  if (!authContextValue) {
    throw new Error("useAuth used outside of the Provider");
  }
  return authContextValue;
};
