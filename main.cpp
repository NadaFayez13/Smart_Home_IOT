#include <WiFi.h>
#include <PubSubClient.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <ESP32Servo.h>

// ====== WiFi credentials ======
const char* ssid = "Wokwi-GUEST";   // عدلها للـ WiFi بتاعك
const char* password = "";

// ====== MQTT Broker ======
const char* mqtt_server = "broker.hivemq.com";  
const char* topic_temp = "omnia/home/temp";
const char* topic_hum = "omnia/home/hum";
const char* topic_gas = "omnia/home/gas";
const char* topic_current = "omnia/home/current";
const char* topic_ldr = "omnia/home/ldr";
const char* topic_motion = "omnia/home/motion";

WiFiClient espClient;
PubSubClient client(espClient);

// ====== LCD ======
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ====== DHT Sensor ======
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ====== PIR Sensor ======
#define PIR_PIN 15
#define LED_YELLOW 19

// ====== Gas Sensor ======
#define GAS_PIN 34
#define LED_RED 18

// ====== Current Sensor ======
#define CURRENT_PIN 35
#define LED_BLUE 23

// ====== Buzzer ======
#define BUZZER_PIN 2 

// ====== LDR + Garden LEDs ======
#define LDR_PIN 32
#define GARDEN_LED1 25
#define GARDEN_LED2 26

// ====== Servo ======
#define SERVO_PIN 13
Servo myservo;

// ================= Thresholds =================
int gasThreshold = 450;    
int currentThreshold = 3000; 
int ldrThreshold = 500;  

// ====== LCD Screen Switching ======
unsigned long lastSwitch = 0;
int screenIndex = 0; // 0: Temp/Hum, 1: Gas/Current, 2: LDR/Garden

// ====== WiFi connect ======
void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

// ====== MQTT Reconnect ======
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32ClientOmnia")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  lcd.init();
  lcd.backlight();
  dht.begin();

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  pinMode(GARDEN_LED1, OUTPUT);
  pinMode(GARDEN_LED2, OUTPUT);

  myservo.attach(SERVO_PIN);
  myservo.write(0); // البداية على 0 درجة

  setup_wifi();
  client.setServer(mqtt_server, 1883);

  lcd.setCursor(0,0);
  lcd.print("Welcome Home");
  delay(2000);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // ---------- PIR ----------
  if (digitalRead(PIR_PIN) == HIGH) {
    lcd.clear();
    lcd.print("Motion Detected!");
    digitalWrite(LED_YELLOW, HIGH);
    tone(BUZZER_PIN, 2000, 200);
    myservo.write(90);

    client.publish(topic_motion, "Motion Detected");

    delay(3000);
  } else {
    digitalWrite(LED_YELLOW, LOW);
    myservo.write(0);
    client.publish(topic_motion, "No Motion");
  }

  // ---------- Gas ----------
  int gasValue = analogRead(GAS_PIN);
  bool gasAlert = false;
  if (gasValue > gasThreshold) {
    gasAlert = true;
    digitalWrite(LED_RED, HIGH);
    tone(BUZZER_PIN, 1500, 500);
  } else {
    digitalWrite(LED_RED, LOW);
  }
  client.publish(topic_gas, String(gasValue).c_str());

  // --- Current Sensor ---
  int currentValue = analogRead(CURRENT_PIN);
  bool currentAlert = false;
  if (currentValue > currentThreshold) {
    currentAlert = true;
    digitalWrite(LED_BLUE, HIGH);
  } else {
    digitalWrite(LED_BLUE, LOW);
  }
  client.publish(topic_current, String(currentValue).c_str());

  // ====== DHT11 Temp & Humidity ======
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  if (!isnan(temp)) client.publish(topic_temp, String(temp).c_str());
  if (!isnan(hum)) client.publish(topic_hum, String(hum).c_str());

  // ====== LDR & Garden LEDs ======
  int ldrValue = analogRead(LDR_PIN);
  if (ldrValue < ldrThreshold) {
    digitalWrite(GARDEN_LED1, HIGH);
    digitalWrite(GARDEN_LED2, HIGH);
  } else {
    digitalWrite(GARDEN_LED1, LOW);
    digitalWrite(GARDEN_LED2, LOW);
  }
  client.publish(topic_ldr, String(ldrValue).c_str());

  // ====== Priority Alerts ======
  if (gasAlert) {
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("!!! GAS ALERT !!!");
    lcd.setCursor(0,1);
    lcd.print("Value: "); lcd.print(gasValue);
    delay(2000);
    return; 
  }

  if (currentAlert) {
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("!!! CURRENT !!!");
    lcd.setCursor(0,1);
    lcd.print("Value: "); lcd.print(currentValue);
    delay(2000);
    return;
  }

  // ====== LCD Normal Switching every 2 sec ======
  if (millis() - lastSwitch > 2000) {
    lastSwitch = millis();
    screenIndex = (screenIndex + 1) % 3;
    lcd.clear();

    if (screenIndex == 0 && !isnan(temp) && !isnan(hum)) {
      lcd.setCursor(0,0);
      lcd.print("T:"); lcd.print(temp,1); lcd.print("C");
      lcd.setCursor(0,1);
      lcd.print("H:"); lcd.print(hum,1); lcd.print("%");
    } 
    else if (screenIndex == 1) {
      lcd.setCursor(0,0);
      lcd.print("Gas:"); lcd.print(gasValue);
      lcd.setCursor(0,1);
      lcd.print("Current:"); lcd.print(currentValue);
    } 
    else if (screenIndex == 2) {
      lcd.setCursor(0,0);
      lcd.print("LDR:"); lcd.print(ldrValue);
      lcd.setCursor(0,1);
      if (ldrValue < ldrThreshold) lcd.print("Garden: ON ");
      else lcd.print("Garden: OFF");
    }
  }
}