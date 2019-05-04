class Model3D {
    constructor(ic, io){
        this.indexCount = ic;
        this.indexOffset = io;

        this.position = new Vector3();
        this.scale = new Vector3(1, 1, 1);
        this.orientation = new Quaternion(0, 0, 0, 1);

        this.albedoTexture;
    }

    static copy(cm){
        let m = new Model3D();
        m.indexCount = cm.indexCount;
        m.indexOffset = cm.indexOffset;
        m.position =  Vector3.copy(cm.position);
        m.scale =  Vector3.copy(cm.sclae);
        m.orientation =  Vector3.copy(cm.orientation);
        return m;
    }
};

class Texture2D {
    constructor(gl){
        this.gl = gl;
        this.textureID;
        this.index = Texture2D.counter();
    }

    static counter(){
        if(typeof this.count == 'undefined'){
            this.count = 0;
        }
        return this.count++;
    }

    initWithBytes(bytes, width, height, colorType){
        let gl = this.gl;
        switch(colorType){
            case "rgb":
            case "RGB":{
                this.textureID = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + this.index);
                gl.bindTexture(gl.TEXTURE_2D, this.textureID);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(bytes));
                break;
            }
            case "rgba":
            case "RGBA":{
                this.textureID = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + this.index);
                gl.bindTexture(gl.TEXTURE_2D, this.textureID);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(bytes));
                break;
            }
            default:{
                alert("Incompatible image type.");
                return;
            }
        }
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
}

class Renderer3D {
    constructor(canvas){
        let gl = canvas.getContext("webgl2");
        gl.clearColor(0.2, 0.4, 0.6, 1.0);
        let shader = this.compileShader(gl, document.getElementById("renderer3dVertexShaderID").text,
                                       document.getElementById("renderer3dFragmentShaderID").text);

        let instanceShader = this.compileShader(gl, document.getElementById("instanceRenderer3dVertexShaderID").text,
                                                document.getElementById("instanceRenderer3dFragmentShaderID").text);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    
        gl.useProgram(shader);
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, 0, gl.STATIC_DRAW);
        let ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 0, gl.STATIC_DRAW);

        let positionID = gl.getAttribLocation(shader, "position");
        let normalID = gl.getAttribLocation(shader, "normal");
        let uvID = gl.getAttribLocation(shader, "uvCoordinates");

        gl.enableVertexAttribArray(positionID);
        gl.enableVertexAttribArray(normalID);
        gl.enableVertexAttribArray(uvID);
        gl.vertexAttribPointer(positionID, 3, gl.FLOAT, gl.FALSE, 32, 0);
        gl.vertexAttribPointer(normalID, 3, gl.FLOAT, gl.FALSE, 32, 12);
        gl.vertexAttribPointer(uvID, 2, gl.FLOAT, gl.FALSE, 32, 24);

        let cameraMatrixID = gl.getUniformLocation(shader, "cameraMatrix");   
        let modelMatrixID = gl.getUniformLocation(shader, "modelMatrix");
        let lightPositionID = gl.getUniformLocation(shader, "lightPosition");
        let cameraPositionID = gl.getUniformLocation(shader, "cameraPosition");
        let albedoID = gl.getUniformLocation(shader, "albedoTex");

        let ivao = gl.createVertexArray();
        gl.bindVertexArray(ivao);

        let instanceMatrixBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceMatrixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, 4 * 16 * 15000, gl.DYNAMIC_DRAW);

        let instancePositionID = gl.getAttribLocation(instanceShader, "position");
        let instanceNormalID = gl.getAttribLocation(instanceShader, "normal");
        let instanceUVID = gl.getAttribLocation(instanceShader, "uvCoordinates"); 
        let instanceMatrixID = gl.getAttribLocation(instanceShader, "instanceMatrix");

        gl.enableVertexAttribArray(instancePositionID);
        gl.enableVertexAttribArray(instanceNormalID);
        gl.enableVertexAttribArray(instanceUVID);
        gl.enableVertexAttribArray(instanceMatrixID);
        gl.enableVertexAttribArray(instanceMatrixID + 1);
        gl.enableVertexAttribArray(instanceMatrixID + 2);
        gl.enableVertexAttribArray(instanceMatrixID + 3);
        gl.vertexAttribPointer(instancePositionID, 3, gl.FLOAT, gl.FALSE, 32, 0);
        gl.vertexAttribPointer(instanceNormalID, 3, gl.FLOAT, gl.FALSE, 32, 12);
        gl.vertexAttribPointer(instanceUVID, 2, gl.FLOAT, gl.FALSE, 32, 24);
        gl.vertexAttribPointer(instanceMatrixID, 4, gl.FLOAT, gl.FALSE, 16 * 4, 0);
        gl.vertexAttribPointer(instanceMatrixID + 1, 4, gl.FLOAT, gl.FALSE, 16 * 4, 4 * 4);
        gl.vertexAttribPointer(instanceMatrixID + 2, 4, gl.FLOAT, gl.FALSE, 16 * 4, 8 * 4);
        gl.vertexAttribPointer(instanceMatrixID + 3, 4, gl.FLOAT, gl.FALSE, 16 * 4, 12 * 4);
        gl.vertexAttribDivisor(instanceMatrixID, 1);
        gl.vertexAttribDivisor(instanceMatrixID + 1, 1);
        gl.vertexAttribDivisor(instanceMatrixID + 2, 1);
        gl.vertexAttribDivisor(instanceMatrixID + 3, 1);

        let instanceCameraMatrixID = gl.getUniformLocation(instanceShader, "cameraMatrix");
        let instanceLightPositionID = gl.getUniformLocation(instanceShader, "lightPosition");
        let instanceCameraPositionID = gl.getUniformLocation(instanceShader, "cameraPosition");
        let instanceAlbedoID = gl.getUniformLocation(instanceShader, "albedoTex");
        
        let t = [255, 255, 255, 255];
        let defaultColorTexture = new Texture2D(gl);
        defaultColorTexture.initWithBytes(t, 1, 1, "RGBA");


        this.gl = gl;
        this.vao = vao;
        this.ivao = ivao;
        this.vbo = vbo;
        this.ebo = ebo;
        this.instanceMatrixBuffer = instanceMatrixBuffer;
        this.shader = shader;
        this.instanceShader = instanceShader;
        this.positionID = positionID;
        this.normalID = normalID;
        this.uvID = uvID;
        this.cameraMatrixID = cameraMatrixID;
        this.modelMatrixID = modelMatrixID;
        this.lightPositionID = lightPositionID;
        this.cameraPositionID = cameraPositionID;

        this.instancePositionID = instancePositionID;
        this.instanceNormalID = instanceNormalID;
        this.instanceUVID = instanceUVID;
        this.instanceCameraMatrixID = instanceCameraMatrixID;
        this.instanceLightPositionID = instanceLightPositionID;
        this.instanceCameraPositionID = instanceCameraPositionID;
        this.instanceAlbedoID = instanceAlbedoID;

        this.defaultColorTexture = defaultColorTexture;
        this.albedoID = albedoID;

        this.totalVertexSize = 0;
        this.totalIndexSize = 0;
    }

    prepare(){
        let gl = this.gl;
        gl.useProgram(this.shader);
        gl.bindVertexArray(this.vao);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clear(gl.DEPTH_BUFFER_BIT);
    }

    prepareInstance(){
        this.gl.useProgram(this.instanceShader);
        this.gl.bindVertexArray(this.ivao);
    }

    setInstanceMatrixBuffer(matrices){
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixBuffer);
        let a = [];
        for(let i = 0; i < matrices.length; i++){
            for(let j = 0; j < 16; j++){
                a.push(matrices[i].m[j]);
            }
        }
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(a));
    }

    renderInstanceModel(model, totalInstances, camera){
        let gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + model.albedoTexture.index);
        gl.uniform1i(this.instanceAlbedoID, model.albedoTexture.index);
        gl.uniformMatrix4fv(this.instanceCameraMatrixID, gl.FALSE, camera.viewMatrix.m);
        gl.uniform3fv(this.instanceLightPositionID, camera.position.toArray());
        gl.uniform3fv(this.instanceCameraPositionID, camera.position.toArray());
        gl.drawElementsInstanced(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_INT, model.indexOffset, totalInstances);
    }

    renderModel(model, camera){
        let gl = this.gl;

        gl.activeTexture(gl.TEXTURE0 + model.albedoTexture.index);
        gl.uniform1i(this.albedoID, model.albedoTexture.index);
        
        gl.uniformMatrix4fv(this.cameraMatrixID, gl.FALSE, camera.viewMatrix.m);

        let m = new Matrix4();
        m.translate(model.position);
        m.scale(model.scale);
        m = Matrix4.multiply(m, model.orientation.toMatrix4());
        gl.uniformMatrix4fv(this.modelMatrixID, gl.FALSE, m.m);
        gl.uniform3fv(this.lightPositionID, camera.position.toArray());
        gl.uniform3fv(this.cameraPositionID, camera.position.toArray());
        gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_INT, model.indexOffset);
    }

    createModelWithData(vertices, indices){
        let gl = this.gl;

        let newVertSize = vertices.length * 4;
        let newIndSize = indices.length * 4;

        gl.bindVertexArray(this.vao);
        let nBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.totalVertexSize + newVertSize, gl.STATIC_DRAW);
        gl.bindBuffer(gl.COPY_READ_BUFFER, this.vbo);
        gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.ARRAY_BUFFER, 0, 0, this.totalVertexSize);
        gl.bufferSubData(gl.ARRAY_BUFFER, this.totalVertexSize, new Float32Array(vertices));
        gl.deleteBuffer(this.vbo);
        this.vbo = nBuf;
        gl.enableVertexAttribArray(this.positionID);
        gl.enableVertexAttribArray(this.normalID);
        gl.enableVertexAttribArray(this.uvID);
        gl.vertexAttribPointer(this.positionID, 3, gl.FLOAT, gl.FALSE, 32, 0);
        gl.vertexAttribPointer(this.normalID, 3, gl.FLOAT, gl.FALSE, 32, 12);
        gl.vertexAttribPointer(this.uvID, 2, gl.FLOAT, gl.FALSE, 32, 24);

        let iCtr = this.totalVertexSize / 32;
        for(let i = 0; i < indices.length; i++){
            indices[i] += iCtr;
        }

        nBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, nBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.totalIndexSize + newIndSize, gl.STATIC_DRAW);
        gl.bindBuffer(gl.COPY_READ_BUFFER, this.ebo);
        gl.copyBufferSubData(gl.COPY_READ_BUFFER, gl.ELEMENT_ARRAY_BUFFER, 0, 0, this.totalIndexSize);
        gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, this.totalIndexSize, new Uint32Array(indices));
        gl.deleteBuffer(this.ebo);
        this.ebo = nBuf;

        gl.bindVertexArray(this.ivao);
        gl.enableVertexAttribArray(this.instancePositionID);
        gl.enableVertexAttribArray(this.instanceNormalID);
        gl.enableVertexAttribArray(this.instanceUVID);
        gl.vertexAttribPointer(this.instancePositionID, 3, gl.FLOAT, gl.FALSE, 32, 0);
        gl.vertexAttribPointer(this.instanceNormalID, 3, gl.FLOAT, gl.FALSE, 32, 12);
        gl.vertexAttribPointer(this.instanceUVID, 2, gl.FLOAT, gl.FALSE, 32, 24);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);

        let m = new Model3D(indices.length, this.totalIndexSize);
        m.albedoTexture = this.defaultColorTexture;
        m.normalTexture = this.defaultNormalTexture;
        
        this.totalVertexSize += newVertSize;
        this.totalIndexSize += newIndSize;

        return m;
    }

    compileShader(gl, vs, fs){
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vs);
        gl.compileShader(vertShader);
        if(gl.getShaderInfoLog(vertShader).length > 0) console.log(gl.getShaderInfoLog(vertShader));
        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fs); 
        gl.compileShader(fragShader);
        if(gl.getShaderInfoLog(fragShader).length > 0) console.log(gl.getShaderInfoLog(fragShader));
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);
        return shaderProgram;
    }
};

