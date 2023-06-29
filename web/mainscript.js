let sendmsgtemplate = document.getElementsByTagName("template")[2].content.querySelector("div");
let contactcontainer = document.getElementById('contactcontainer');
let msgcontainer = document.getElementById('messagecontainer');
let IDelement = document.getElementById('IDtag');
let sendbutton = document.getElementById('sendmsg');

let contactdict={};
let messagelog={};
let iddict={};
let activeid=null;
let activecontact=null;

setactiveid(null);

window.addEventListener('beforeunload', function (e) {
    eel.programexit()
});

document.getElementById('usernamesyncicon').addEventListener('click', function(){
    username=document.getElementById('usernameinput').value.trim();
    eel.updatename(username);
})

eel.expose(incomingusernamechange);
function incomingusernamechange(idnum,newname){
    iddict[idnum].getElementsByClassName('username')[0].innerText=newname;
}

// Add Contact Element Function
eel.expose(addcontactelem);
function addcontactelem(id,username){
    let addcontacttemplate = document.getElementsByTagName("template")[0].content.querySelector("div");
    let contactinst = document.importNode(addcontacttemplate, true);
    contactinst.getElementsByClassName('id')[0].innerText=id;
    contactinst.getElementsByClassName('username')[0].innerText=username;
    

    contactinst.getElementsByClassName('closeicon')[0].addEventListener('click',function(){
        eel.closecontact(id);
        contactinst.remove();
        delete contactdict[contactinst];
        delete messagelog[id];
        if (activeid==id){
            setactiveid(null)
            clearscreen()
        }
    })

    contactinst.getElementsByClassName('contact')[0].addEventListener('click',function(){
        if (activecontact != null){
            activecontact.getElementsByClassName("contact")[0].style.backgroundColor = "#141514";
            activecontact.getElementsByClassName("checkbutton")[0].innerText="radio_button_unchecked"
        }
        // activeid=id
        setactiveid(id)
        activecontact=contactinst
        activecontact.getElementsByClassName("contact")[0].style.backgroundColor = "#282A28";
        activecontact.getElementsByClassName("checkbutton")[0].innerText="arrow_circle_right";

        // Clear Screen
        clearscreen()

        for (x in messagelog[id]){
            if (messagelog[id][x][0]=="r"){
                createrecvmsgelem(messagelog[id][x].slice(1));
            }
            else if (messagelog[id][x][0]=="s"){
                var d = new Date(),
                h = (d.getHours()<10?'0':'') + d.getHours();
                m = (d.getMinutes()<10?'0':'') + d.getMinutes();
                let msginst = document.importNode(sendmsgtemplate, true); 
                msginst.getElementsByClassName('message')[0].innerText=messagelog[id][x].slice(1)
                msginst.getElementsByClassName('time')[0].innerText=h + ':' + m
                msgcontainer.appendChild(msginst);
            }
        }
    })

    contactcontainer.appendChild(contactinst)
    contactdict[contactinst]=id
    iddict[id]=contactinst
    messagelog[id]=[]
}

// Send Message Function
function sendmessage(){
    let msgcontent = document.getElementById('messageinput').value.trim();

    if (msgcontent!='') {
        var d = new Date(),
        h = (d.getHours()<10?'0':'') + d.getHours();
        m = (d.getMinutes()<10?'0':'') + d.getMinutes();
    
        let msginst = document.importNode(sendmsgtemplate, true); 
        msginst.getElementsByClassName('message')[0].innerText=msgcontent;
        msginst.getElementsByClassName('time')[0].innerText=h + ':' + m;
        msgcontainer.appendChild(msginst);
        msgcontainer.scrollTop = msgcontainer.scrollHeight;
        document.getElementById('messageinput').value='';

        eel.sendmessagetouser(activeid,msgcontent);
        messagelog[activeid].push('s'+msgcontent);
    } 
}

// Recieve Message Function
eel.expose(recievemessage)
function recievemessage(content,senderid){
    messagelog[senderid].push('r'+content);
    if (activeid==senderid){
        createrecvmsgelem(content);
    }
}

function createrecvmsgelem(content){
    let recvmsgtemplate = document.getElementsByTagName("template")[1].content.querySelector("div");
    var d = new Date(),
    h = (d.getHours()<10?'0':'') + d.getHours();
    m = (d.getMinutes()<10?'0':'') + d.getMinutes();
    
    let msginst = document.importNode(recvmsgtemplate, true); 
    msginst.getElementsByClassName('message')[0].innerText=content;
    msginst.getElementsByClassName('time')[0].innerText=h + ':' + m;
    msgcontainer.appendChild(msginst);
    msgcontainer.scrollTop = msgcontainer.scrollHeight;
}

// Add Contact Request
function addcontactrequest(){
    let contactidinput = document.getElementById('contactid');
    idvalue=contactidinput.value;
    if (idvalue != "" && IDelement.innerText!=idvalue && !(idvalue in iddict)){
        eel.addcontactrequest(idvalue);
        contactidinput.value='';
    }
}

eel.expose(setID)
function setID(ID){
    IDelement.innerText=ID;
}

// Send message on click
sendbutton.addEventListener('click',function(){
    sendmessage();
})

// Send Message on ENTER
document.getElementById('messageinput').addEventListener("keydown", (event) => {
    if (event.key === "Enter"){
        sendmessage();
    }
})

document.getElementById('contactid').addEventListener("keydown", (event) => {
    if (event.key === "Enter"){
        addcontactrequest()
    }
})

eel.expose(closechat)
function closechat(idnum){
    
    if (idnum==activeid){
        clearscreen();
    }

    iddict[idnum].remove();
    delete contactdict[iddict[idnum]];
    delete messagelog[idnum];
    delete iddict[idnum];
    activecontact=null
    // activeid=null
    setactiveid(null)
}

function clearscreen(){
    while (msgcontainer.firstChild) {
        msgcontainer.removeChild(msgcontainer.firstChild);
    }
}

eel.expose(onserverdisconnect)
function onserverdisconnect(){

    connectionstatusupdate(false)

    clearscreen()
    contactdict={}
    messagelog={}
    activeid=null
    activecontact=null
    iddict={}

    setactiveid(null);

    while (contactcontainer.firstChild) {
        contactcontainer.removeChild(contactcontainer.firstChild);
    }

}

function serverconnectbox(state){
    let v;
    if (state==true){
        v='visible'
    }
    else{
        v="hidden"
    }
    let serverconnectelem = document.getElementById('serverconnect');
    serverconnectelem.style.visibility=v
}

function setactiveid(idnum){
    activeid=idnum
    if (idnum==null){
        document.getElementById('messageinput').style.visibility='hidden'
    }

    else{
        document.getElementById('messageinput').style.visibility='visible'
    }
}

function connecttoserver(){
    let ip = document.getElementById('ipinput').value.trim();
    let port = document.getElementById('portinput').value.trim();
    if (ip != null){
        eel.connecttoserver(ip,port)
    }
}

eel.expose(connectionstatusupdate)
function connectionstatusupdate(state){
    if (state==true){
        document.getElementById('connectionstatuscontainer').style.borderColor="#00af54";
        document.getElementById('connectionstatuscontainer').style.backgroundColor="#00af54";
        document.getElementById('connectionstatustext').style.color="#141514";
        document.getElementById('connectionstatustext').innerText="Connected";
        document.getElementById('connectionstatusicon').style.color="#141514";
        document.getElementById('connectionstatusicon').innerText="conversion_path";
    }

    else{
        document.getElementById('connectionstatuscontainer').style.borderColor="#FB3640";
        document.getElementById('connectionstatuscontainer').style.backgroundColor="#FB3640";
        document.getElementById('connectionstatustext').style.color="#141514";
        document.getElementById('connectionstatustext').innerText="Not Connected";
        document.getElementById('connectionstatusicon').style.color="#141514";
        document.getElementById('connectionstatusicon').innerText="conversion_path_off";
    }
}