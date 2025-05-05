var bubbleFns = require('./bubble');
var squareFns = require('./square');
var arrowFns = require('./arrow');
var goalLineFns = require('./goalLine');
const cors = require('cors');
const express = require('express');
const Websocket = require('ws');
const app = express();
const port = 3000;
const wss = new Websocket.Server({ port: 3000 });


var m_bubbleCount = 0;
var m_nextPlayerId = 0;
var m_bubbleArray = [];
var m_squareArray = [];
var m_arrowArray  = [];
var m_goalLineArray  = [];
var m_changedSquareArray = [];
var m_squareDropTracker = 0;
var m_squareDropInterval = 10;
var m_startAreaBounds = { xMin: 0, yMin: -1000, xMax: 200, yMax: -600 };
app.use(cors());
app.use(express.json());

wss.on('connection', ws => {
    console.log("Client connected!");

    ws.on("message", data => {
        console.log(`Client sent ${data}`);
        var d = JSON.stringify({ type: "/", content: "stuff" });
        ws.send(d);
    });

    ws.on("close", () => {
        console.log("Client disconnected!");
    });
});

app.get('/', (req, res) => {
    var worldDataChanged = {
        squareArray: m_changedSquareArray,
        bubbleArray: m_bubbleArray,
        arrowArray: m_arrowArray,
        goalLineArray: m_goalLineArray
    }
    //if (m_changedSquareArray.length > 0)
    //    console.log("Changed: "+m_changedSquareArray[0].m_size.x + ", " + m_changedSquareArray[0].m_size.y);
    res.send(worldDataChanged);
})

app.get('/id', (req, res) => {
    res.send("" + m_nextPlayerId);
    ++m_nextPlayerId;
})

app.get('/initial', (req, res) => {
    if (m_goalLineArray.length > 0) {
        console.log(m_goalLineArray.length);
        console.log(m_goalLineArray[0].m_position.x + ", " + m_goalLineArray[0].m_position.y);
    }
    else {
        console.log("no goal lines!");
    }
    var worldDataAll = {
        squareArray: m_squareArray,
        bubbleArray: m_bubbleArray,
        arrowArray: m_arrowArray,
        goalLineArray: m_goalLineArray
    }
    res.send(worldDataAll);
})

app.put('/bubble', (req, res) => {
    try {
        console.log('Received a bubble message from Player ' + req.body.id);
        if (req.body.id == -2) {
            // These are clicks made before the player has been issued their id, so ignore
            return;
        }
        m_bubbleArray.push(bubbleFns.CreateBubbleObject(req.body.id, req.body.pos, m_startAreaBounds, removeBubbleFromArray))

        console.log("req: " + req.body.id);
    } catch (err) {
        res.status(500).json({ message: err, });
    }
    res.send({ message: "Bubble has been created for Player " + req.body.id });
})

app.put('/click', (req, res) => {
    if (req.body.id == -1 || req.body.id == -2 || m_bubbleArray.length == 0) {
        // These are clicks made before the player has been issued their id, so ignore
        return;
    }
    //console.log('Received a message at click POST.');
    try {
        var bubbleIdx = -1;
        //console.log('About to check for loop on bubbleArray of size ' + m_bubbleArray.length);
        for (var ii = 0; ii < m_bubbleArray.length; ii++) {
            //console.log('Checking bubble ' + m_bubbleArray[ii].m_id + ' at ' + ii);
            if (m_bubbleArray[ii].m_id == req.body.id) {
                //console.log('Found bubble ' + m_bubbleArray[ii].m_id);
                bubbleIdx = ii;
                break;
            }
        }
        //console.log('Check that bubbleIdx is not -1, bubbleIdx: ' + bubbleIdx);
        if (bubbleIdx == -1)
            return;

        //console.log("bubleIdx cleared ");
        //console.log("Player " + req.body.id + " clicked at " + req.body.clickPos.x + ", " + req.body.clickPos.y);
        //console.log("Player " + req.body.id + " is at " + m_bubbleArray[bubbleIdx].m_position.x + ", " + m_bubbleArray[bubbleIdx].m_position.y);
        bubbleFns.ChangeDirection(req.body.clickPos, m_bubbleArray[bubbleIdx]);
    } catch (err) {
        res.status(500).json({ message: err, });
        console.log('Click POST ERROR');
    }
    res.send("");
})

//app.listen(port, () => {
//    console.log(`Bubble app listening on port ${port}`)
//})

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function CheckCollisions_Squares() {
    if (m_bubbleArray.length > 0 && m_squareArray.length > 0) {
        m_bubbleArray.forEach((B) => {
            if (B.m_state == 0) {
                m_squareArray.forEach((S) => {

                    if (S.m_state != S.STATES.NOT_SPAWNED) {
                        var centerOfSquare = {
                            x: S.m_position.x + (S.m_size.x * 0.5),
                            y: S.m_position.y + (S.m_size.y * 0.5)
                        };
                        var vectorFromBubbleToSquare = {
                            x: centerOfSquare.x - B.m_position.x,
                            y: centerOfSquare.y - B.m_position.y
                        };
                        var vectorMagnitude = Math.sqrt(
                            vectorFromBubbleToSquare.x * vectorFromBubbleToSquare.x +
                            vectorFromBubbleToSquare.y * vectorFromBubbleToSquare.y);
                        var normalizedVector = {
                            x: vectorFromBubbleToSquare.x / vectorMagnitude,
                            y: vectorFromBubbleToSquare.y / vectorMagnitude
                        }
                        var closetPointOnCircle = {
                            x: (normalizedVector.x * B.m_size) + B.m_position.x,
                            y: (normalizedVector.y * B.m_size) + B.m_position.y
                        }
                        //////Debug////
                        //console.log("x: " + closetPointOnCircle.x + ", y: " + closetPointOnCircle.y);
                        m_debugCircle = closetPointOnCircle;
                        ///////////////

                        if (closetPointOnCircle.x > S.m_position.x &&
                            closetPointOnCircle.x < S.m_position.x + S.m_size.x &&
                            closetPointOnCircle.y > S.m_position.y &&
                            closetPointOnCircle.y < S.m_position.y + S.m_size.y) {

                            B.destroy();
                        }
                    }
                })
            }
        })
    }
}
function CheckCollisions_GoalLines() {
    if (m_bubbleArray.length > 0 && m_squareArray.length > 0) {
        m_bubbleArray.forEach((B) => {
            if (B.m_state == 0) {
                m_goalLineArray.forEach((G) => {

                    var centerOfSquare = {
                        x: G.m_position.x + (G.m_size.x * 0.5),
                        y: G.m_position.y + (G.m_size.y * 0.5)
                    };
                    var vectorFromBubbleToSquare = {
                        x: centerOfSquare.x - B.m_position.x,
                        y: centerOfSquare.y - B.m_position.y
                    };
                    var vectorMagnitude = Math.sqrt(
                        vectorFromBubbleToSquare.x * vectorFromBubbleToSquare.x +
                        vectorFromBubbleToSquare.y * vectorFromBubbleToSquare.y);
                    var normalizedVector = {
                        x: vectorFromBubbleToSquare.x / vectorMagnitude,
                        y: vectorFromBubbleToSquare.y / vectorMagnitude
                    }
                    var closetPointOnCircle = {
                        x: (normalizedVector.x * B.m_size) + B.m_position.x,
                        y: (normalizedVector.y * B.m_size) + B.m_position.y
                    }
                    //////Debug////
                    //console.log("x: " + closetPointOnCircle.x + ", y: " + closetPointOnCircle.y);
                    m_debugCircle = closetPointOnCircle;
                    ///////////////

                    if (G.m_state == 0) {
                        if (closetPointOnCircle.x > G.m_position.x - (G.m_size.x * 0.5) && // y
                            closetPointOnCircle.x < G.m_position.x + (G.m_size.x * 0.5) && // y
                            closetPointOnCircle.y > G.m_position.y - (G.m_size.y * 0.5) && // 
                            closetPointOnCircle.y < G.m_position.y + (G.m_size.y * 0.5)) {

                            bubbleFns.ReachedGoalLine(B, G.m_id);
                        }
                    }
                    else {
                        if (closetPointOnCircle.x > G.m_position.y - (G.m_size.y * 0.5) &&
                            closetPointOnCircle.x < G.m_position.y + (G.m_size.y * 0.5) &&
                            closetPointOnCircle.y > G.m_position.x - (G.m_size.x * 0.5) &&
                            closetPointOnCircle.y < G.m_position.x + (G.m_size.x * 0.5)) {

                            bubbleFns.ReachedGoalLine(B, G.m_id);
                        }
                    }
                })
            }
        })
    }
}

function CheckCollisions_Bubbles() {
    if (m_bubbleArray.length > 0) {
        for (var ii = 0; ii < m_bubbleArray.length; ii++) {
            if (m_bubbleArray[ii].m_state == 0) {
                for (var jj = ii+1; jj < m_bubbleArray.length; jj++) {
                    if (m_bubbleArray[jj].m_state == 0) {
                        if (m_bubbleArray[ii].m_id != m_bubbleArray[jj].m_id) {

                            var distToContact = m_bubbleArray[ii].m_size + m_bubbleArray[jj].m_size;
                            var distToOther = {
                                x: m_bubbleArray[jj].m_position.x - m_bubbleArray[ii].m_position.x, y: m_bubbleArray[jj].m_position.y - m_bubbleArray[ii].m_position.y
                            }
                            if (distToContact * distToContact > ((distToOther.x * distToOther.x) + (distToOther.y * distToOther.y))) {

                                var diff = {
                                    x: m_bubbleArray[ii].m_position.x - m_bubbleArray[jj].m_position.x,
                                    y: m_bubbleArray[ii].m_position.y - m_bubbleArray[jj].m_position.y
                                }
                                var nMag = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
                                var norm = { x: (diff.x / nMag), y: (diff.y / nMag) };
                                var normOpp = {
                                    x: -norm.x, y: -norm.y
                                };

                                // Move the bubbles apart
                                amountIntersecting = distToContact - Math.sqrt((distToOther.x * distToOther.x) + (distToOther.y * distToOther.y));
                                m_bubbleArray[ii].m_position.x += norm.x * amountIntersecting * 0.5;
                                m_bubbleArray[ii].m_position.y += norm.y * amountIntersecting * 0.5;
                                m_bubbleArray[jj].m_position.x += normOpp.x * amountIntersecting * 0.5;
                                m_bubbleArray[jj].m_position.y += normOpp.y * amountIntersecting * 0.5;

                                var dot1 = m_bubbleArray[ii].m_velocity.x * norm.y + m_bubbleArray[ii].m_velocity.y * norm.x;
                                if (dot1 > 0) dot1 = -dot1;
                                m_bubbleArray[ii].m_velocity.x = m_bubbleArray[ii].m_velocity.x - 2 * dot1 * norm.x;
                                m_bubbleArray[ii].m_velocity.y = m_bubbleArray[ii].m_velocity.y - 2 * dot1 * norm.y;

                                var dot2 = m_bubbleArray[jj].m_velocity.x * normOpp.y + m_bubbleArray[jj].m_velocity.y * normOpp.x;
                                if (dot2 > 0) dot2 = -dot2;
                                m_bubbleArray[jj].m_velocity.x = m_bubbleArray[jj].m_velocity.x - 2 * dot2 * normOpp.x;
                                m_bubbleArray[jj].m_velocity.y = m_bubbleArray[jj].m_velocity.y - 2 * dot2 * normOpp.y;
                            }
                        }
                    }
                }
            }
        }
    }
}

var removeBubbleFromArray = function () {
    console.log("Called removeBubbleFromArray");
    for (var ii = 0; ii < m_bubbleArray.length; ii++) {
        if (m_bubbleArray[ii].m_state == 2) {
            m_bubbleArray.splice(ii, 1);
        }
    }
    //console.log("m_bubbleArray.length: " + m_bubbleArray.length);
}

async function updateAllSquares() {
    m_squareArray.forEach(S => S.update());
}

async function addChangedSquare(changedSquare) {
    m_changedSquareArray.push(changedSquare);
}

async function serverUpdate() {
    //console.log("Server Update: " + m_bubbleArray.length);
    m_changedSquareArray = [];
    await CheckCollisions_Squares();
    await CheckCollisions_GoalLines();
    await updateAllSquares();
    if (m_bubbleArray.length > 0) {
        CheckCollisions_Bubbles();
        m_bubbleArray.forEach(B => B.update());
    }
    if (m_squareArray.length > 0) {
        //console.log(m_squareDropTracker);
        if (m_bubbleArray.length > 0) {
            m_squareDropTracker += 1;
            if (m_squareDropTracker > m_squareDropInterval) {
                var randSquare = Math.floor(Math.random() * m_squareArray.length * 0.5);
                m_squareArray[randSquare * 2].bump();
                m_squareDropTracker = 0;
            }
        }
    }
    var v = await sleep(50);
    serverUpdate();
}

//m_bubbleArray.push(bubbleFns.CreateBubbleObject(0, { x: 400, y: 400 }, m_startAreaBounds, removeBubbleFromArray));
//m_bubbleArray.push(bubbleFns.CreateBubbleObject(1, { x: 400, y: 600 }, m_startAreaBounds, removeBubbleFromArray));

// Create Squares
///////////////////////////////////////////////////////////////////////
//newSquareObject.m_id = id;
//newSquareObject.m_color = "red";
//newSquareObject.m_size = { x: size.x, y: size.y };
//newSquareObject.m_position = { x: pos.x, y: pos.y };
// newSquareObject(id, pos, size)
var spacing = 50;
// Inner diamond
var inner_start = {x: -50, y: -500}
for (var ii = 0; ii < 9; ii++) {
    m_squareArray.push(squareFns.CreateSquareObject(ii, { x: inner_start.x + spacing * ii, y: inner_start.y + spacing * ii }, { x: 100, y: 100 }, { x: 1, y: -1 }, addChangedSquare));
}
inner_start = {x: 400, y: -50}
for (var ii = 0; ii < 9; ii++) {
    m_squareArray.push(squareFns.CreateSquareObject(m_squareArray.length, { x: inner_start.x - spacing * ii, y: inner_start.y + spacing * ii }, { x: 100, y: 100 }, { x: 1, y: 1 }, addChangedSquare));
}
inner_start = {x: -50, y: 400}
for (var ii = 0; ii < 9; ii++) {
    m_squareArray.push(squareFns.CreateSquareObject(m_squareArray.length, { x: inner_start.x - spacing * ii, y: inner_start.y - spacing * ii }, { x: 100, y: 100 }, { x: -1, y: 1 }, addChangedSquare));
}
inner_start = {x: -500, y: -50}
for (var ii = 0; ii < 9; ii++) {
    m_squareArray.push(squareFns.CreateSquareObject(m_squareArray.length, { x: inner_start.x + spacing * ii, y: inner_start.y - spacing * ii }, { x: 100, y: 100 }, { x: -1, y: -1 }, addChangedSquare));
}

// Outer Diamond
var outer_start = { x: -50, y: -1500 }
for (var ii = 0; ii < 29; ii++) {
    m_squareArray.push(squareFns.CreateSquareObject(m_squareArray.length, { x: outer_start.x + spacing * ii, y: outer_start.y + spacing * ii }, { x: 100, y: 100 }, { x: -1, y: 1 }, addChangedSquare));
}
outer_start = { x: 1400, y: -50 }
for (var ii = 0; ii < 29; ii++) {
    m_squareArray.push(squareFns.CreateSquareObject(m_squareArray.length, { x: outer_start.x - spacing * ii, y: outer_start.y + spacing * ii }, { x: 100, y: 100 }, { x: -1, y: -1  }, addChangedSquare));
}
outer_start = { x: -50, y: 1400 }
for (var ii = 0; ii < 29; ii++) {
    m_squareArray.push(squareFns.CreateSquareObject(m_squareArray.length, { x: outer_start.x - spacing * ii, y: outer_start.y - spacing * ii }, { x: 100, y: 100 }, { x: 1, y: -1 }, addChangedSquare));
}
outer_start = { x: -1500, y: -50 }
for (var ii = 0; ii < 29; ii++) {
    m_squareArray.push(squareFns.CreateSquareObject(m_squareArray.length, { x: outer_start.x + spacing * ii, y: outer_start.y - spacing * ii }, { x: 100, y: 100 }, { x: 1, y: 1 }, addChangedSquare));
}

// Direction Arrows
m_arrowArray.push(arrowFns.CreateArrowObject(0, {x: 0, y: -900}, 0));   // Right
m_arrowArray.push(arrowFns.CreateArrowObject(1, {x: 0, y: 900}, 1));    // Left
m_arrowArray.push(arrowFns.CreateArrowObject(2, {x: -900, y: 0}, 2));   // Up
m_arrowArray.push(arrowFns.CreateArrowObject(3, { x: 900, y: 0 }, 3));  // Down

///////////////////////////////////////////////////////////////////////

// Direction Arrows
m_goalLineArray.push(goalLineFns.CreateGoalLineObject(3, { x: 0, y: -900 }, { x: 40, y: 1000 }));
m_goalLineArray.push(goalLineFns.CreateGoalLineObject(2, { x: 900, y: 0 }, { x: 1000, y: 40 }));
m_goalLineArray.push(goalLineFns.CreateGoalLineObject(0, { x: -900, y: 0 }, {x: 1000, y: 40}));
m_goalLineArray.push(goalLineFns.CreateGoalLineObject(1, { x: 0, y: 900 }, { x: 40, y: 1000 }));
///////////////////////////////////////////////////////////////////////

serverUpdate();