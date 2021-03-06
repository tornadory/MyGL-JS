import MaterialResolver from "./MaterialResolver";
import RenderContext from "../../RenderContext";
import Mesh from "../../core/Mesh";
import Geometry from "../../primitives/Geometry";
import GLProgramLib from "../../shaders/GLProgramLib";
import ShaderUtil from "../../utils/ShaderUtil";
import AssetsManager from "../../managers/AssetsManager";
import CubeMapMaterial from "../CubeMapMaterial";
import UniformUtil from "../../utils/UniformUtil";
import Camera from "../../cameras/Camera";
/**
 * Created by yaozh on 2017/7/6.
 */
export default class CubeMapMaterialResolver extends MaterialResolver
{
    public initMeshData():void
    {
        let gl:WebGLRenderingContext = RenderContext.context;
        let mesh:Mesh = this._mesh;
        let geometry:Geometry = mesh.geometry;

        let glProgram:WebGLProgram;
            glProgram = GLProgramLib.getProgram(this._material.type);
            if (!glProgram)
        {
            glProgram = ShaderUtil.createProgram(gl,
                AssetsManager.getInstance().getAsset('cube_mat_vshader'),
                AssetsManager.getInstance().getAsset('cube_mat_fshader'));
            GLProgramLib.addProgram(this._material.type, glProgram);
        }

        mesh.usedProgram = glProgram;
        //gl.useProgram(mesh.usedProgram);
        mesh.a_Position = gl.getAttribLocation(glProgram, 'a_Position');
        mesh.vertexBuffer = mesh.createArrayBuffer(geometry.vertexPositions);
        mesh.indexBuffer = mesh.createIndexBuffer();
    }

    public resetAttribsAndUniforms():void
    {
        let mesh:Mesh = this._mesh;

        let gl:WebGLRenderingContext = RenderContext.context;
        gl.useProgram(mesh.usedProgram);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);

        UniformUtil.setProgrom(mesh.usedProgram);

        let camera:Camera = mesh.scene.currentCamera;

        //Model-View-Projection
        mesh.updateWorldMatrix();
        camera.updateWorldMatrix();
        mesh.modelViewMatrix.multiplyMatrices(camera.inverseWorldMatrix, mesh.worldMatrix);
        mesh.modelViewMatrix.premultiply(camera.projMatrix);

        UniformUtil.assignMatrix4fv('u_MvpMatrix', false, mesh.modelViewMatrix.elements);

        let colorMat:CubeMapMaterial = <CubeMapMaterial>(this._material);

        UniformUtil.setProgrom(mesh.usedProgram);
        UniformUtil.assign1i('texMap', 0);
        colorMat.textureCude.setTextureAttribute();

        let geometry:Geometry = mesh.geometry;

        mesh.setBufferAttribute(mesh.vertexBuffer, mesh.a_Position, geometry.vertexPosNum, gl.FLOAT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    }
}