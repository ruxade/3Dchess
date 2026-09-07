"""Decimate the chess set and export light glTF binaries.

Run from the repo root (takes a few minutes):

    /Applications/Blender.app/Contents/MacOS/Blender -b --python tools/decimate.py -- design/models/fbx public/models/set/glb

Optional third argument: a comma-separated subset, e.g. "pawn,rook".

What it does per piece:
1. import the FBX, apply the exporter's -90 degree tilt and scale
2. Decimate (collapse) down to a triangle budget that still reads as sculpture
3. smooth shading by angle so the low-poly surface does not look faceted
4. recentre: base at z = 0, centred on x and y
5. scale everything by ONE factor so the pawn is 1.19 world units tall,
   exactly the size the game showed with the FBX files at scale 0.02
6. export .glb, no materials (the game assigns matcaps), Y up
"""
import bpy, sys, os, math

argv = sys.argv[sys.argv.index('--') + 1:]
src_dir, out_dir = argv[0], argv[1]
only = argv[2].split(',') if len(argv) > 2 else None
os.makedirs(out_dir, exist_ok=True)

# None keeps every triangle of the source (the knight loses its face under any budget, the pawn its edges).
TRIANGLE_BUDGET = {'pawn': None, 'rook': 5000, 'knight': None, 'bishop': 9000, 'queen': 14000, 'king': 14000}
PAWN_WORLD_HEIGHT = 1.19   # measured in the game with FBX at scale 0.02

def bbox(me):
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)

def load(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.join(src_dir, f'{name}.fbx'))
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    obj = meshes[0]
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj

# One global scale factor, derived from the pawn, so relative sizes stay exact.
pawn = load('pawn')
_, _, _, _, z0, z1 = bbox(pawn.data)
FACTOR = PAWN_WORLD_HEIGHT / (z1 - z0)
print(f'[decimate] pawn import height {z1 - z0:.4f}, world factor {FACTOR:.4f}')

for name, budget in TRIANGLE_BUDGET.items():
    if only and name not in only:
        continue
    obj = load(name)
    me = obj.data
    tris_before = sum(len(p.vertices) - 2 for p in me.polygons)

    if budget is not None and budget < tris_before:
        mod = obj.modifiers.new('decimate', 'DECIMATE')
        mod.ratio = budget / tris_before
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier='decimate')

    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    except Exception:
        bpy.ops.object.shade_smooth()

    x0, x1, y0, y1, z0, z1 = bbox(me)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    for v in me.vertices:
        v.co.x = (v.co.x - cx) * FACTOR
        v.co.y = (v.co.y - cy) * FACTOR
        v.co.z = (v.co.z - z0) * FACTOR

    obj.name = name
    me.name = name
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out_dir, f'{name}.glb'),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_materials='NONE',
        export_yup=True,
    )
    tris_after = sum(len(p.vertices) - 2 for p in me.polygons)
    print(f'[decimate] {name}: {tris_before} -> {tris_after} triangles, {len(me.vertices)} verts, height {(z1 - z0) * FACTOR:.3f}')
