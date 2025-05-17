

function CreateBubbleObject(id, mousePos, startAreaBounds, removeFn) {
    var newBubbleObject = {};
    newBubbleObject.m_id = id;
    newBubbleObject.m_startAreaBounds = startAreaBounds;
    newBubbleObject.m_color = { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 };
    newBubbleObject.m_points = 0;
    newBubbleObject.m_size = 25;
    newBubbleObject.m_position = { x: mousePos.x, y: mousePos.y };
    newBubbleObject.m_timeStamp = new Date().getTime();
    newBubbleObject.m_timeStampDeath = newBubbleObject.m_timeStamp;
    newBubbleObject.m_state = 0; // 0: playing, 1: destructing, 2: destroyed
    newBubbleObject.m_goalStateId = 0; // Goal line currently reached
    newBubbleObject.m_speed = 5;

    newBubbleObject.destroy = function () {
        this.m_velocity = { x: 0, y: 0 };
        this.m_state = 1;
        this.m_timeStampDeath = new Date().getTime();
    }

    //Ensure that the position is within the bounds of the canvas
    if      (newBubbleObject.m_position.x - newBubbleObject.m_size      < newBubbleObject.m_startAreaBounds.xMin) { newBubbleObject.m_position.x = newBubbleObject.m_startAreaBounds.xMin +      newBubbleObject.m_size + 1; }
    else if (newBubbleObject.m_position.x + newBubbleObject.m_size + 50 > newBubbleObject.m_startAreaBounds.xMax) { newBubbleObject.m_position.x = newBubbleObject.m_startAreaBounds.xMax - 50 - newBubbleObject.m_size - 1; }
    if      (newBubbleObject.m_position.y - newBubbleObject.m_size <      newBubbleObject.m_startAreaBounds.yMin) { newBubbleObject.m_position.y = newBubbleObject.m_startAreaBounds.yMin +      newBubbleObject.m_size + 1; }
    else if (newBubbleObject.m_position.y + newBubbleObject.m_size + 50 > newBubbleObject.m_startAreaBounds.yMax) { newBubbleObject.m_position.y = newBubbleObject.m_startAreaBounds.yMax - 50 - newBubbleObject.m_size - 1; }

    var randVelocity = { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 };
    var mag = Math.sqrt(randVelocity.x * randVelocity.x + randVelocity.y * randVelocity.y);
    var norm = { x: randVelocity.x / mag, y: randVelocity.y / mag };

    newBubbleObject.m_velocity = {
        x: 2,//norm.x * newBubbleObject.m_speed,
        y: 0// norm.x * newBubbleObject.m_speed
    }

    newBubbleObject.CallRemove = removeFn;

    newBubbleObject.Update = function () {

        if (this.m_state == 0) {
            //console.log("pos: " + this.m_position.x + ", " + this.m_position.y);
            //console.log("vel: " + this.m_velocity.x + ", " + this.m_velocity.y);
            var new_timeStamp = new Date().getTime();
            if (this.m_timeStamp + 2000 < new_timeStamp) {
                this.m_timeStamp = new_timeStamp;
                this.m_size += 1;
            }

            //console.log("Updateing bubble " + this.m_id);
            this.m_position.x += this.m_velocity.x;
            this.m_position.y += this.m_velocity.y;
        }
        else if (this.m_state == 1) {
            var new_timeStamp = new Date().getTime();
            if (this.m_timeStamp + 10 < new_timeStamp) {
                this.m_timeStamp = new_timeStamp;
                this.m_size += 50;
            }
            if (this.m_timeStampDeath + 50 < this.m_timeStamp) {
                this.m_state = 2;
            }
        }
        else if (this.m_state == 2) {
            this.CallRemove();
        }
    }

    newBubbleObject.CorrectSpeed = function () {
        var mag = Math.sqrt(this.m_velocity.x * this.m_velocity.x + this.m_velocity.y * this.m_velocity.y);
        var norm = { x: this.m_velocity.x / mag, y: this.m_velocity.y / mag };

        this.m_velocity.x = norm.x * this.m_speed;
        this.m_velocity.y = norm.y * this.m_speed;
    }

    return newBubbleObject;
}

function BubbleResizeBounds(bubble, startAreaBounds) {
    bubble.m_startAreaBounds = startAreaBounds;

    if (bubble.m_position.x + bubble.m_size >= bubble.m_startAreaBounds.xMax) {
        bubble.m_position.x = bubble.m_startAreaBounds.xMax - bubble.m_size;
    }
    else if (bubble.m_position.x - bubble.m_size <= bubble.m_startAreaBounds.xMin) {
        bubble.m_position.x = bubble.m_startAreaBounds.xMin + bubble.m_size;
    }

    if (bubble.m_position.y + bubble.m_size >= bubble.m_startAreaBounds.yMax) {
        bubble.m_position.y = bubble.m_startAreaBounds.yMax - bubble.m_size;
    }
    else if (bubble.m_position.y - bubble.m_size <= bubble.m_startAreaBounds.yMin) {
        bubble.m_position.y = bubble.m_startAreaBounds.yMin + bubble.m_size;
    }
}

function ChangeDirection(mousePos, bubble) {
    bubble.m_velocity = {
        x: mousePos.x,
        y: mousePos.y
    };
    bubble.CorrectSpeed();
}

function ReachedGoalLine(bubble, goalLineId) {
    var nextGoalId = (bubble.m_goalStateId + 1) % 4
    console.log("Checking goal: " + goalLineId + ", and looking for" + nextGoalId);
    if (nextGoalId == goalLineId) {
        bubble.m_goalStateId = nextGoalId;
        bubble.m_points += 25;
    }
}

module.exports.CreateBubbleObject = CreateBubbleObject;
module.exports.BubbleResizeBounds = BubbleResizeBounds;
module.exports.ChangeDirection = ChangeDirection;
module.exports.ReachedGoalLine = ReachedGoalLine;