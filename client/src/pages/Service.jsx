require("dotenv").config();
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { useAuth } from "../store/auth";
import { GoogleMap, Marker, useJsApiLoader, Circle, OverlayView } from "@react-google-maps/api";


Chart.register(...registerables);
const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "450px",
};

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // Default to India if no location

const MAX_DATA_POINTS = 50; // Maximum data points to keep
const INITIAL_BATTERY = 100; // Initial battery percentage

export const Service = () => {
  const { sensorData, loading } = useAuth(); // Access authentication context
  const [displayData, setDisplayData] = useState([]); // State to hold the data for display
  const [dataIndex, setDataIndex] = useState(0); // Index to keep track of the next data point to display
  const [activeTab, setActiveTab] = useState("bpm"); // State to keep track of the active tab
  const [battery, setBattery] = useState(() => {
    // Initialize battery from localStorage, default to 100 if not found
    const storedBattery = localStorage.getItem("battery");
    return storedBattery ? Number(storedBattery) : INITIAL_BATTERY;
  });
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [map, setMap] = useState(null);
  const [lastHelmetState, setLastHelmetState] = useState(0);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.googlemapapi, // Replace with your Google Maps API key
  });

  // Add styles for the pulsing dot
  const dotStyles = `
    @keyframes pulsate {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(4); opacity: 0; }
    }

    .location-dot {
      position: relative;
      width: 16px;
      height: 16px;
      background-color: #4285F4;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 0 3px rgba(0, 0, 0, 0.4);
    }

    .location-dot::after {
      content: '';
      position: absolute;
      top: -3px;
      left: -3px;
      width: 16px;
      height: 16px;
      background-color: #4285F4;
      border-radius: 50%;
      opacity: 0.4;
      animation: pulsate 2s ease-in-out infinite;
    }
  `;

  // Track live location
  useEffect(() => {
    let watchId;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setAccuracy(position.coords.accuracy);
          
          // Auto-center map on first location fix
          if (map && !userLocation) {
            map.panTo(newLocation);
          }
        },
        (error) => {
          console.error("Location error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [map]);

  // Custom location marker component
  const LocationMarker = () => {
    if (!userLocation) return null;

    return (
      <>
        {/* Accuracy circle */}
        <Circle
          center={userLocation}
          radius={accuracy}
          options={{
            fillColor: "#4285F4",
            fillOpacity: 0.1,
            strokeColor: "#4285F4",
            strokeOpacity: 0.3,
            strokeWeight: 1,
          }}
        />

        {/* Pulsing dot */}
        <OverlayView
          position={userLocation}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div
            style={{
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="location-dot" />
          </div>
        </OverlayView>
      </>
    );
  };

  // Battery management useEffect
  useEffect(() => {
    // Save battery to localStorage whenever it changes
    localStorage.setItem("battery", battery.toString());

    // Reduce battery by 1% every 5 minutes
    const batteryInterval = setInterval(() => {
      setBattery((prevBattery) => {
        const newBattery = Math.max(prevBattery - 1, 60); // Don't go below 87
        localStorage.setItem("battery", newBattery.toString());
        return newBattery;
      });
    }, 30000); // 5 minutes = 300000 ms

    return () => clearInterval(batteryInterval);
  }, [battery]); // Add battery as dependency

  // Second useEffect for helmet state battery reduction
  useEffect(() => {
    const helmetBatteryReduction = setInterval(() => {
      if (displayData.length > 0) {
        const lastSensor = displayData[displayData.length - 1];
        if (lastSensor.helmet) {
          setBattery((prevBattery) => {
            const randomReduction = Math.floor(Math.random() * 2) + 1;
            const newBattery = Math.max(prevBattery - randomReduction, 87);
            localStorage.setItem("battery", newBattery.toString());
            return newBattery;
          });
        }
      }
    }, 5000);

    return () => clearInterval(helmetBatteryReduction);
  }, [displayData]);

  // Monitor helmet value in graph data
  useEffect(() => {
    const fetchDataInterval = setInterval(() => {
      if (dataIndex < sensorData.length) {
        const newDataPoint = sensorData[dataIndex];
  
        // Log the helmet value to ensure it's correct
        console.log("Helmet value:", newDataPoint.helmet); 
  
        // Check if helmet value is 1
        if (newDataPoint.helmet === true) {
          console.log('Helmet value is 1 - sending SMS');
          
          // Send SMS request
          fetch('http://localhost:5000/api/send-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'ALERT: Helmet is deployed friend under danger.',
              to: '+918147835117'  // Your number
            })
          })
          .then(response => {
            console.log('SMS API Response:', response);
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            console.log('SMS Sent Successfully:', data);
            // Reduce battery by 2% only after successful SMS
            setBattery(prevBattery => {
              const newBattery = Math.max(prevBattery - 2, 60);
              localStorage.setItem("battery", newBattery.toString());
              return newBattery;
            });
          })
          .catch(error => {
            console.error('Error sending SMS:', error);
          });
        }
  
        // Update display data
        setDisplayData(prevData => {
          const updatedData = [...prevData, newDataPoint];
          return updatedData.slice(-MAX_DATA_POINTS);
        });
  
        setDataIndex(prevIndex => prevIndex + 1);
      } else {
        setDataIndex(0);
      }
    }, 1900);
  
    return () => clearInterval(fetchDataInterval);
  }, [sensorData, dataIndex]);
  
  useEffect(() => {
    if (loading) return;
    setDisplayData(sensorData.slice(0, MAX_DATA_POINTS));
  }, [sensorData, loading]);

  if (loading) {
    return <p>Loading sensor data...</p>;
  }

  // Prepare chart data based on the active tab
  const getChartData = (sensorType) => {
    const dataForTab = displayData.map((sensor) => sensor[sensorType]);
    return {
      labels: displayData.map((_, index) => index + 1),
      datasets: [
        {
          label: `${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)} Data`,
          data: dataForTab,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
      
    };
  };

  const getAllSensorGraphs = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "40px", color: "#333" }}>Sensor Data</h2>
  
        <div style={{ display: "flex", flexDirection: "column", width: "80%", maxWidth: "1000px" }}>
          
          {/* BPM Data */}
          <div style={sensorCardStyle}>
            <h3 style={sensorTitleStyle}>BPM Data</h3>
            <div style={graphContainerStyle}>
              <Line data={getChartData("bpm")} />
            </div>
          </div>
  
          {/* Ax Data */}
          <div style={sensorCardStyle}>
            <h3 style={sensorTitleStyle}>Ax Data</h3>
            <div style={graphContainerStyle}>
              <Line data={getChartData("ax")} />
            </div>
          </div>
  
          {/* Ay Data */}
          <div style={sensorCardStyle}>
            <h3 style={sensorTitleStyle}>Ay Data</h3>
            <div style={graphContainerStyle}>
              <Line data={getChartData("ay")} />
            </div>
          </div>
  
          {/* Az Data */}
          <div style={sensorCardStyle}>
            <h3 style={sensorTitleStyle}>Az Data</h3>
            <div style={graphContainerStyle}>
              <Line data={getChartData("az")} />
            </div>
          </div>
  
          {/* Temperature Data */}
          <div style={sensorCardStyle}>
            <h3 style={sensorTitleStyle}>Temperature Data</h3>
            <div style={graphContainerStyle}>
              <Line data={getChartData("temp")} />
            </div>
          </div>
  
          {/* Helmet State */}
          <div style={sensorCardStyle}>
            <h3 style={sensorTitleStyle}>Helmet State</h3>
            <div style={graphContainerStyle}>
              <Line data={getChartData("helmet")} />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Styles for card container
  const sensorCardStyle = {
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    marginBottom: "30px",
    padding: "20px",
  };
  
  // Styles for each sensor title
  const sensorTitleStyle = {
    textAlign: "center",
    marginBottom: "15px",
    color: "#2c3e50",
    fontSize: "20px",
    fontWeight: "bold",
  };
  
  // Styles for graph container
  const graphContainerStyle = {
    width: "100%",
    height: "400px",
    margin: "0 auto",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  };
  

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sensor Data</h1>

      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        {/* Battery Display */}
        <div style={{ display: "inline-block", position: "relative" }}>
          <div
            style={{
              width: "120px",
              height: "50px",
              border: "2px solid black",
              borderRadius: "5px",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#ccc",
            }}
          >
            <div
              style={{
                width: `${battery}%`,
                height: "100%",
                backgroundColor: battery > 20 ? "green" : "red",
                transition: "width 0.5s ease-in-out",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontWeight: "bold",
                fontSize: "16px",
                color: battery > 20 ? "black" : "white",
              }}
            >
              {battery}%
            </div>
          </div>
          <div
            style={{
              width: "10px",
              height: "20px",
              backgroundColor: "black",
              position: "absolute",
              top: "15px",
              right: "-12px",
              borderRadius: "2px",
            }}
          />
        </div>
        {battery === 0 && <p style={{ color: "red" }}>Battery depleted!</p>}
      </div>

      <div className="tabs" style={{ marginBottom: "20px" }}>
        {/* Sensor Data Tabs */}
        <button
          onClick={() => setActiveTab("bpm")}
          className={activeTab === "bpm" ? "active" : ""}
        >
          BPM
        </button>
        <button
          onClick={() => setActiveTab("ax")}
          className={activeTab === "ax" ? "active" : ""}
        >
          Ax
        </button>
        <button
          onClick={() => setActiveTab("ay")}
          className={activeTab === "ay" ? "active" : ""}
        >
          Ay
        </button>
        <button
          onClick={() => setActiveTab("az")}
          className={activeTab === "az" ? "active" : ""}
        >
          Az
        </button>
        <button
          onClick={() => setActiveTab("temp")}
          className={activeTab === "temp" ? "active" : ""}
        >
          Temp
        </button>
        <button
          onClick={() => setActiveTab("helmet")}
          className={activeTab === "helmet" ? "active" : ""}
        >
          Helmet
        </button>
        <button
          onClick={() => setActiveTab("location")}
          className={activeTab === "location" ? "active" : ""}
        >
          Location
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={activeTab === "all" ? "active" : ""}
        >
          All Sensors
        </button>
        <button
          onClick={() => setActiveTab("chatbot")}
          className={activeTab === "chatbot" ? "active" : ""}
        >
          Chatbot
        </button>
      </div>

      {/* Render content based on active tab */}
      {activeTab === "location" ? (
        // Only render map for location tab
        <div>
          <style>{dotStyles}</style>
          <h2>Live Location</h2>

          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '500px',
              borderRadius: '8px'
            }}
            center={userLocation || DEFAULT_CENTER}
            zoom={17}
            onLoad={setMap}
            options={{
              zoomControl: true,
              mapTypeControl: true,
              scaleControl: true,
              streetViewControl: true,
              rotateControl: true,
              fullscreenControl: true,
              mapTypeId: 'roadmap',
            }}
          >
            <LocationMarker />
          </GoogleMap>

          {/* Location tracking button */}
          {userLocation && (
            <button
              onClick={() => {
                if (map) {
                  map.panTo(userLocation);
                  map.setZoom(17);
                }
              }}
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '20px',
                padding: '12px',
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            >
              <span role="img" aria-label="center location">
                📍
              </span>
            </button>
          )}
        </div>
      ) : activeTab === "chatbot" ? (
        // Render chatbot
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h2>Chatbot</h2>
          <iframe
            title="Dialogflow Chatbot"
            width="350"
            height="500"
            src="https://console.dialogflow.com/api-client/demo/embedded/afa001c7-ae84-47dd-9295-7457f51be2d1"
          ></iframe>
        </div>
      ) : activeTab === "all" ? (
        // Render all sensor graphs
        getAllSensorGraphs()
      ) : (
        // Render individual sensor graph
        <Line data={getChartData(activeTab)} />
      )}
    </div>
  );
};
