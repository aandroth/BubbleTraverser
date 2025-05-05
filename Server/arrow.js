

function CreateArrowObject(id, pos, directionState) {
    var newArrowObject = {};
    newArrowObject.m_id = id;
    newArrowObject.m_position = { x: pos.x, y: pos.y };
    newArrowObject.STATES = Object.freeze({
        RIGHT: 0,
        LEFT: 1,
        UP: 2,
        DOWN: 3
    });
    newArrowObject.m_state = directionState;

    return newArrowObject;
}

module.exports.CreateArrowObject = CreateArrowObject;