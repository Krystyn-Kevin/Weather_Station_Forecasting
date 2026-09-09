#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <DHT.h>
#include <ThingSpeak.h>
#include <WiFi.h>
#include <WebServer.h>
#include <time.h>

Adafruit_BMP280 bmp; //sensor obj
const unsigned long interval = 300000; //5min once
unsigned long bmp280_time_previous = 0;

#define DHTPIN 15
DHT dht(DHTPIN,DHT22);//sensor obj

const char* ssid = "";
const char* password = "";

WiFiClient client; //wifi obj
void setup() {
  Serial.begin(115200);

  //wifi setup 
  WiFi.begin(ssid,password);
  while (WiFi.status() != WL_CONNECTED){
    delay(1000);
    Serial.print(".");
  }
  Serial.println("IP: ");
  Serial.println(WiFi.localIP());
  
  //thingspeak setup
  ThingSpeak.begin(client);

  // 0x76 default I2C for BMP280 modules
  if (!bmp.begin(0x76)) {
    Serial.println("Sensor missing! Check your wiring.");
    while (1);
  }
  
  dht.begin();

  }

void loop() {
  //server.handleClient();
  if (millis() - bmp280_time_previous >= interval){
    bmp280_time_previous = millis ();
    float curtemp = bmp.readTemperature();
    float curpre = (bmp.readPressure()/100.0F);
    float curhum = dht.readHumidity();
    Serial.print("Temp: ");
    Serial.print(curtemp);
    Serial.println("°C");
    Serial.print("Pressure: ");
    Serial.print(curpre);
    Serial.println(" hpa");
    Serial.print("Humidity: ");
    Serial.print(curhum);
    Serial.println(" %RH");
    ThingSpeak.setField(1,curtemp);
    ThingSpeak.setField(2,curpre);
    ThingSpeak.setField(3,curhum);

    int httpcode = ThingSpeak.writeFields(,""); //channel id, api (write)

    if (httpcode == 200){
      Serial.println("Write successful");
    }
    else{
      Serial.println("Error in writing " + String(httpcode));
    }
   Serial.println("---");

  }}
  
