import socket
import eel
import threading
import os

IP=None
HEADER_LEN=10
client_socket=None
ID=None
recv_msg_thread=None
username="DefaultUsername"

@eel.expose
def programexit():
    os._exit(0)

# Format Message
def msg(message):
    msglen=len(message)
    x=HEADER_LEN-len(str(msglen))
    return (str(msglen)+(x*" ")+message).encode("utf-8")

@eel.expose
def updatename(name):
    global username, IP
    username = name
    if IP!=None:
        client_socket.sendall(msg("cu"+username))

@eel.expose
def addcontactrequest(idnum):
    if IP!=None:
        client_socket.sendall(msg("ar"+idnum))

def startbrowser():
    eel.init(f'{os.path.dirname(os.path.realpath(__file__))}/web')
    eel.start('mainpage.html', mode='edge', port=0)

@eel.expose
def sendmessagetouser(ID,message):
    client_socket.sendall(msg("su"+ID+message))

@eel.expose
def closecontact(idnum):
    client_socket.sendall(msg("cc"+idnum))

def message_receive(sender_socket):
    message_header = sender_socket.recv(HEADER_LEN)

    if not len(message_header):
        return False 
        
    message_len = int(message_header.decode('utf-8'))
    return sender_socket.recv(message_len).decode('utf-8')

def listentoserver(socket):
    print('listening to server\n')
    global IP
    
    while True:

        try:
            data=message_receive(socket)
            # print('Server >> ' + str(data))

            if data == False:
                IP = None
                eel.onserverdisconnect()
                break

            else:
                match data[:2]:
                    #Add Contact
                    case "ac":
                        # Data[2:6] Network ID of added contact
                        eel.addcontactelem(data[2:6], data[6:])
                    
                    #Receive Message
                    case "ru":
                        recieved_message=data[6:]
                        sender = data[2:6]
                        eel.recievemessage(recieved_message,sender)

                    #Close Chat
                    case "cc":
                        eel.closechat(data[2:])

                    #Incoming Username Change
                    case "uc":
                        eel.incomingusernamechange(data[2:6],data[6:])
        except:
            IP = None
            eel.onserverdisconnect()
            break

@eel.expose              
def connecttoserver(ip,portnum):
# Create socket and connect to server
    try:
        global IP, client_socket, ID, recv_msg_thread, username
        if str(ip)!=IP:
            client_socket=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.connect((ip, int(portnum)))
            client_socket.setblocking(True)
            IP=ip
            
            #Recieve and set ID number
            ID=message_receive(client_socket)
            print("ID: "+ID)
            eel.setID(ID)

            client_socket.sendall(msg(username))

            recv_msg_thread = threading.Thread(target=listentoserver, args=(client_socket,))
            recv_msg_thread.start()
            eel.connectionstatusupdate(True)

    except:
        print('Unable to connect')

# Open Browser GUI
browser_thread = threading.Thread(target=startbrowser)
browser_thread.start()

input('')