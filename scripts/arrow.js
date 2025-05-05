
function DrawRightArrow(pos) {
    context.beginPath();
    context.moveTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x + 100, pos.y + m_worldOffset.y);
    context.lineTo(pos.x + m_worldOffset.x + 100, pos.y + m_worldOffset.y +20);
    context.lineTo(pos.x + m_worldOffset.x, pos.y + m_worldOffset.y +20);
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
    context.lineTo(pos.x + m_worldOffset.x + 20, pos.y + m_worldOffset.y +100);
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
    context.lineTo(pos.x + m_worldOffset.x + 20, pos.y + m_worldOffset.y -100);
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