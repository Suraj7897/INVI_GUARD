#include <Wire.h>
#include "I2Cdev.h"
#include "MPU6050.h"

const int MPU = 0x68;  // MPU6050 I2C address
const float GRAVITY_MS2 = 9.81;
const int I2C_SDA = 21;  // ESP32 SDA pin
const int I2C_SCL = 22;  // ESP32 SCL pin

MPU6050 mpu;

// Calibration offsets
float accOffsetX = 0;
float accOffsetY = 0;
float accOffsetZ = 0;

// Variables for sensor readings
float AccX, AccY, AccZ;
float AccX_ms2, AccY_ms2, AccZ_ms2;

void setup() {
  Serial.begin(115200);
  
  // Initialize I2C communication for ESP32
  Wire.begin(I2C_SDA, I2C_SCL);
  mpu.initialize();
  
  if (mpu.testConnection()) {
    Serial.println("MPU6050 connected successfully.");
  } else {
    Serial.println("MPU6050 connection failed.");
  }

  // Perform calibration when the MPU6050 is stationary
  calibrateMPU6050();
}

void loop() {
  // Read accelerometer values
  int16_t rawAccX, rawAccY, rawAccZ;
  mpu.getAcceleration(&rawAccX, &rawAccY, &rawAccZ);

  // Convert raw values to g-force and then to m/s², applying calibration offsets
  AccX_ms2 = ((float)rawAccX / 16384.0) * GRAVITY_MS2 - accOffsetX;
  AccY_ms2 = ((float)rawAccY / 16384.0) * GRAVITY_MS2 - accOffsetY;
  AccZ_ms2 = ((float)rawAccZ / 16384.0) * GRAVITY_MS2 - accOffsetZ;

  // Print calibrated accelerometer data in m/s²
  Serial.print("Calibrated Accelerometer (m/s²): X = "); Serial.print(AccX_ms2, 4);
  Serial.print(" | Y = "); Serial.print(AccY_ms2, 4);
  Serial.print(" | Z = "); Serial.println(AccZ_ms2, 4);

  delay(1000);  // Delay for readability
}

void calibrateMPU6050() {
  int numSamples = 100;
  long sumAccX = 0, sumAccY = 0, sumAccZ = 0;

  Serial.println("Calibrating MPU6050. Please keep it stationary...");

  // Read multiple samples to calculate average offsets
  for (int i = 0; i < numSamples; i++) {
    int16_t rawAccX, rawAccY, rawAccZ;
    mpu.getAcceleration(&rawAccX, &rawAccY, &rawAccZ);

    sumAccX += rawAccX;
    sumAccY += rawAccY;
    sumAccZ += rawAccZ;

    delay(20);  // Small delay between samples
  }

  // Calculate average offset values in terms of g-force, then convert to m/s²
  accOffsetX = ((float)sumAccX / numSamples / 16384.0) * GRAVITY_MS2;
  accOffsetY = ((float)sumAccY / numSamples / 16384.0) * GRAVITY_MS2;
  accOffsetZ = ((float)sumAccZ / numSamples / 16384.0) * GRAVITY_MS2 - GRAVITY_MS2;

  Serial.println("Calibration complete.");
  Serial.print("Offsets - X: "); Serial.print(accOffsetX);
  Serial.print(" | Y: "); Serial.print(accOffsetY);
  Serial.print(" | Z: "); Serial.println(accOffsetZ);
}

#include <ESP32Servo.h>

Servo myservo;  // create servo object to control a servo

int pos = 0;    // variable to store the servo position

void setup() {
  myservo.attach(23);  // attaches the servo on pin 9 to the servo object (you can use any PWM-capable pin)
}

void loop() {
  for (pos = 0; pos <= 180; pos += 1) { // goes from 0 degrees to 180 degrees
    myservo.write(pos);              // tell servo to go to position in variable 'pos'
    delay(15);                       // waits 15ms for the servo to reach the position
  }
  for (pos = 180; pos >= 0; pos -= 1) { // goes from 180 degrees to 0 degrees
    myservo.write(pos);              // tell servo to go to position in variable 'pos'
    delay(15);                       // waits 15ms for the servo to reach the position
  }
}



