let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");

canvas.style.background = "tan";
canvas.style.border = "solid 4px white";

canvas.width = 1200;
canvas.height = 800;

canvas.addEventListener("mousedown", function (e) {
    var mousePos = GetMousePos(canvas, e);

    console.log(`User clicked while id is ${m_playerId}`);
    if (m_playerId == -1) {
        document.getElementById("introText").style.visibility = "hidden";
        Websocket_requestCreateIdAndBubble(mousePos);
    }
    else if (m_playerId == -2) {
        // DO NOTHING
    }
    else {
        Websocket_requestUserClicked(mousePos);
    }
});

var m_playerId = -1;
var m_bubbleScore = "";
var m_bubbleArray = [];
var m_squareArray = [];
var m_arrowArray  = [];
var m_goalLineArray  = [];
var m_canvasCenter = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
var m_worldOffset = { x: 0, y: 0 };

//const ws = new WebSocket("ws://localhost:3000");
const ws = new WebSocket("ws://ec2-44-244-49-79.us-west-2.compute.amazonaws.com:3000/");

ws.addEventListener("open", () => {
    console.log("We are connected!");
});

ws.addEventListener("message", (message) => {
    var parsedMessage = { action: "" };

    parsedMessage = (JSON.parse(message.data));
    console.log(`Message from ws ${parsedMessage.action}`);
    if (parsedMessage.action == "changed_data") {
        //console.log(`Got changed_data: ${JSON.stringify(parsedMessage)}`);
        HandleMessage_ChangedData(parsedMessage);
    }
    else if (parsedMessage.action == "id") {
        m_playerId = parsedMessage.id;
        console.log(`We got incomingId ${m_playerId}`);
    }
    else if (parsedMessage.action == "world_data") {
        console.log("Got world_data");
        Websocket_getDataInitial(parsedMessage);
    }
    else if (parsedMessage.action == "test") {
        //console.log("Received test message.");
        console.log(parsedMessage.message);
    }
});

function SendMessageToServer(messageAction = "", messageData = {}) {
    if (messageAction == "") {
        console.log(`Mesage to server must have an action!`);
        return;
    }
    messageData.action = messageAction;
    var messageToServer = JSON.stringify(messageData);
    ws.send(messageToServer);
}

function HandleMessage_ChangedData(changedData) {
    m_bubbleArray = changedData.bubbleArray;
    var newSquareArray = changedData.squareArray;

    for (var i = 0; i < newSquareArray.length; i++) {
        for (var j = 0; j < m_squareArray.length; j++) {
            if (m_squareArray[j].m_id == newSquareArray[i].m_id) {
                m_squareArray[j].m_position = newSquareArray[i].m_position;
                m_squareArray[j].m_size = newSquareArray[i].m_size;
            }
        }
    }
    for (var i = 0; i < m_bubbleArray.length; i++) {
        if (m_bubbleArray[i].m_id == m_playerId) {
            m_worldOffset.x = -(m_bubbleArray[i].m_position.x - m_canvasCenter.x);
            m_worldOffset.y = -(m_bubbleArray[i].m_position.y - m_canvasCenter.y);
        }
    }
    GameRedraw();
}


function GetMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}


function GameRedraw() {
    //console.log("Beginning redraw: " + m_goalLineArray.length);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (m_goalLineArray.length > 0) {
        m_goalLineArray.forEach(G => {
            DrawGoalLine(G);
        });
    }
    if (m_arrowArray.length > 0) {
        m_arrowArray.forEach(A => {
            DrawArrow(A);
        });
    }
    //console.log("continuing redraw: " + m_bubbleArray.length);
    if (m_bubbleArray.length > 0) {
        var confirmBubble = false;
        m_bubbleArray.forEach(bubbleInBubbleArray => {
            if (bubbleInBubbleArray.m_id == m_playerId) {
                confirmBubble = true;
                if (bubbleInBubbleArray.m_state == 0) {
                    m_bubbleScore = bubbleInBubbleArray.m_points;
                    DrawBubble(bubbleInBubbleArray, true);
                }
                else if (bubbleInBubbleArray.m_state == 1) {
                    DrawBubble(bubbleInBubbleArray, true);
                }
                else if (bubbleInBubbleArray.m_state == 2) {
                    UpdateTopScore();
                    document.getElementById("introText").style.visibility = "visible";
                    m_playerId = -1;
                    document
                }
            }
            else
                DrawBubble(bubbleInBubbleArray, false);
        });

        if (!confirmBubble && m_playerId > -1) {
            // Added comment
            document.getElementById("introText").style.visibility = "visible";
            m_playerId = -1;
        }
    }
    if (m_squareArray.length > 0) {
        m_squareArray.forEach(squareInSquareArray => {
            DrawSquare(squareInSquareArray);
        });
    }
    WriteText(m_bubbleScore, { x: 10, y: 10 });
}

function UpdateTopScore() {
    if (m_bubbleScore > document.getElementById("TopScoreText").innerHTML)
        document.getElementById("TopScoreText").innerHTML = ""+m_bubbleScore;
}


function WriteText(text, position) {
    context.font = "100px Arial";
    context.fillStyle = "black";
    context.fillText(text, position.x, position.y+100);
}

// Websocket Functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
const SERVER_ADDRESS = "http://ec2-44-244-49-79.us-west-2.compute.amazonaws.com:3000";
//const SERVER_ADDRESS = "http://localhost:3000";

async function Websocket_requestCreateIdAndBubble(mousePos) {
    m_playerId = -2;
    try {
        var incomingId = -1;
        //console.log(`Sending id and bubble request`);
        SendMessageToServer("id_and_bubble", { mousePos: mousePos });
    }
    catch (error) {
        console.log(error.message);
    }
}


async function Websocket_requestUserClicked(pos) {
    console.log("pos: " + pos.x + ", " + pos.y);
    console.log("m_worldOffset: " + m_worldOffset.x + ", " + m_worldOffset.y);
    console.log("m_canvasCenter: " + m_canvasCenter.x + ", " + m_canvasCenter.y);
    var clickBody = {
        action: "click",
        clickPos: {
            x: pos.x - m_canvasCenter.x,
            y: pos.y - m_canvasCenter.y
        },
        id: m_playerId
    }
    try {
        ws.send(JSON.stringify(clickBody));
    }
    catch (error) {
        console.log(error.message);
    }
}


async function Websocket_getDataInitial(data) {
    try {
            m_bubbleArray = data.bubbleArray;
            m_squareArray = data.squareArray;
            m_arrowArray = data.arrowArray;
            m_goalLineArray = data.goalLineArray;

            GameRedraw();
    }
    catch (error) {
        console.log(error.message);
        console.log((data));
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Bubble
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//var newBubbleObject = {};
//newBubbleObject.m_id = id;
//newBubbleObject.areaWidth = areaWidth;
//newBubbleObject.areaHeight = areaHeight;
//newBubbleObject.m_color = { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 };
//newBubbleObject.m_size = 25;
//newBubbleObject.m_position = { x: mousePos.x, y: mousePos.y };

function DrawBubble(bubbleObject, isPlayer) {
    //console.log("Bubble " + bubbleObject.m_id);
    context.beginPath();
    if (isPlayer) {
        console.log("This is the player: " + m_playerId);
        context.strokeStyle = `rgb(255, 255, 255)`;
        context.lineWidth = 7;
        context.arc(m_canvasCenter.x, m_canvasCenter.y, bubbleObject.m_size, 0, Math.PI * 2, false);
        context.stroke();
        context.strokeStyle = `rgb(${bubbleObject.m_color.r - 50}, ${bubbleObject.m_color.g - 50}, ${bubbleObject.m_color.b - 50})`;
        context.lineWidth = 3;
        context.arc(m_canvasCenter.x, m_canvasCenter.y, bubbleObject.m_size, 0, Math.PI * 2, false);
        context.stroke();
        context.fillStyle = `rgba(${bubbleObject.m_color.r}, ${bubbleObject.m_color.g}, ${bubbleObject.m_color.b}, 0.25)`;
        context.fill();
        context.stroke();
        context.closePath();
    }
    else {
        context.strokeStyle = `rgb(${bubbleObject.m_color.r - 50}, ${bubbleObject.m_color.g - 50}, ${bubbleObject.m_color.b - 50})`;
        context.lineWidth = 3;
        context.arc(bubbleObject.m_position.x + m_worldOffset.x, bubbleObject.m_position.y + m_worldOffset.y, bubbleObject.m_size, 0, Math.PI * 2, false);
        context.stroke();
        context.fillStyle = `rgba(${bubbleObject.m_color.r}, ${bubbleObject.m_color.g}, ${bubbleObject.m_color.b}, 0.25)`;
        context.fill();
        context.stroke();
        context.closePath();
    }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Square
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//newSquareObject.m_id = id;
//newSquareObject.m_color = "red";
//newSquareObject.m_size = { x: size.x, y: size.y };
//newSquareObject.m_position = { x: pos.x, y: pos.y };
// newSquareObject(id, pos, size)

function DrawSquare(squareObject) {// pos, radius, color) {
    //console.log("Square: " + squareObject.m_id);
    context.beginPath();
    context.fillStyle = squareObject.m_color;
    context.fillRect(squareObject.m_position.x + m_worldOffset.x, squareObject.m_position.y + m_worldOffset.y,
                     squareObject.m_size.x, squareObject.m_size.y);
    context.closePath();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// DebugCircle
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//newSquareObject.m_id = id;
//newSquareObject.m_color = "red";
//newSquareObject.m_size = { x: size.x, y: size.y };
//newSquareObject.m_position = { x: pos.x, y: pos.y };
// newSquareObject(id, pos, size)

function DrawDebugCircle(debugObject) {
    context.beginPath();
    context.arc(debugObject.x, debugObject.y, 10, 0, Math.PI * 2, false);
    context.fillStyle = "yellow";
    context.fill();
    context.closePath();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Arrow
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//newArrowObject.m_id = id;
//newArrowObject.m_position = { x: pos.x, y: pos.y };
//newArrowObject.m_state = { 0: RIGHT, 1: LEFT, 2: UP, 3: DOWN };
// newArrowObject(id, pos, state)

function DrawArrow(arrow) {
    if (arrow.m_state == 0) {
        DrawRightArrow(arrow.m_position);
    }
    else if(arrow.m_state == 1){
        DrawLeftArrow(arrow.m_position);
    }
    else if(arrow.m_state == 2){
        DrawUpArrow(arrow.m_position);
    }
    else if(arrow.m_state == 3){
        DrawDownArrow(arrow.m_position);
    }
}

function DrawRightArrow(pos) {
    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x + 100, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x + 100, pos.y + m_worldOffset.y + 20);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y + 20);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.fillStyle = "black";
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x + 100, pos.y + m_worldOffset.y - 20);
    context.lineTo(pos.x + m_worldOffset.x + 100, pos.y + m_worldOffset.y + 40);
    context.lineTo(pos.x + m_worldOffset.x + 150, pos.y + m_worldOffset.y + 10);
    context.fillStyle = "black";
    context.fill();
    context.closePath();
}
function DrawLeftArrow(pos) {
    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x - 100, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x - 100, pos.y + m_worldOffset.y + 20);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y + 20);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.fillStyle = "black";
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x - 100, pos.y + m_worldOffset.y - 20);
    context.lineTo(pos.x + m_worldOffset.x - 100, pos.y + m_worldOffset.y + 40);
    context.lineTo(pos.x + m_worldOffset.x - 150, pos.y + m_worldOffset.y + 10);
    context.fillStyle = "black";
    context.fill();
    context.closePath();
}

function DrawDownArrow(pos) {
    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y + 100);
    context.lineTo(pos.x + m_worldOffset.x + 20, pos.y + m_worldOffset.y + 100);
    context.lineTo(pos.x + m_worldOffset.x + 20, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.fillStyle = "black";
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x - 20, pos.y + m_worldOffset.y + 100);
    context.lineTo(pos.x + m_worldOffset.x + 40, pos.y + m_worldOffset.y + 100);
    context.lineTo(pos.x + m_worldOffset.x + 10, pos.y + m_worldOffset.y + 150);
    context.fillStyle = "black";
    context.fill();
    context.closePath();
}
function DrawUpArrow(pos) {
    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y - 100);
    context.lineTo(pos.x + m_worldOffset.x + 20, pos.y + m_worldOffset.y - 100);
    context.lineTo(pos.x + m_worldOffset.x + 20, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.fillStyle = "black";
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x - 20, pos.y + m_worldOffset.y - 100);
    context.lineTo(pos.x + m_worldOffset.x + 40, pos.y + m_worldOffset.y - 100);
    context.lineTo(pos.x + m_worldOffset.x + 10, pos.y + m_worldOffset.y - 150);
    context.fillStyle = "black";
    context.fill();
    context.closePath();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

// GoalLine
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//newArrowObject.m_id = id;
//newArrowObject.m_position = { x: pos.x, y: pos.y };
//newArrowObject.m_state = { 0: RIGHT, 1: LEFT, 2: UP, 3: DOWN };
// newArrowObject(id, pos, state)

function DrawGoalLine(goalLine) {
    context.beginPath();
    context.fillStyle = "green";
    context.fillRect(goalLine.m_position.x + m_worldOffset.x - (goalLine.m_size.x * 0.5),
        goalLine.m_position.y + m_worldOffset.y - (goalLine.m_size.y * 0.5),
        goalLine.m_size.x, goalLine.m_size.y);
    context.closePath();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

