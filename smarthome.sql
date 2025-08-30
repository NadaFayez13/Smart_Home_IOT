CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    created_at timestamp DEFAULT now()
);
CREATE TABLE sensors (
    id serial PRIMARY KEY,
    sensor_type text NOT NULL,        
    created_at timestamp DEFAULT now()
);
CREATE TABLE sensor_readings (
    id serial PRIMARY KEY,
    sensor_id int REFERENCES sensors(id) ON DELETE CASCADE,
    value numeric,                   
    status text,                      
    timestamp timestamp DEFAULT now()
);
CREATE TABLE alerts (
    id serial PRIMARY KEY,
    alert_type text NOT NULL,        
    message text NOT NULL,
    sensor_id int REFERENCES sensors(id),
    timestamp timestamp DEFAULT now()
);
CREATE TABLE access_logs (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    action text NOT NULL,           
    success boolean DEFAULT false,   
    timestamp timestamp DEFAULT now()
);

CREATE TABLE mqtt_messages (
    id serial PRIMARY KEY,
    topic text NOT NULL,             
    payload text NOT NULL,           
    timestamp timestamp DEFAULT now()
);





