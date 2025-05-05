

function CreateGoalLineObject(id, pos, size) {
    var newGoalLineObject = {};
    newGoalLineObject.m_id = id;
    newGoalLineObject.m_position = { x: pos.x, y: pos.y };
    newGoalLineObject.m_size = { x: size.x, y: size.y };

    return newGoalLineObject;
}

module.exports.CreateGoalLineObject = CreateGoalLineObject;