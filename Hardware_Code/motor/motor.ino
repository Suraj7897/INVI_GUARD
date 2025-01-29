#include <Wire.h>                  // I2C communication for MPU6050
#include <I2Cdev.h>                // MPU6050 communication
#include <MPU6050.h>               // MPU6050 sensor
#include <ESP32Servo.h>                // Servo library for Arduino to control motor rotation

MPU6050 mpu;
Servo motorServo;                  // Servo object to control the motor

const int motorPin = 23;            // Motor control pin (update this pin based on your Arduino board)
int16_t gx, gy, gz;                // Gyroscope readings for X, Y, and Z axes

const float GYRO_THRESHOLD = 7.0;  // Threshold value for X-axis

void setup() {
  Serial.begin(115200);

  // MPU6050 setup
  Wire.begin();                    // Initialize I2C
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("MPU6050 connected successfully.");
  } else {
    Serial.println("MPU6050 connection failed.");
  }

  // Motor setup
  motorServo.attach(motorPin);     // Attach motor to the specified pin
  motorServo.write(0);             // Set initial position of motor to 0 degrees
}

void loop() {
  // Get gyroscope readings for X, Y, and Z axes
  mpu.getRotation(&gx, &gy, &gz);

  // Display gyroscope values for debugging
  Serial.print("Gyroscope (deg/s): X = "); Serial.print(gx);
  Serial.print(" | Y = "); Serial.print(gy);
  Serial.print(" | Z = "); Serial.println(gz);

  // Control motor based on X-axis gyroscope reading
  if (gx < GYRO_THRESHOLD) {
    Serial.println("X-axis below threshold. Rotating motor to 90 degrees.");
    motorServo.write(90);          // Rotate motor to 90 degrees
  } else {
    Serial.println("X-axis above threshold. Returning motor to 0 degrees.");
    motorServo.write(0);           // Return motor to 0 degrees
  }

  delay(100);  // Small delay before the next reading
}
