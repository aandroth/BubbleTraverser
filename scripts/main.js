let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");

canvas.style.background = "tan";
canvas.style.border = "solid 4px white";

var windowWidth = window.innerWidth - 50;
var windowHeight = window.innerHeight - 50;

canvas.width = 1200;// windowWidth;
canvas.height = 800; // windowHeight;

var m_playerId = -1;
var m_bubbleScore = "";
var m_bubbleArray = [];
var m_squareArray = [];
var m_arrowArray  = [];
var m_goalLineArray  = [];
var m_debugCircle = { x: 0, y: 0 };
var m_canvasCenter = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
var m_worldOffset = { x: 0, y: 0 };

const ws = new WebSocket("ws://localhost:3000");

ws.addEventListener("open", () => {
    console.log("We are connected!");

    ws.send("Client to Server.");
});

ws.addEventListener("message", (d) => {
    console.log(JSON.parse(d.data));
    console.log(JSON.parse(d.data).type);
    console.log(JSON.parse(d.data).content);
});

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

canvas.addEventListener("mousedown", function (e) {
    var mousePos = getMousePos(canvas, e);
  
    if (m_playerId == -1) {
        document.getElementById("introText").style.visibility = "hidden";
        requestCreateIdAndThenCreateBubble(mousePos);
    }
    else if (m_playerId == -2) {
        // DO NOTHING
    }
    else {
        requestUserClicked(mousePos);
    }
});
function resolveAfterSeconds(seconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('resolved');
        }, seconds * 1000);
    });
}

async function gameUpdate() {
    //console.log("update");
    getData();
    //console.log("got data");
    window.requestAnimationFrame(gameUpdate);
}

function gameRedraw(playerBubbleIdx) {
    console.log("Beginning redraw: " + m_squareArray.length);
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
    if (m_bubbleArray.length > 0) {
        var confirmBubble = false;
        m_bubbleArray.forEach(B => {
            if (B.m_id == m_playerId) {
                confirmBubble = true;
                if (B.m_state == 0) {
                    m_bubbleScore = B.m_points;
                    DrawBubble(B, true);
                }
                else if (B.m_state == 1) {
                    DrawBubble(B, true);
                }
                else if (B.m_state == 2) {
                    updateTopScore();
                    document.getElementById("introText").style.visibility = "visible";
                    m_playerId = -1;
                    document
                }
            }
            else
                DrawBubble(B, false);
        });

        if (!confirmBubble && m_playerId > -1) {
            //console.log("Changing id from " + m_playerId + " to -1");
            document.getElementById("introText").style.visibility = "visible";
            m_playerId = -1;
        }
    }
    if (m_squareArray.length > 0) {
        m_squareArray.forEach(S => {
            DrawSquare(S);
        });
    }
    writeText(m_bubbleScore, { x: 10, y: 10 });
}

function updateTopScore() {
    document.getElementById("TopScoreText").innerHTML = ""+m_bubbleScore;
}


function writeText(text, position) {
    context.font = "100px Arial";
    context.fillStyle = "black";
    context.fillText(text, position.x, position.y+100);
}

// Get data
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
const myHeaders = { 'Content-Type': 'application/json', };
//const serverAddr = "http://ec2-44-244-49-79.us-west-2.compute.amazonaws.com:3000";
const serverAddr = "http://localhost:3000";

const getCreateBubbleRequest = new Request(serverAddr+"/bubble", {
    mehtod: "GET",
    headers: myHeaders,
});
const getDataRequest = new Request(serverAddr+"/", {
    mehtod: "GET",
    headers: myHeaders,
});
const getInitialDataRequest = new Request(serverAddr+"/initial", {
    mehtod: "GET",
    headers: myHeaders,
});

async function requestCreateIdAndThenCreateBubble(mousePos) {
    m_playerId = -2;
    try {
        var incomingId = -1;
        var response = await fetch(serverAddr+'/id', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        .then((res) => {
            return res.json();
        })
        .then((data) => { incomingId = data; console.log("incomingId: " + incomingId); requestCreateBubble(mousePos, incomingId); });
    }
    catch (error) {
        console.log(error.message);
    }
}

async function requestCreateBubble(mousePos, id) {
    //document.getElementById("overlayDiv").style.visibility = "hidden";
    var requestBody = {
        id: id,
        pos: mousePos,
        areaWidth: canvas.width,
        areaHeight: canvas.height
    }
    try {
        var response = await fetch(serverAddr+'/bubble', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        })
        .then((res) => {
            return res.json();
        })
        .then((data) => {
            //console.log("postInfo data: " + data.message);
            m_playerId = id;
            console.log("We are now Player " + m_playerId);
        });
    }
    catch (error) {
        console.log(error.message);
    }
}

async function requestUserClicked(pos) {
    console.log("pos: " + pos.x + ", " + pos.y);
    console.log("m_worldOffset: " + m_worldOffset.x + ", " + m_worldOffset.y);
    console.log("m_canvasCenter: " + m_canvasCenter.x + ", " + m_canvasCenter.y);
    var clickBody = {
        clickPos: {
            x: pos.x - m_canvasCenter.x,
            y: pos.y - m_canvasCenter.y
        },
        id: m_playerId
    }
    try {
        var response = await fetch(serverAddr+'/click', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clickBody),
        })
            .then((res) => {
                return res.json();
            })
            .then((data) => console.log("postInfo data: " + data));
        //console.log("postInfo response: " + response);
    }
    catch (error) {
        console.log(error.message);
    }
}

async function getData() {
    try {
        //const response = await fetch(getDataRequest);


        const json = await response.json()
            .then((res) => {
                m_bubbleArray = res.bubbleArray;
                //console.log("Try matches with theirSquares: " + res.squareArray.length);
                for (var i = 0; i < m_squareArray.length; i++) {
                    for (var j = 0; j < res.squareArray.length; j++) {
                        if (m_squareArray[i].m_id == res.squareArray[j].m_id) {

                            //console.log("Matched "+m_squareArray[i].m_id);
                            m_squareArray[i].m_position = res.squareArray[j].m_position;
                            m_squareArray[i].m_size = res.squareArray[j].m_size;
                        }
                    }
                }
                for (var i = 0; i < res.bubbleArray.length; i++) {
                    if (res.bubbleArray[i].m_id == m_playerId) {
                        m_worldOffset.x = -(res.bubbleArray[i].m_position.x - m_canvasCenter.x);
                        m_worldOffset.y = -(res.bubbleArray[i].m_position.y - m_canvasCenter.y);
                    }
                }
            })
            .then(() => {
                gameRedraw();
            });
    }
    catch (error) {
        console.log(error.message);
    }
}

async function getDataInitial() {
    try {
        const response = await fetch(getInitialDataRequest);

        const json = await response.json()
            .then((res) => {
                m_bubbleArray = res.bubbleArray;
                m_squareArray = res.squareArray;
                m_arrowArray = res.arrowArray;
                m_goalLineArray = res.goalLineArray;
            })
            .then(() => {
                gameRedraw();
            })
            .then(() => {
                gameUpdate();
            });
    }
    catch (error) {
        console.log(error.message);
    }
}
//getDataInitial();
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

// Arrow
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

