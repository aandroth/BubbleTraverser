

function CreateSquareObject(id, pos, size, fallDirection, addChangedSquareFn) {
    var newSquareObject = {};
    newSquareObject.m_id = id;
    newSquareObject.m_color = "red";
    newSquareObject.m_size = { x: size.x, y: size.y};
    newSquareObject.m_position = { x: pos.x, y: pos.y };
    newSquareObject.m_fallDirection = fallDirection;
    newSquareObject.m_timeStamp = new Date().getTime();
    newSquareObject.AddChangedSquareFn = addChangedSquareFn;
    // 0: not spawned
    // 1: spawning in
    // 2: spawned in
    // 3: preparing to fall
    // 4: falling
    newSquareObject.STATES = Object.freeze({
        NOT_SPAWNED:  0,
        SPAWNING:     1,
        IS_SPAWNED:   2,
        PREP_FALLING: 3,
        IS_FALLING:   4
    });
    newSquareObject.m_state = 2;
    newSquareObject.m_spawnStopStart = 50;
    newSquareObject.m_spawnStop = 50;
    newSquareObject.m_sinMagnitude = 1;
    newSquareObject.m_sinTracking = 0;
    newSquareObject.m_spawningSpeed = 5;
    newSquareObject.m_shrinkingSpeed = 15;
    newSquareObject.m_fallingSpeed = 100;
    newSquareObject.m_startingPos = { x: pos.x, y: pos.y };
    newSquareObject.m_startingSize = { x: size.x, y: size.y };

    newSquareObject.Bump = function () {
        if (this.m_state == this.STATES.NOT_SPAWNED) {
            this.m_state = this.STATES.SPAWNING;
        }
        else if (this.m_state == this.STATES.IS_SPAWNED) {
            this.m_state = this.STATES.PREP_FALLING;
        }
    }

    newSquareObject.Update = function () {

        var newTimeStamp = new Date().getTime();
        var deltaTime = (newTimeStamp - this.m_timeStamp) * 0.001;
        this.m_timeStamp = newTimeStamp;

        if (this.m_state == this.STATES.NOT_SPAWNED) {
            this.m_state = this.STATES.SPAWNING;
        }
        else if (this.m_state == this.STATES.SPAWNING) {
            //console.log("SPAWNING: " + this.m_size.x + ", " + this.m_size.y);
            //console.log("SPAWNING to: " + this.m_startingSize.x + ", " + this.m_startingSize.y);
            this.m_size.x += this.m_shrinkingSpeed * 2 * deltaTime;
            this.m_size.y += this.m_shrinkingSpeed * 2 * deltaTime;
            if (this.m_size.x > this.m_startingSize.x) {
                this.m_size.x = this.m_startingSize.x;
                this.m_size.y = this.m_startingSize.y;
                this.m_state = this.STATES.IS_SPAWNED;
                this.m_sinTracking = 0;
                //console.log("SPAWNED: " + this.m_size.x + ", " + this.m_size.y);
                return;
            }
            this.m_sinTracking += deltaTime;
            this.AddChangedSquareFn(this);
        }
        else if (this.m_state == this.STATES.IS_SPAWNED) {
            // DO NOTHING
        }
        else if (this.m_state == this.STATES.PREP_FALLING) {
            this.m_position.x = (Math.sin(this.m_sinTracking * 20) * 2) * this.m_sinMagnitude + this.m_startingPos.x;
            this.m_position.y = (Math.sin(this.m_sinTracking * 20) * 2) * this.m_sinMagnitude + this.m_startingPos.y;
            this.m_spawnStop -= this.m_spawningSpeed * deltaTime;
            if (this.m_spawnStop <= 0) {
                this.m_state = this.STATES.IS_FALLING;
                this.m_sinTracking = 0;
                this.m_spawnStop = this.m_spawnStopStart;
                return;
            }
            this.m_sinTracking += deltaTime;
            this.AddChangedSquareFn(this);
        }
        else { // (this.m_state == this.STATES.IS_FALLING)
            //console.log("FALLING: " + this.m_size.x + ", " + this.m_size.y);
            this.m_position.x += this.m_fallingSpeed * deltaTime * this.m_fallDirection.x;
            this.m_position.y += this.m_fallingSpeed * deltaTime * this.m_fallDirection.y;
            this.m_size.x -= this.m_shrinkingSpeed * deltaTime;
            this.m_size.y -= this.m_shrinkingSpeed * deltaTime;
            if (this.m_size.x <= 0) {
                this.m_size = { x: 0, y: 0 };
                this.m_position.x = this.m_startingPos.x;
                this.m_position.y = this.m_startingPos.y;
                this.m_state = this.STATES.NOT_SPAWNED;
            }
            this.AddChangedSquareFn(this);
        }
    }
    return newSquareObject;
}

module.exports.CreateSquareObject = CreateSquareObject;