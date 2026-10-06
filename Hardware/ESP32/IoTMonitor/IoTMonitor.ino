#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include "config.h"

// ================= WIFI =================



// ================= MQTT =================





const char* TOPIC_SENSOR = "iot/sensor/data";
const char* TOPIC_COMMAND = "iot/device/command";
const char* TOPIC_STATUS = "iot/device/status";

WiFiClient espClient;
PubSubClient client(espClient);

// ================= HARDWARE =================

#define DHT_PIN 4
#define DHT_TYPE DHT11

const int LDR_PIN = 34;
const int LED1_PIN = 18;
const int LED2_PIN = 19;

DHT dht(DHT_PIN, DHT_TYPE);

// ================= LDR =================

const int NUM_SAMPLES = 10;

unsigned long lastSensorPublish = 0;
const unsigned long SENSOR_INTERVAL = 2000;

int readLdrAverage() {

  long sum = 0;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    sum += analogRead(LDR_PIN);
    delay(10);
  }

  return sum / NUM_SAMPLES;
}

float adcToLux(int adcVal) {

  adcVal = constrain(adcVal, 0, 4000);

  if (adcVal <= 200) {
    return 200.0;
  }

  if (adcVal <= 650) {
    return 200.0 - (adcVal - 200) * (100.0 / 450.0);
  }

  if (adcVal <= 1900) {
    return 100.0 - (adcVal - 650) * (60.0 / 1250.0);
  }

  if (adcVal <= 3900) {
    return 40.0 - (adcVal - 1900) * (40.0 / 2000.0);
  }

  return 0.0;
}

// ================= WIFI =================

void connectWiFi() {

  Serial.print("Connecting WiFi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");

  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

// ================= MQTT =================

void connectMQTT() {

  while (!client.connected()) {

    Serial.print("Connecting MQTT... ");

    if (client.connect("ESP32", MQTT_USER, MQTT_PASSWORD)) {

      Serial.println("connected!");

      client.subscribe(TOPIC_COMMAND);

    } else {

      Serial.println("failed!");

      delay(2000);
    }
  }
}

// ================= MQTT RECEIVE =================

void mqttCallback(char* topic, byte* payload, unsigned int length) {

  String message = "";

  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println();
  Serial.println("MQTT received:");
  Serial.println(message);

  // ================= PARSE JSON =================

  JsonDocument doc;

  DeserializationError error = deserializeJson(doc, message);

  if (error) {

    Serial.print("JSON error: ");
    Serial.println(error.c_str());

    return;
  }

  // ================= READ COMMAND =================

  int requestId = doc["requestId"] | 0;
  String deviceCode = doc["deviceCode"] | "";
  String action = doc["action"] | "";

  // ================= SELECT LED =================

  int ledPin = -1;

  if (deviceCode == "LED1") {

    ledPin = LED1_PIN;

  } else if (deviceCode == "LED2") {

    ledPin = LED2_PIN;

  } else {

    Serial.println("Unknown device!");

    return;
  }

  // ================= CONTROL LED =================

  if (action == "ON") {

    digitalWrite(ledPin, HIGH);

  } else if (action == "OFF") {

    digitalWrite(ledPin, LOW);

  } else {

    Serial.println("Unknown action!");

    return;
  }

  // ================= READ ACTUAL LED STATUS =================

  String actualStatus;

  if (digitalRead(ledPin) == HIGH) {
    actualStatus = "ON";
  } else {
    actualStatus = "OFF";
  }

  Serial.print(deviceCode);
  Serial.print(" - Requested: ");
  Serial.print(action);

  Serial.print(" - Confirmed: ");
  Serial.println(actualStatus);

  // ================= CREATE STATUS JSON =================

  JsonDocument statusDoc;

  statusDoc["requestId"] = requestId;
  statusDoc["deviceCode"] = deviceCode;
  statusDoc["status"] = actualStatus;

  String statusMessage;

  serializeJson(statusDoc, statusMessage);

  // ================= PUBLISH STATUS =================

  client.publish(
    TOPIC_STATUS,
    statusMessage.c_str()
  );

  Serial.print("Status sent: ");
  Serial.println(statusMessage);
}

// ================= SETUP =================

void setup() {

  Serial.begin(115200);

  // ================= DHT11 =================

  dht.begin();

  // ================= LED =================

  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);

  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);

  // ================= LDR =================

  pinMode(LDR_PIN, INPUT);

  // ================= WIFI =================

  connectWiFi();

  // ================= MQTT =================

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);

  connectMQTT();

  Serial.println();
  Serial.println("==============================");
  Serial.println("       DEMO B READY");
  Serial.println("==============================");
}

// ================= LOOP =================

void loop() {

  // ================= CHECK MQTT =================

  if (!client.connected()) {
    connectMQTT();
  }

  client.loop();

  // ================= SENSOR TIMER =================

  unsigned long currentMillis = millis();

  if (currentMillis - lastSensorPublish >= SENSOR_INTERVAL) {

    lastSensorPublish = currentMillis;

    // ================= READ SENSOR =================

    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    int adcVal = readLdrAverage();
    float lux = adcToLux(adcVal);

    // ================= DHT11 =================

    if (isnan(temp) || isnan(hum)) {

      Serial.println("DHT11: READ ERROR");

    } else {

      Serial.print("Nhiet do: ");
      Serial.print(temp);
      Serial.println(" °C");

      Serial.print("Do am: ");
      Serial.print(hum);
      Serial.println(" %RH");

      // ================= PUBLISH TEMPERATURE =================

      JsonDocument tempDoc;

      tempDoc["sensorCode"] = "DHT11_TEMP";
      tempDoc["value"] = temp;

      String tempData;

      serializeJson(tempDoc, tempData);

      client.publish(
        TOPIC_SENSOR,
        tempData.c_str()
      );

      // ================= PUBLISH HUMIDITY =================

      JsonDocument humDoc;

      humDoc["sensorCode"] = "DHT11_HUM";
      humDoc["value"] = hum;

      String humData;

      serializeJson(humDoc, humData);

      client.publish(
        TOPIC_SENSOR,
        humData.c_str()
      );
    }

    // ================= LDR =================

    Serial.print("LDR ADC: ");
    Serial.println(adcVal);

    Serial.print("Light: ");
    Serial.print(lux);
    Serial.println(" lux");

    // ================= PUBLISH LIGHT =================

    JsonDocument lightDoc;

    lightDoc["sensorCode"] = "LDR_LIGHT";
    lightDoc["value"] = lux;

    String lightData;

    serializeJson(lightDoc, lightData);

    client.publish(
      TOPIC_SENSOR,
      lightData.c_str()
    );

    Serial.println("-------------------------------");
  }
}