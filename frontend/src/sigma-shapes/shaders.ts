/**
 * Shared vertex shader for Sigma node programs (same as node.fast).
 * gl_PointCoord is used in fragment to draw shape.
 */
export const NODE_VERTEX_SHADER = `
attribute vec2 a_position;
attribute float a_size;
attribute vec4 a_color;

uniform float u_ratio;
uniform float u_scale;
uniform mat3 u_matrix;

varying vec4 v_color;
varying float v_border;

const float bias = 255.0 / 254.0;

void main() {
  gl_Position = vec4(
    (u_matrix * vec3(a_position, 1)).xy,
    0,
    1
  );

  gl_PointSize = a_size * u_ratio * u_scale * 2.0;

  v_border = (1.0 / u_ratio) * (0.5 / a_size);

  v_color = a_color;
  v_color.a *= bias;
}
`;

const FRAG_HEAD = `
precision mediump float;

varying vec4 v_color;
varying float v_border;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  vec2 m = gl_PointCoord - vec2(0.5, 0.5);
  float dist;
`;

const FRAG_TAIL = `
  float t = 0.0;
  if (dist > v_border)
    t = 1.0;
  else if (dist > 0.0)
    t = dist / v_border;

  gl_FragColor = mix(transparent, v_color, t);
}
`;

/** Square: inside when max(|x|,|y|) < 0.5 */
export const NODE_FRAG_SQUARE = FRAG_HEAD + `
  dist = 0.5 - max(abs(m.x), abs(m.y));
` + FRAG_TAIL;

/** Diamond: inside when |x|+|y| < 0.5 */
export const NODE_FRAG_DIAMOND = FRAG_HEAD + `
  dist = 0.5 - (abs(m.x) + abs(m.y));
` + FRAG_TAIL;

/** Triangle (up): half-planes for (0,0.5), (-0.5,-0.5), (0.5,-0.5) */
export const NODE_FRAG_TRIANGLE = FRAG_HEAD + `
  float d1 = m.y + 0.5;
  float d2 = m.x + (m.y + 0.5) * 0.5;
  float d3 = -m.x + (m.y + 0.5) * 0.5;
  dist = min(min(d1, d2), d3);
` + FRAG_TAIL;
