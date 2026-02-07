/**
 * Custom Sigma.js node programs for square, triangle, and diamond shapes.
 * Same vertex shader and process/render as node.fast; only fragment shader differs.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - sigma internal path
import { AbstractNodeProgram } from "sigma/rendering/webgl/programs/common/node";
import type { NodeDisplayData } from "sigma/types";
// @ts-ignore
import type { RenderParams } from "sigma/rendering/webgl/programs/common/program";
import { NODE_VERTEX_SHADER, NODE_FRAG_SQUARE, NODE_FRAG_DIAMOND, NODE_FRAG_TRIANGLE } from "./shaders";
import { floatColor } from "./floatColor";

const POINTS = 1;
const ATTRIBUTES = 4;

function createShapeProgram(fragmentShader: string) {
  return class extends AbstractNodeProgram {
    constructor(gl: WebGLRenderingContext, _renderer?: unknown) {
      super(gl, NODE_VERTEX_SHADER, fragmentShader, POINTS, ATTRIBUTES);
      this.bind();
    }

    process(data: NodeDisplayData, hidden: boolean, offset: number): void {
      const array = this.array;
      const i = offset * POINTS * ATTRIBUTES;
      if (hidden) {
        array[i] = 0;
        array[i + 1] = 0;
        array[i + 2] = 0;
        array[i + 3] = 0;
        return;
      }
      const color = floatColor(data.color);
      array[i] = data.x;
      array[i + 1] = data.y;
      array[i + 2] = data.size;
      array[i + 3] = color;
    }

    render(params: RenderParams): void {
      if (this.hasNothingToRender()) return;
      const gl = this.gl;
      const program = this.program;
      gl.useProgram(program);
      gl.uniform1f(this.ratioLocation, 1 / Math.sqrt(params.ratio));
      gl.uniform1f(this.scaleLocation, params.scalingRatio);
      gl.uniformMatrix3fv(this.matrixLocation, false, params.matrix);
      gl.drawArrays(gl.POINTS, 0, this.array.length / ATTRIBUTES);
    }
  };
}

export const NodeSquareProgram = createShapeProgram(NODE_FRAG_SQUARE);
export const NodeTriangleProgram = createShapeProgram(NODE_FRAG_TRIANGLE);
export const NodeDiamondProgram = createShapeProgram(NODE_FRAG_DIAMOND);
