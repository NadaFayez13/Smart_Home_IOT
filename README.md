# Smart_Home_IOT


## **IoT Hardware**
The hardware side is the core of the smart home system.

- Various sensors collect environmental data: **temperature, humidity, motion, and gas**.  
- Output modules like **LEDs, buzzers, and servo motors** enable alerts and control.  
- The **ESP32** acts as the central hub, processing inputs and sending commands. Results are displayed on an **LCD** or sent to the app.

---

## **MQTT & HiveMQ**
**MQTT** is a lightweight protocol for efficient IoT communication.

- **ESP32** publishes sensor data to HiveMQ **topics**.  
- Applications and databases subscribe to these topics for **real-time updates**.  
- This ensures **instant visibility** of system changes for users.

---

## **Database – Supabase**
The database is the backbone of the system.

- We used **Supabase** (**cloud PostgreSQL**) for reliable, flexible storage.  
- Structured tables maintain **relationships** and provide a **real-time API**.  
- Data logging allows **event tracking, insights generation**, and consistent access across all components.

---

## **Web Application**
The web app is the central platform combining **IoT** and **AI technologies**.

- Built with **React.js** and **HTML5** for the frontend, **Python Flask** for the backend, and **RESTful APIs**.  
- Real-time connection to IoT devices via **MQTT**.  
- Features include **dashboard, notifications, data reports, analysis, remote control**, and a **virtual assistant chatbot**.  
- Designed for **flexibility, scalability**, and seamless **user experience**.

---

## **Docker**
**Docker** enables running each service in isolated **containers**.

- Services: **ESP32 Server, Flask API, Web UI, Supabase**.  
- **Isolation**: Each service runs independently, avoiding conflicts.  
- **Portability**: Project can run on any device or server.  
- **Reproducibility**: Everyone sees the same results without configuration issues.  
- Use **`docker-compose`** to launch all services with a single command.
