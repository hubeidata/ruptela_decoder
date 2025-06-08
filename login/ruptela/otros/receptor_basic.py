import socket
import crcmod

# Configurar CRC16-CCITT (polinomio 0x1021, init 0xFFFF)
crc16 = crcmod.mkCrcFun(0x11021, initCrc=0xFFFF, rev=False, xorOut=0x0000)

def calculate_crc(data):
    return crc16(data).to_bytes(2, byteorder='big')

def main():
    host = '0.0.0.0'
    port = 8989

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(1)
    print(f"Escuchando en {host}:{port}")

    try:
        while True:
            client_conn, client_addr = server_socket.accept()
            print(f"Conexión aceptada de {client_addr}")
            
            try:
                while True:
                    data = client_conn.recv(1024)
                    if not data:
                        print(f"{client_addr} cerró la conexión.")
                        break
                    print(f"Datos recibidos ({len(data)} bytes): {data.hex().upper()}")
                    
                    # Construir respuesta
                    response = bytes.fromhex("0002")  # Packet length
                    response += bytes.fromhex("64")    # Command (100)
                    response += bytes.fromhex("01")    # ACK
                    response += bytes.fromhex("13BC")    # CRC16
                    
                    # Calcular CRC y construir respuesta completa
                    #crc = calculate_crc(response_part)
                    #response = response_part + crc
                    
                    print(f"Enviando ACK: {response.hex().upper()}")
                    client_conn.sendall(response)
            except Exception as e:
                print(f"Error con {client_addr}: {str(e)}")
            finally:
                client_conn.close()
                print(f"Conexión con {client_addr} cerrada")
                
    except KeyboardInterrupt:
        print("\nServidor detenido")
    finally:
        server_socket.close()

if __name__ == "__main__":
    main()