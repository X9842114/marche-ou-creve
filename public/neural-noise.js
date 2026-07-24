function initNeuralNoise(canvas, opts) {
  if (!canvas) return null;

  opts = opts || {};
  const color = opts.color || [0.9, 0.2, 0.4];
  const opacity = opts.opacity != null ? opts.opacity : 0.95;
  const speed = opts.speed != null ? opts.speed : 0.001;

  const pointer = { x: 0, y: 0, tX: 0, tY: 0 };
  pointer.tX = window.innerWidth * 0.5;
  pointer.tY = window.innerHeight * 0.5;
  pointer.x = pointer.tX;
  pointer.y = pointer.tY;
  let gl;
  let uniforms;
  let shaderProgram;
  let rafId = 0;
  let running = true;

  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.opacity = String(opacity);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.opacity = String(Math.min(opacity, 0.35));
    return null;
  }

  gl = initShader();
  if (!gl) return null;

  const cleanupEvents = setupEvents();
  resizeCanvas();
  gl.uniform3f(uniforms.u_color, color[0], color[1], color[2]);
  gl.uniform1f(uniforms.u_speed, speed);
  render();

  window.addEventListener('resize', resizeCanvas);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !rafId) render();
    else if (!running && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  });

  return {
    destroy() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
      cleanupEvents();
    }
  };

  function initShader() {
    const vsSource = `
      precision mediump float;
      varying vec2 vUv;
      attribute vec2 a_position;
      void main() {
        vUv = 0.5 * (a_position + 1.0);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer_position;
      uniform vec3 u_color;
      uniform float u_speed;
      vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
      }
      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.0);
        vec2 res = vec2(0.0);
        float scale = 8.0;
        for (int j = 0; j < 15; j++) {
          uv = rotate(uv, 1.0);
          sine_acc = rotate(sine_acc, 1.0);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 2.4 * p;
          res += (0.5 + 0.5 * cos(layer)) / scale;
          scale *= 1.2;
        }
        return res.x + res.y;
      }
      void main() {
        vec2 uv = 0.5 * vUv;
        uv.x *= u_ratio;
        vec2 pointer = vUv - u_pointer_position;
        pointer.x *= u_ratio;
        float p = clamp(length(pointer), 0.0, 1.0);
        p = 0.5 * pow(1.0 - p, 2.0);
        float t = u_speed * u_time;
        vec3 col = vec3(0.0);
        float noise = neuro_shape(uv, t, p);
        noise = 1.2 * pow(noise, 3.0);
        noise += pow(noise, 10.0);
        noise = max(0.0, noise - 0.5);
        noise *= (1.0 - length(vUv - 0.5));
        col = u_color * noise;
        gl_FragColor = vec4(col, noise);
      }
    `;

    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return null;
    }

    const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return null;

    shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    if (!shaderProgram) return null;

    uniforms = getUniforms(gl, shaderProgram);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.useProgram(shaderProgram);
    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return gl;
  }

  function createShader(glContext, source, type) {
    const shader = glContext.createShader(type);
    glContext.shaderSource(shader, source);
    glContext.compileShader(shader);
    if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
      console.error('Shader compile error:', glContext.getShaderInfoLog(shader));
      glContext.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(glContext, vs, fs) {
    const program = glContext.createProgram();
    glContext.attachShader(program, vs);
    glContext.attachShader(program, fs);
    glContext.linkProgram(program);
    if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
      console.error('Program link error:', glContext.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  function getUniforms(glContext, program) {
    const u = {};
    const uniformCount = glContext.getProgramParameter(program, glContext.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformName = glContext.getActiveUniform(program, i).name;
      u[uniformName] = glContext.getUniformLocation(program, uniformName);
    }
    return u;
  }

  function render() {
    if (!running) return;
    rafId = requestAnimationFrame(render);
    const currentTime = performance.now();
    pointer.x += (pointer.tX - pointer.x) * 0.2;
    pointer.y += (pointer.tY - pointer.y) * 0.2;
    gl.useProgram(shaderProgram);
    gl.uniform1f(uniforms.u_time, currentTime);
    gl.uniform2f(uniforms.u_pointer_position, pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function resizeCanvas() {
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    if (uniforms && uniforms.u_ratio) {
      gl.useProgram(shaderProgram);
      gl.uniform1f(uniforms.u_ratio, canvas.width / canvas.height);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function setupEvents() {
    const updateMousePosition = (x, y) => {
      pointer.tX = x;
      pointer.tY = y;
    };
    const pointermove = e => updateMousePosition(e.clientX, e.clientY);
    const touchmove = e => {
      if (e.targetTouches[0]) updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    };
    const click = e => updateMousePosition(e.clientX, e.clientY);
    window.addEventListener('pointermove', pointermove);
    window.addEventListener('touchmove', touchmove, { passive: true });
    window.addEventListener('click', click);
    return () => {
      window.removeEventListener('pointermove', pointermove);
      window.removeEventListener('touchmove', touchmove);
      window.removeEventListener('click', click);
    };
  }
}

if (typeof window !== 'undefined') {
  window.initNeuralNoise = initNeuralNoise;
}
