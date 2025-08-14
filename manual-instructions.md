This is a V2 (frequency-2) geodesic dome. 

## V2 Geodesic Dome Algorithm:

1. **Define Edge Lengths**
   - SHORT = 90mm, LONG = 106mm for 450mm diameter
   - Two distinct edge types from icosahedral subdivision

2. **Generate Base Icosahedron**
   - Create 12 vertices using golden ratio coordinates
   - 20 triangular faces, 30 edges

3. **Apply Frequency-2 Subdivision**
   - Divide each icosahedral edge into 2 segments
   - Add midpoint vertices on each original edge
   - Each original triangular face becomes 4 smaller triangles
   - Total result: 42 vertices, 80 triangular faces

4. **Project to Sphere**
   - Project all vertices (original + subdivision points) onto unit sphere
   - Scale to target radius (225mm for 450mm diameter)

5. **Classify Edge Types**
   - Calculate distances between all connected vertex pairs
   - Shorter distances → SHORT edges (90mm)
   - Longer distances → LONG edges (106mm)
   - Two distinct lengths emerge from spherical projection

6. **Hub Classification**
   - Original icosahedral vertices: 6-way hubs
   - Edge midpoint vertices: 4-way hubs
   - Track which edge types connect at each hub

7. **Assembly Structure**
   - 80 triangular faces total
   - Mixed SHORT/LONG edge combinations per triangle
   - Pentagonal and hexagonal patterns around hubs

The V2 subdivision creates the two edge lengths naturally through spherical geometry.
