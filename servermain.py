import socket
import threading

HEADER_LEN=10
IP=socket.gethostbyname(socket.gethostname())
PORT=0
lastgeneratedID=0000

clients_info={}
socket_id_dict={}

# Recieve Message Function
def message_receive(sender_socket):
    message_header = sender_socket.recv(HEADER_LEN)

    if not len(message_header):
        return False 
        
    message_len = int(message_header.decode('utf-8'))
    message = sender_socket.recv(message_len).decode('utf-8')
    return message
    
# Format Message
def msg(message):
    msglen=len(str(message))
    x=HEADER_LEN-len(str(msglen))
    return (str(msglen)+(x*" ")+str(message)).encode("utf-8")

def acceptconnections():
    global lastgeneratedID
    while True:
        conn, addr = server_socket.accept()
        if conn:
            print(f"Connected to {addr}")

            # Send Generated ID
            lastgeneratedID+=1
            generatedID="{:04d}".format(lastgeneratedID)
            socket_id_dict[conn]=generatedID
            conn.sendall(msg(generatedID))
            
            username=message_receive(conn)

            clients_info[generatedID]=[conn, [], username]
            t=threading.Thread(target=listentoclient, args=(conn,))
            t.start()
            print(f"Started thread {t}")

def listentoclient(socket):
    print(f'listening to {socket}\n')
    while True:

        try:
            data=message_receive(socket)
            # print(f'{socket} >> ' + str(data))

            if data == False:
                for x in clients_info[socket_id_dict[socket]][1]:
                    x.sendall(msg("cc"+socket_id_dict[socket]))

                del clients_info[socket_id_dict[socket]]
                del socket_id_dict[socket]
                print(f'{socket} has disconnected')
                break

            match data[0:2]:
                # Add contact Request str(clients_info[socket_id_dict[socket]][2])
                case "ar":
                    if data[2:] in clients_info:
                        # print("User Found")
                        socket.sendall(msg("ac"+data[2:]+str(clients_info[data[2:]][2]))) #default 1
                        clients_info[data[2:]][0].sendall(msg("ac"+socket_id_dict[socket]+str(clients_info[socket_id_dict[socket]][2]))) #change 1
                        #Log all users connected to ID
                        clients_info[socket_id_dict[socket]][1].append(clients_info[data[2:]][0])
                        clients_info[data[2:]][1].append(socket)

                #Send Message
                case "su":
                    clients_info[data[2:6]][0].sendall(msg("ru"+socket_id_dict[socket]+data[6:]))

                #Close Chat
                case "cc":
                    clients_info[data[2:]][0].sendall(msg("cc"+socket_id_dict[socket]))

                #Change Username
                case "cu":
                    clients_info[socket_id_dict[socket]][2]=data[2:]

                    for x in clients_info[socket_id_dict[socket]][1]:
                        x.sendall(msg("uc"+socket_id_dict[socket]+data[2:]))
            
        except:
            for x in clients_info[socket_id_dict[socket]][1]:
                    x.sendall(msg("cc"+socket_id_dict[socket]))

            del clients_info[socket_id_dict[socket]]
            del socket_id_dict[socket]
            print(f'Connection with {socket} has ended')
            break

# Create Socket and listen
server_socket=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server_socket.bind((IP, PORT))

server_socket.listen()

IP = server_socket.getsockname()[0]
PORT = server_socket.getsockname()[1]

print(f'Server IP: {IP} | Port: {PORT}')

con_req_thread = threading.Thread(target=acceptconnections)
con_req_thread.start()
