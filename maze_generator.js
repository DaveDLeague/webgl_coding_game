var mazeGeneratorStack = [];

class MazeCell {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.northWall = true;
        this.southWall = true;
        this.eastWall = true;
        this.westWall = true;
        this.visited = false;
    }   
}

class Maze {
    constructor(w, h, seed){
        this.width = w;
        this.height = h;
        if(seed == 0){
            seed--;
        }
        this.seed = seed;
        this.cells = [];
        for(let i = 0; i < w; i++){
            this.cells[i] = [];
            for(let j = 0; j < h; j++){
                this.cells[i][j] = new MazeCell(i, j);
            }
        }
        this.startCell;
        this.endCell;
    }
}

function removeWalls(c1, c2){
    if(c1.x == c2.x){
        if(c1.y > c2.y){
            c1.northWall = false;
            c2.southWall = false;
        }else{
            c2.northWall = false;
            c1.southWall = false;
        }
    }else{
        if(c1.x > c2.x){
            c1.westWall = false;
            c2.eastWall = false;
        }else{
            c1.eastWall = false;
            c2.westWall = false;
        }
    }
}

function selectNextPath(maze, cell){
    cell.visited = true;
    let nbors = getUnvisitedCellNeighbors(maze, cell);
    if(nbors.length > 0){
        maze.seed = xorshift(maze.seed);
        let newCell = nbors[absoluteValue(maze.seed % nbors.length)];
        mazeGeneratorStack.push(newCell);

        removeWalls(cell, newCell);
        cell = newCell;
        selectNextPath(maze, cell);
    }else{
        if(mazeGeneratorStack.length > 0){
            cell = mazeGeneratorStack.pop();
            selectNextPath(maze, cell);
        }
    }
}

function generateMaze(numCols, numRows, seed = 1){
    let m = new Maze(numCols, numRows, seed);
    m.seed = xorshift(m.seed);
    let rx = absoluteValue(m.seed % numCols);
    m.seed = xorshift(m.seed);
    let ry = absoluteValue(m.seed % numRows);

    mazeGeneratorStack = [];

    let c = m.cells[rx][ry];
    selectNextPath(m, c);

    m.seed = xorshift(m.seed);
    let rv = absoluteValue(m.seed % 4);
    
    switch(rv){
        case 0:{
            m.startCell = m.cells[0][0];
            m.endCell = m.cells[numCols - 1][numRows - 1];
            break;
        }
        case 1:{
            m.startCell = m.cells[0][numRows - 1];
            m.endCell = m.cells[numCols - 1][0];
            break;
        }
        case 2:{
            m.startCell = m.cells[numCols - 1][0];
            m.endCell = m.cells[0][numRows - 1];
            break;
        }
        case 3:{
            m.startCell = m.cells[numCols - 1][numRows - 1];
            m.endCell = m.cells[0][0];
            break;
        }
    }
    
    return m;
} 

function getUnvisitedCellNeighbors(maze, cell){
    let x = cell.x;
    let y = cell.y;
    let w = maze.width - 1;
    let h = maze.height - 1;
    let nbors = [];
    if(x > 0){
        let n = maze.cells[x - 1][y]
        if(!n.visited){
            nbors.push(n);
        }
    }
    if(x < w){
        let n = maze.cells[x + 1][y]
        if(!n.visited){
            nbors.push(n);
        }
    }
    if(y > 0){
        let n = maze.cells[x][y - 1]
        if(!n.visited){
            nbors.push(n);
        }
    }
    if(y < h){
        let n = maze.cells[x][y + 1]
        if(!n.visited){
            nbors.push(n);
        }
    }

    return nbors;
}