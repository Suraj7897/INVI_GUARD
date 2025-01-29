#include <WiFi.h>
#include <HTTPClient.h>
#include <PulseSensorPlayground.h>   // Includes the PulseSensorPlayground Library.
#include "Wire.h"                    // I2C communication for MPU6050
#include "I2Cdev.h"                  // MPU6050 communication
#include "MPU6050.h"                 // MPU6050 sensor

// Constants for sensors and WiFi
const char* ssid = "REALME";
const char* password = "12345678";
const char* serverUrl = "http://192.168.100.53:5000/api/data/sensorsave"; // Replace with your PC's IP and port

const int PulseWire = 13;            // Pulse Sensor connected to GPIO 34 (analog input)-
const int LED = 2;                   // On-board LED on ESP32 (GPIO 2)
int Threshold = 550;                 // Pulse sensor threshold

// Create instances for sensors
PulseSensorPlayground pulseSensor;
MPU6050 mpu;

// Sensitivity and conversion factors for MPU6050
int16_t ax, ay, az, gx, gy, gz;
const float ACCEL_SCALE_FACTOR = 16384.0;
const float GRAVITY_MS2 = 9.81;

void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Pulse Sensor setup
  pulseSensor.analogInput(PulseWire);   
  pulseSensor.blinkOnPulse(LED);
  pulseSensor.setThreshold(Threshold);
  if (pulseSensor.begin()) {
    Serial.println("Pulse Sensor initialized.");
  }

  // MPU6050 setup (accelerometer/gyroscope)
  Wire.begin(21, 22);  // I2C pins: SDA (21), SCL (22)
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("MPU6050 connected successfully.");
  } else {
    Serial.println("MPU6050 connection failed.");
  }
}

void loop() {
  // ---- Pulse Sensor BPM Calculation ----
  int myBPM = 0;
  if (pulseSensor.sawStartOfBeat()) {
    myBPM = pulseSensor.getBeatsPerMinute();
    Serial.println("♥  A HeartBeat Happened !");
    Serial.print("BPM: ");
    Serial.println(myBPM);
  }

  // ---- MPU6050 Accelerometer Reading ----
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  float ax_ms2 = ((float)ax / ACCEL_SCALE_FACTOR) * GRAVITY_MS2;
  float ay_ms2 = ((float)ay / ACCEL_SCALE_FACTOR) * GRAVITY_MS2;
  float az_ms2 = ((float)az / ACCEL_SCALE_FACTOR) * GRAVITY_MS2;

  Serial.print("Accelerometer (m/s²): X = "); Serial.print(ax_ms2, 4);
  Serial.print(" | Y = "); Serial.print(ay_ms2, 4);
  Serial.print(" | Z = "); Serial.println(az_ms2, 4);

  // ---- Send Data via HTTP ----
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    String payload = "{\"bpm\": " + String(myBPM) +
                     ", \"ax\": " + String(ax_ms2, 4) +
                     ", \"ay\": " + String(ay_ms2, 4) +
                     ", \"az\": " + String(az_ms2, 4) + "}";
                     
    // Send POST request
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error on sending POST: " + String(httpResponseCode));
    }
    
    http.end(); // Close connection
  }

  delay(1200);  // Delay for 1.2 seconds before next readings
}



