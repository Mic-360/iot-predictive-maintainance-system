import os
import time
import random
import json
import paho.mqtt.client as mqtt # type: ignore

DEVICE_ID = os.environ.get('DEVICE_ID')
DEVICE_TYPE = os.environ.get('DEVICE_TYPE', '3d_printer')
MQTT_BROKER = os.environ.get('MQTT_BROKER', 'mosquitto')
MQTT_TOPIC = f'iot/device/{DEVICE_ID}'

client = mqtt.Client()

def connect_mqtt():
    max_retries = 5
    retry_delay = 5  # seconds
    for attempt in range(max_retries):
        try:
            client.connect(MQTT_BROKER, 1883, 60)
            print(f"Connected to MQTT broker at {MQTT_BROKER}")
            return True
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Exiting.")
                return False

if not connect_mqtt():
    exit(1)

def generate_3d_printer_data():
    return {
        'nozzle_temperature': random.uniform(180, 250),
        'bed_temperature': random.uniform(50, 110),
        'filament_flow_rate': random.uniform(1, 5),
        'print_speed': random.uniform(30, 100),
        'layer_height': random.uniform(0.1, 0.4),
        'extruder_position': random.uniform(0, 250),
    }

def generate_cnc_machine_data():
    return {
        'spindle_speed': random.uniform(1000, 20000),
        'feed_rate': random.uniform(10, 500),
        'cutting_depth': random.uniform(0.1, 10),
        'tool_wear': random.uniform(0, 100),
        'axis_position_x': random.uniform(0, 500),
        'axis_position_y': random.uniform(0, 500),
        'axis_position_z': random.uniform(0, 200),
    }

while True:
    base_data = {
        'device_id': DEVICE_ID,
        'device_type': DEVICE_TYPE,
        'temperature': random.uniform(20, 80),
        'vibration': random.uniform(0, 10),
        'power_consumption': random.uniform(100, 1000),
        'timestamp': time.time()
    }

    if DEVICE_TYPE == '3d_printer':
        base_data.update(generate_3d_printer_data())
    elif DEVICE_TYPE == 'cnc_machine':
        base_data.update(generate_cnc_machine_data())

    client.publish(MQTT_TOPIC, json.dumps(base_data))
    time.sleep(5)
