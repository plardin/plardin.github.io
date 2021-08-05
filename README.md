# Voronoi Diagram of Points in 2D on a Planar Datum

Implements the iterative algorithm for the construction of Voronoi diagrams, using the quadedge data structure introduced in _"Primitives for the manipulation of general subdivisions and the computation of Voronoi diagrams", L. Guibas, J. Stolfi, 1983._
You can find this paper on [www.researchgate.net](https://www.researchgate.net/publication/221590183_Primitives_for_the_Manipulation_of_General_Subdivisions_and_the_Computation_of_Voronoi_Diagrams/link/5704096e08ae44d70ee05d8a/download)

Visit [https://plardin.github.io/](http://plardin.github.io) to play with this implementation:
* Click to add a point;
* Hit **\`d\`** to toggle the Delaunay triangulation on/off;
* Hit **\`v\`** to toggle the Voronoi diagram on/off;
* Hit **\`s\`** to toggle the Crust/Skeleton transform on/off;
* Hit **\`c\`** to toggle the Voronoi cursor on/off;

Once you've "reversed engineer" how the color scheme for the vertices works, you'll have figured out a lot of what's going on in there