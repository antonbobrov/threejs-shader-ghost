varying vec2 vUv;

uniform float u_aspect;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_radius;
uniform float u_angle;
uniform float u_mouthSize;
uniform float u_eyeSize;
uniform float u_gradient;

float fbm(vec2 p, float time, float amp) {
  float sum = 0.0;
  float scale = 1.0;

  for (int i = 0; i < 3; i++) {
    sum += snoise(vec3(p * scale, time)) / amp;
    amp *= 0.9;
    scale *= 1.5;
  }

  return sum;
}

mat2 rotate(float angle) {
  return mat2(
    cos(angle), - sin(angle),
    sin(angle), cos(angle)
  );
}

vec2 normalizeAndRotate(vec2 coord) {
  coord -= vec2(0.5);
  coord = rotate(u_angle) * coord;
  coord = coord + vec2(0.5);
  
  coord.x *= u_aspect;

  return coord;
}

float circle(vec2 coord, vec2 center, float radius, float gradient) {
  float dist = distance(coord, center);  
  float value = 1.0 - smoothstep(radius, radius + gradient, dist);

  return value;
}

void main() { 
  vec2 uv = normalizeAndRotate(vUv);

  vec2 center = normalizeAndRotate(u_mouse);

  float gradient = u_radius * u_gradient;

  float head = circle(uv, center, u_radius, gradient);
  
  float leftEye = circle(uv, center - vec2(u_radius * 0.35, u_radius * -0.4), u_radius * u_eyeSize, gradient);
  float rightEye = circle(uv, center - vec2(u_radius * -0.35, u_radius * -0.4), u_radius * u_eyeSize, gradient);
  
  float mouth = circle(uv, center, u_radius * u_mouthSize, gradient) / uv.y;

  float noise = fbm(uv, u_time, 16.0);
  float noiseIntensity = min((center.y - uv.y) / u_radius * 0.5, 1.0);
  vec2 distortedUv = uv + noise * noiseIntensity;

  vec2 blCoord = vec2(center.x - u_radius, center.y - u_radius * 2.0);
  vec2 bl = smoothstep(blCoord, blCoord + vec2(gradient), distortedUv);
  
  vec2 trCoord = vec2(-center.x + (1.0 - u_radius), 1.0 - center.y);
  vec2 tr = smoothstep(trCoord, trCoord + vec2(gradient), 1.0 - distortedUv);

  float body = bl.x * bl.y * tr.x * tr.y;

  vec3 color = vec3(min(head + body, 1.0) - leftEye - rightEye - mouth);

  gl_FragColor = vec4(color, 1.0);
}
