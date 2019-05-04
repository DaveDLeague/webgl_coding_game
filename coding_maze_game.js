const MENU_STATE = 0;
const CODE_EDIT_STATE = 1;
const CODE_RUN_STATE = 2;

const GRAVITY = 0.01;

var currentState = MENU_STATE;

var windowWidth;
var windowHeight;

var body;
var codePanel;
var codeButtonPanel;
var buttonPanel;
var canvas;
var renderer;

var runStopButton;
var undoButton;

var codeCommandList = [];
var currentExecutingCommand = 0;

var intervalTimer;

var camera;
var cameraHeight = 0;

var startTime = 0;
var endTime = 0;
var deltaTime = 0;

var ballObject;
var wallObject;
var floorObject;
var goalObject;

var maze;
var totalWalls = 0;

var programCurrentlyRunning = false;
var ballVelocity = new Vector3(0.1, 0.1, 0);
var targetPosition;
var mazeStartPosition;
var currentTravelingDirection;
var currentCell;
var destinationCell;

var bumpWall = false;
var initialCellPosition;

window.onload = function(){
    windowWidth = window.innerWidth * 0.97;
    windowHeight = window.innerHeight * 0.97;

    window.addEventListener("resize", adjustFrameSize);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("wheel", mouseScroll);


    body = document.getElementById("bodyID");
    let b = new CustomButton("Click Here To Begin");
    b.element.onclick = setup;
    body.appendChild(b.element);
    
    //TEMP
    setup();
}

function setupButtonPanel(){
    buttonPanel.innerHTML = "";
    codeButtonPanel.innerHTML = "";

    let b = document.createElement("button");
    b.style.width = "25%";
    b.style.height = "100%";
    b.style.fontSize = "200%";
    b.onclick = function(){
        addCodeToCodePanel("up");
    }
    b.innerHTML = "Move Up";
    codeButtonPanel.appendChild(b);
    b = document.createElement("button");
    b.style.width = "25%";
    b.style.height = "100%";
    b.style.fontSize = "200%";
    b.onclick = function(){
        addCodeToCodePanel("down");
    }
    b.innerHTML = "Move Down";
    codeButtonPanel.appendChild(b);
    b = document.createElement("button");
    b.style.width = "25%";
    b.style.height = "100%";
    b.style.fontSize = "200%";
    b.onclick = function(){
        addCodeToCodePanel("left");
    }
    b.innerHTML = "Move Left";
    codeButtonPanel.appendChild(b);
    b = document.createElement("button");
    b.style.width = "25%";
    b.style.height = "100%";
    b.style.fontSize = "200%";
    b.onclick = function(){
        addCodeToCodePanel("right");
    }
    b.innerHTML = "Move Right";
    codeButtonPanel.appendChild(b);

    runButton = document.createElement("button");
    runButton.onclick = runProgram;
    runButton.innerHTML = "Run Program";
    runButton.style.width = "100%";
    runButton.style.height = "50%"
    runButton.style.fontSize = "200%";
    buttonPanel.appendChild(runButton);

    undoButton = document.createElement("button");
    undoButton.onclick = undoLastCommand;
    undoButton.innerHTML = "Undo Last Command";
    undoButton.style.top = runButton.style.top + runButton.style.height;
    undoButton.style.width = "100%";
    undoButton.style.height = "50%";
    undoButton.style.fontSize = "200%";
    buttonPanel.appendChild(undoButton);
}

function undoLastCommand(){
    codeCommandList.pop();
    updateCodePanel();
}

function addCodeToCodePanel(dir){
    codeCommandList.push(dir);
    updateCodePanel();
}

function updateCodePanel(){
    codePanel.innerHTML = "";
    for(let i = 0; i < codeCommandList.length; i++){
        let c = document.createElement("div");
        c.style.fontSize = "200%";
        switch(codeCommandList[i]){
            case "up":{
                c.innerHTML += "ball.moveUp();";
                break;
            }
            case "down":{
                c.innerHTML += "ball.moveDown();";
                break;
            }
            case "left":{
                c.innerHTML += "ball.moveLeft();";
                break;
            }
            case "right":{
                c.innerHTML += "ball.moveRight();";
                break;
            }
        }
        codePanel.appendChild(c);
    }
}

function disableCodeButtons(en){
    let bs = codeButtonPanel.childNodes;
    for(let i = 0; i < bs.length; i++){
        bs[i].disabled = en;
    }
}

function getNextTargetPosition(){
    if(codeCommandList.length == currentExecutingCommand) {
        stopProgram();    
        return;
    }

    let codes = codePanel.childNodes;
    if(currentExecutingCommand > 0){
        codes[currentExecutingCommand - 1].style.background = "transparent";
    }
    codes[currentExecutingCommand].style.background = "green";

    //currentCell = destinationCell;
    currentTravelingDirection = codeCommandList[currentExecutingCommand];
    switch(currentTravelingDirection){
        case "up":{
            if(currentCell.southWall){
                targetPosition = new Vector3(ballObject.position.x, 0, ballObject.position.z + 0.5);
                destinationCell = maze.cells[currentCell.x][currentCell.y];
                bumpWall = true;
                initialCellPosition = new Vector3(ballObject.position.x, ballObject.position.y, ballObject.position.z);
            }else{
                targetPosition = new Vector3(ballObject.position.x, 0, ballObject.position.z + 1);
                destinationCell = maze.cells[currentCell.x][currentCell.y + 1];
            }
            break;
        }
        case "down":{
            if(currentCell.northWall){
                targetPosition = new Vector3(ballObject.position.x, 0, ballObject.position.z - 0.5);
                destinationCell = maze.cells[currentCell.x][currentCell.y];
                bumpWall = true;
                initialCellPosition = new Vector3(ballObject.position.x, ballObject.position.y, ballObject.position.z);
            }else{
                targetPosition = new Vector3(ballObject.position.x, 0, ballObject.position.z - 1);
                destinationCell = maze.cells[currentCell.x][currentCell.y - 1];
            }
            break;
        }
        case "left":{
            if(currentCell.eastWall){
                targetPosition = new Vector3(ballObject.position.x + 0.5, 0, ballObject.position.z);
                destinationCell = maze.cells[currentCell.x][currentCell.y];
                bumpWall = true;
                initialCellPosition = new Vector3(ballObject.position.x, ballObject.position.y, ballObject.position.z);
            }else{
                targetPosition = new Vector3(ballObject.position.x + 1, 0, ballObject.position.z);
                destinationCell = maze.cells[currentCell.x + 1][currentCell.y];
            }
            break;
        }
        case "right":{
            if(currentCell.westWall){
                targetPosition = new Vector3(ballObject.position.x - 0.5, 0, ballObject.position.z);
                destinationCell = maze.cells[currentCell.x][currentCell.y];
                bumpWall = true;
                initialCellPosition = new Vector3(ballObject.position.x, ballObject.position.y, ballObject.position.z);
            }else{
                targetPosition = new Vector3(ballObject.position.x - 1, 0, ballObject.position.z);
                destinationCell = maze.cells[currentCell.x - 1][currentCell.y];
            }
            break;
        }
    }
    currentExecutingCommand++;
}

function runProgram(){
    ballObject.position.x = mazeStartPosition.x;
    ballObject.position.y = mazeStartPosition.y;
    ballObject.position.z = mazeStartPosition.z;

    let codes = codePanel.childNodes;
    for(let i = 0; i < codes.length; i++){
        codes[i].style.background = "transparent";
    }

    currentExecutingCommand = 0;

    runButton.innerHTML = "Stop Program";
    runButton.onclick = stopProgram;

    undoButton.disabled = true;
    disableCodeButtons(true);

    programCurrentlyRunning = true;
    currentCell = maze.startCell;
    getNextTargetPosition();
}

function stopProgram(){
    runButton.innerHTML = "Run Program";
    runButton.onclick = runProgram;
    undoButton.disabled = false;
    disableCodeButtons(false);
    programCurrentlyRunning = false;
}

function setup(){
    currentState = CODE_EDIT_STATE;
    body.innerHTML = "";
    codePanel = document.createElement("div");
    codePanel.style.position = "absolute";
    codePanel.style.left = 0;
    codePanel.style.top = 0;
    codePanel.style.width = windowWidth / 3;
    codePanel.style.height = windowHeight / 1.5;
    codePanel.style.borderStyle = "solid";
    body.appendChild(codePanel);

    codeButtonPanel = document.createElement("div");
    codeButtonPanel.style.position = "absolute";
    codeButtonPanel.style.left = 0;
    codeButtonPanel.style.top = (windowHeight / 1.5) + 10;
    codeButtonPanel.style.width = windowWidth - (windowWidth / 3);
    codeButtonPanel.style.height = windowHeight - (windowHeight / 1.5);
    codeButtonPanel.style.borderStyle = "solid";
    body.appendChild(codeButtonPanel);

    buttonPanel = document.createElement("div");
    buttonPanel.style.position = "absolute";
    buttonPanel.style.left = windowWidth - (windowWidth / 3) + 10;
    buttonPanel.style.top = (windowHeight / 1.5) + 10;
    buttonPanel.style.width = (windowWidth / 3);
    buttonPanel.style.height = windowHeight - (windowHeight / 1.5);
    buttonPanel.style.borderStyle = "solid";
    body.appendChild(buttonPanel);

    canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.left = (windowWidth / 3) + 10;
    canvas.style.top = 0;
    canvas.width = windowWidth - (windowWidth / 3);
    canvas.height = windowHeight / 1.5;
    canvas.style.borderStyle = "solid";
    body.appendChild(canvas);

    setupButtonPanel();

    renderer = new Renderer3D(canvas);

    let verts = [];
    let inds = [];
    generateUVSphereIndexedWithNormalsTexCoords(verts, inds, 16);
    ballObject = renderer.createModelWithData(verts, inds);
    let ct = new Texture2D(renderer.gl);
    ct.initWithBytes(ballImage, 32, 32, "RGB");
    ballObject.albedoTexture = ct;
    ballObject.scale = new Vector3(0.5, 0.5, 0.5);

    verts = [];
    inds = [];
    generateUnitCubeVerticesIndexedWithNormalsTexCoords(verts, inds);
    floorObject = renderer.createModelWithData(verts, inds);

    verts = [];
    inds = [];
    generateIcoSphereVerticesIndexedWithNormalsTexCoords(verts, inds);
    goalObject = renderer.createModelWithData(verts, inds);
    goalObject.scale = new Vector3(0.5, 0.5, 0.5);

    wallObject = new Model3D();
    wallObject.indexCount = floorObject.indexCount;
    wallObject.indexOffset = floorObject.indexOffset;
    ct = new Texture2D(renderer.gl);
    nt = new Texture2D(renderer.gl);
    ct.initWithBytes(wallImage, 256, 256, "RGB");
    wallObject.albedoTexture = ct;

    camera = new Camera();
    camera.setPerspectiveProjection(70.0, canvas.width / canvas.height, 0.001, 1000.0);


    maze = generateMaze(3, 2, randomInteger(999999));
    let hw = maze.width * 0.5;
    let hh = maze.height * 0.5;
    floorObject.scale = new Vector3(maze.width, 0.1, maze.height);
    floorObject.position = new Vector3(hw, -0.55, hh);

    walls = [];
    for(let i = 0; i < maze.width; i++){
        for(let j = 0; j < maze.height; j++){
            let cell = maze.cells[i][j];
            if(cell.westWall){
                let m = new Matrix4();
                m.translate(new Vector3(i, 0, j + 0.5));
                m.scale(new Vector3(0.05, 1, 1));
                walls.push(m);
                totalWalls++;
            }
            if(cell.eastWall){
                let m = new Matrix4();
                m.translate(new Vector3(i + 1, 0, j + 0.5));
                m.scale(new Vector3(0.05, 1, 1));
                walls.push(m);
                totalWalls++;
            }
            if(cell.northWall){
                let m = new Matrix4();
                m.translate(new Vector3(i + 0.5, 0, j));
                m.scale(new Vector3(1, 1, 0.05));
                walls.push(m);
                totalWalls++;
            }
            if(cell.southWall){
                let m = new Matrix4();
                m.translate(new Vector3(i + 0.5, 0, j + 1));
                m.scale(new Vector3(1, 1, 0.05));
                walls.push(m);
                totalWalls++;
            }
        }
    }

    cameraHeight = maze.width < maze.height ? maze.width : maze.height;
    cameraHeight++;

    renderer.setInstanceMatrixBuffer(walls);
    mazeStartPosition = new Vector3(maze.startCell.x + 0.5, 0, maze.startCell.y + 0.5);
    ballObject.position = new Vector3(maze.startCell.x + 0.5, 0, maze.startCell.y + 0.5);
    goalObject.position = new Vector3(maze.endCell.x + 0.5, 0, maze.endCell.y + 0.5);

    startTime = new Date().getTime();
    intervalTimer = setInterval(drawFrame, 1000 / 60);
}

function drawFrame(){
    if(camera.moveForward) cameraHeight -= deltaTime;
    if(camera.moveBack) cameraHeight += deltaTime;
    if(cameraHeight <= 0) cameraHeight = 0;

    if(programCurrentlyRunning){
        let dir = Vector3.sub(targetPosition, ballObject.position);
        if(dir.length() > 0.01){
            ballObject.position.add(Vector3.scale(Vector3.normal(dir), deltaTime));
        }else{
            if(bumpWall){
                targetPosition = initialCellPosition;
                bumpWall = false;
            }else{
                ballObject.position = targetPosition;
                currentCell = destinationCell;
                if(currentCell.x == maze.endCell.x && currentCell.y == maze.endCell.y){
                    console.log("WINNER!!");
                }
                getNextTargetPosition();
            }
        }
    }else{

    }

    goalObject.orientation.rotate(new Vector3(Math.random(), Math.random(), Math.random()), deltaTime);
    // camera.updateView(deltaTime * 2);
    camera.lookAt(new Vector3(maze.width / 2, cameraHeight, 0), new Vector3(maze.width / 2, 0, maze.height / 2), new Vector3(0, 1, 0));
    renderer.prepare();
    renderer.renderModel(ballObject, camera);
    renderer.renderModel(floorObject, camera);
    renderer.renderModel(goalObject, camera);

    renderer.prepareInstance();
    renderer.renderInstanceModel(wallObject, totalWalls, camera);


    endTime = new Date().getTime();  
    deltaTime = (endTime - startTime) / 1000.0;
    startTime = endTime;
}

function adjustFrameSize(){
    windowWidth = window.innerWidth * 0.97;
    windowHeight = window.innerHeight * 0.97;

    codePanel.style.left = 0;
    codePanel.style.top = 0;
    codePanel.style.width = windowWidth / 3;
    codePanel.style.height = windowHeight / 1.5;

    codeButtonPanel.style.left = 0;
    codeButtonPanel.style.top = (windowHeight / 1.5) + 10;
    codeButtonPanel.style.width = windowWidth - (windowWidth / 3);;
    codeButtonPanel.style.height = windowHeight - (windowHeight / 1.5);

    buttonPanel.style.left = (windowWidth - (windowWidth / 3)) + 10;
    buttonPanel.style.top = (windowHeight / 1.5) + 10;
    buttonPanel.style.width = (windowWidth / 3);
    buttonPanel.style.height = windowHeight - (windowHeight / 1.5);

    canvas.style.left = (windowWidth / 3) + 10;
    canvas.style.top = 0;
    canvas.width = windowWidth - (windowWidth / 3);
    canvas.height = windowHeight / 1.5;

    camera.setPerspectiveProjection(70.0, canvas.width / canvas.height, 0.001, 1000.0);
    setupButtonPanel();
    drawFrame();
}

function mouseScroll(event){
    cameraHeight += event.deltaY * 0.001;
}

function keyUp(event){ 
    switch(event.keyCode){
        case KEY_W:{
            camera.moveForward = false;
            break;
        }
        case KEY_A:{
            camera.moveLeft = false;
            break;
        }
        case KEY_S:{
            camera.moveBack = false;
            break;
        }
        case KEY_D:{
            camera.moveRight = false;
            break;
        }
        case KEY_R:{
            camera.moveUp = false;
            break;
        }
        case KEY_F:{
            camera.moveDown = false;
            break;
        }
        case KEY_UP:{
            camera.pitchUp = false;
            break;
        }
        case KEY_DOWN:{
            camera.pitchDown = false;
            break;
        }
        case KEY_LEFT:{
            camera.yawLeft = false;
            break;
        }
        case KEY_RIGHT:{
            camera.yawRight = false;
            break;
        }
        case KEY_Q:{
            camera.rollLeft = false;
            break;
        }
        case KEY_E:{
            camera.rollRight = false;
            break;
        }
    }
    
}

function keyDown(event){
    switch(event.keyCode){
        case KEY_W:{
            camera.moveForward = true;
            break;
        }
        case KEY_A:{
            camera.moveLeft = true;
            break;
        }
        case KEY_S:{
            camera.moveBack = true;
            break;
        }
        case KEY_D:{
            camera.moveRight = true;
            break;
        }
        case KEY_R:{
            camera.moveUp = true;
            break;
        }
        case KEY_F:{
            camera.moveDown = true;
            break;
        }
        case KEY_UP:{
            camera.pitchUp = true;
            break;
        }
        case KEY_DOWN:{
            camera.pitchDown = true;
            break;
        }
        case KEY_LEFT:{
            camera.yawLeft = true;
            break;
        }
        case KEY_RIGHT:{
            camera.yawRight = true;
            break;
        }
        case KEY_Q:{
            camera.rollLeft = true;
            break;
        }
        case KEY_E:{
            camera.rollRight = true;
            break;
        }
    }
}

class CustomButton{
    constructor(text, x = 0, y = 0){
        this.element = document.createElement("button");
        this.buttonText = text;
        this.x = x;
        this.y = y;
        this.element.style.position = "absolute";
        this.element.style.left = this.x;
        this.element.style.top = this.y;
        this.element.style.borderStyle = "outset";
        this.element.innerHTML = this.buttonText;
    }
}