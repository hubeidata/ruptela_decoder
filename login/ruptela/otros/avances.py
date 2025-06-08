import socket
import struct

# Algoritmo CRC-CCITT Kermit (manual)
def compute_crc(data):
    crc = 0
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 1:
                crc = (crc >> 1) ^ 0x8408  # Polinomio Kermit
            else:
                crc >>= 1
            crc &= 0xFFFF
    return bytes([crc & 0xFF, crc >> 8])  # Little-endian

def build_server_response(command_id, ack=1):
    # Estructura de respuesta genérica (sin IMEI)
    payload = bytes([command_id, ack])  # Command ID + ACK
    packet_length = len(payload)  # No incluye CRC ni el campo "Packet length"
    header = struct.pack(">H", packet_length)
    crc_data = header + payload
    crc = compute_crc(crc_data)
    return header + payload + crc

def handle_client(client_socket):
    try:
        # Leer el paquete completo
        header = client_socket.recv(2)
        if len(header) < 2:
            return

        packet_length = struct.unpack(">H", header)[0]
        total_length = packet_length + 4  # +2 (header) +2 (CRC)
        data = bytearray(header)
        
        while len(data) < total_length:
            chunk = client_socket.recv(total_length - len(data))
            if not chunk:
                break
            data.extend(chunk)

        if len(data) != total_length:
            print("Paquete incompleto")
            return

        # Validar CRC
        received_crc = bytes(data[-2:])
        calculated_crc = compute_crc(bytes(data[:-2]))
        
        if calculated_crc != received_crc:
            print(f"CRC inválido. Esperado: {calculated_crc.hex()}, Recibido: {received_crc.hex()}")
            return

        # Extraer campos del dispositivo
        command_id = data[10]  # Command ID (posición 10)
        imei = data[2:10].hex()

        # Determinar respuesta según el Command ID
        server_command_id = None
        if command_id == 0x01:   # Comando 1 (Records)
            server_command_id = 0x64  # Respuesta 100
        elif command_id == 0x03:  # Comando 3 (Device Version)
            server_command_id = 0x67  # Respuesta 103
        elif command_id == 0x05:  # Comando 5 (Smart Card Data)
            server_command_id = 0x6B  # Respuesta 107
        # ... Añadir más comandos según la tabla 3.2.25

        # Construir y enviar respuesta
        if server_command_id is not None:
            response = build_server_response(server_command_id, ack=1)
            client_socket.send(response)
            print(f"Respuesta enviada: {response.hex()}")

        # Mostrar datos recibidos
        print(f"IMEI: {imei}")
        print(f"Command ID: {command_id} (0x{command_id:02x})")
        print(f"Payload: {bytes(data[11:-2]).hex()}")

    except Exception as e:
        print(f"Error: {e}")

def start_server(port=8989):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(("0.0.0.0", port))
    server.listen(5)
    print(f"Escuchando en puerto {port}...")

    while True:
        client, addr = server.accept()
        print(f"Conexión desde: {addr[0]}:{addr[1]}")
        handle_client(client)
        client.close()

if __name__ == "__main__":
    start_server()