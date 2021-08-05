//===============
// Voronoi app
//===============

let canvas;
let context;
let canvas_div;
let outer_div;
const boundary = 10;
const canvas_width = 1000;
const canvas_height = 560;
let crust_skeleton_mode = false;
let voronoi_mode = false;
let delaunay_mode = false
let cursor_mode = false
let voronoi;
let voronoi_cursor;

function init() {
  setup();
  setInterval( run, 50 );
}

function setup() {
  outer_div = document.getElementById( 'outer' );
  canvas_div = document.getElementById( 'canvas_container' );
  canvas = document.getElementById( 'voronoi_canvas' );
  context = canvas.getContext( '2d' );

  document.onmousedown = on_mouse_down;
  document.onmousemove = on_mouse_move;
  document.onkeypress = on_key_press;

  voronoi = new Voronoi();
  const v0 = new Vertex( 0.0, -5000.0, true );
  const v1 = new Vertex( -10000.0, 5000.0, true );
  const v2 = new Vertex( 10000.0, 5000.0, true );
  voronoi.init_delaunay( v0, v1, v2 );
}

function run() {
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "rgba( 8, 8, 12, 0.65 )";
  context.fillRect( 0, 0, canvas_width, canvas_height );
  draw_voronoi( voronoi );
}

function draw_voronoi() {
  if( voronoi === null ) return;

  voronoi.edges.forEach( edge => draw_edge( edge ) );
  voronoi.vertices.forEach( vertex => draw_vertex( vertex ) );
  draw_cursor();
}

function draw_cursor() {
  if( typeof voronoi_cursor == "undefined") return;

  if( cursor_mode ){ voronoi_cursor.areas.forEach( area => draw_polygon( area ) ); }
  voronoi_cursor.vertices.forEach( vertex => draw_2D_vertex( vertex, 'yellow' ) );
  draw_2D_vertex( voronoi_cursor.nearest_neighbor, 'magenta' );
  draw_2D_vertex( voronoi_cursor.vertex, 'blue' );
}

function draw_polygon( area ) {
  if( area.length === 0 ) { return; }

  context.strokeStyle = 'brown';
  context.lineWidth = 2;
  context.beginPath();
  const v0 = area[ 0 ];
  context.moveTo( v0.x, v0.y );
  area.forEach( vtx => context.lineTo( vtx.x, vtx.y ) );
  context.lineTo( v0.x, v0.y );
  context.closePath();
  context.stroke();
}

function draw_vertex( vertex ) {
  draw_2D_vertex( vertex, 'green' );
}

function draw_2D_vertex( vertex, color ) {
  context.beginPath();
  context.arc( vertex.x, vertex.y, 3, 0, 2 * Math.PI, false );
  context.fillStyle = color;
  context.fill();
}

function draw_edge( edge ) {
  if( edge.is_infinite_edge() ){ return; }

  if( delaunay_mode ) { draw_line( edge.org(), edge.dest(), 2, "gray" ); }
  if( voronoi_mode ) { draw_line( edge.right(), edge.left(), 2, "orange" ); }
  if( crust_skeleton_mode ) {
      if( edge.is_crust() ) { draw_line( edge.right(), edge.left(), 2, "purple" ); }
      else { draw_line( edge.org(), edge.dest(), 2, "red" ); }
  }
}

function draw_line( v0, v1, width, color ) {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo( v0.x, v0.y );
  context.lineTo( v1.x, v1.y );
  context.closePath();
  context.stroke();
}

//=================
// Event handlers
//=================

function on_mouse_down( e ) {
  const screen_coords = [ e.clientX, e.clientY ];
  const canvas_coords = screen_2_canvas( screen_coords );
  const vertex = new Vertex( canvas_coords[ 0 ], canvas_coords[ 1 ] );
  voronoi.insert( vertex );
}

function on_mouse_move( e ) {
  if( voronoi === null ) return;

  const screen_coords = [ e.clientX, e.clientY ];
  const canvas_coords = screen_2_canvas( screen_coords );
  const vertex = new Vertex( canvas_coords[ 0 ], canvas_coords[ 1 ] );
  const cursor = voronoi.cursor( vertex );
  if( cursor !== null ) { voronoi_cursor = cursor; }
}

function on_key_press( e ) {
  const crust_skeleton_key = 's';
  const voronoi_key = 'v';
  const delaunay_key = 'd';
  const cursor_key = 'c';
  const valid_keys = [ crust_skeleton_key, voronoi_key, delaunay_key, cursor_key ];

  let key = String.fromCharCode( e.which );
  if( valid_keys.indexOf( key ) === -1 ) return;

  if( key === delaunay_key ) delaunay_mode = !delaunay_mode;
  if( key === voronoi_key ) voronoi_mode = !voronoi_mode;
  if( key === crust_skeleton_key ) crust_skeleton_mode = !crust_skeleton_mode;
  if( key === cursor_key ) cursor_mode = !cursor_mode;
}

function screen_2_canvas( e ) {
  let x = e[ 0 ] - outer_div.offsetLeft - canvas_div.offsetLeft;
  x = clip( x, boundary, ( canvas_width - boundary ) );

  let y = e[ 1 ] - outer_div.offsetTop  - canvas_div.offsetTop;
  y = clip( y, boundary, ( canvas_height - boundary ) );

  return [ x, y ];
}

function clip( value, lower_bound, upper_bound ) { return value < lower_bound ? lower_bound : value > upper_bound ? upper_bound : value; }

//============
// 2D Vertex
//============

function Vertex( x, y, is_infinity = false ) {
  this.x = x;
  this.y = y;
  this.is_infinity = is_infinity;
}

Vertex.prototype.to_s = function() { return '[' + this.x + ', ' + this.y + ']'; }

Vertex.prototype.equals = function( v ) { return ( this.x === v.x && this.y === v.y ); }

//=================================
// 2D predicates for planar datum
//=================================

function in_circle( v0, v1, v2, v3 ) {
  const v0_sqr = v0.x*v0.x + v0.y*v0.y;
  const v1_sqr = v1.x*v1.x + v1.y*v1.y;
  const v2_sqr = v2.x*v2.x + v2.y*v2.y;
  const v3_sqr = v3.x*v3.x + v3.y*v3.y;
  let circle_test =
    ( v2.x - v1.x ) * ( v3.y - v1.y ) * ( v0_sqr - v1_sqr )
  + ( v3.x - v1.x ) * ( v0.y - v1.y ) * ( v2_sqr - v1_sqr )
  + ( v0.x - v1.x ) * ( v2.y - v1.y ) * ( v3_sqr - v1_sqr )
  - ( v2.x - v1.x ) * ( v0.y - v1.y ) * ( v3_sqr - v1_sqr )
  - ( v3.x - v1.x ) * ( v2.y - v1.y ) * ( v0_sqr - v1_sqr )
  - ( v0.x - v1.x ) * ( v3.y - v1.y ) * ( v2_sqr - v1_sqr );
  return circle_test >= 0.0;
}

function circumcenter( v0, v1, v2 ) {
  const divisor = (v1.y - v2.y)*(v1.x - v0.x) - (v1.y - v0.y)*(v1.x - v2.x);
  const num0 = ( (v0.x + v1.x)*(v1.x - v0.x) )/2.0 + ( (v1.y - v0.y)*(v0.y + v1.y) )/2.0;
  const num1 = ( (v1.x + v2.x)*(v1.x - v2.x) )/2.0 + ( (v1.y - v2.y)*(v1.y + v2.y) )/2.0;
  const x = ( num0*(v1.y - v2.y) - num1*(v1.y - v0.y) )/divisor;
  const y = ( num1*(v1.x - v0.x) - num0*(v1.x - v2.x) )/divisor;
  return new Vertex( x, y );
}

function area( v0, v1, v2 ) { return ( v1.x - v0.x ) * ( v2.y - v0.y ) - ( v2.x - v0.x ) * ( v1.y - v0.y ); }

function dist_sqr( v0, v1 ) { return ( v1.x - v0.x ) * ( v1.x - v0.x ) + ( v1.y - v0.y ) * ( v1.y - v0.y ); }

function colinear( v0, v1, v2 ) { return area( v0, v1, v2 ) === 0.0; }

function is_right_of( v0, v1, v2 ) { return area( v0, v1, v2 ) > 0.0; }

function is_left_of( v0, v1, v2 ) { return area( v0, v1, v2 ) < 0.0; }

//========================================
// Quadedge data structure and operators
//========================================

function Edge() {
  this.data = null;
  this.next = null;
  this.rot = null;
}

Edge.prototype.splice = function( e ) {
  let e1 = this.next.rot;
  let e2 = e.next.rot;
  let e3 = this.next;
  this.next = e.next;
  e.next = e3;
  e3 = e1.next;
  e1.next = e2.next;
  e2.next = e3;
}

Edge.prototype.swap = function() {
  let e0 = this.oprev();
  let e1 = this.sym().oprev();
  this.splice( e0 );
  this.sym().splice( e1 );
  this.splice( e0.lnext() );
  this.sym().splice( e1.lnext() );
  this.set_org( e0.dest() );
  this.set_dest( e1.dest() );
}

Edge.prototype.sym = function() { return this.rot.rot; }

Edge.prototype.irot = function() { return this.rot.rot.rot; }

Edge.prototype.org = function() { return this.data; }

Edge.prototype.set_org = function( v ) { this.data = v; }

Edge.prototype.right = function() { return this.rot.data; }

// Edge.prototype.set_right = function( v ) { this.rot.data = v; }

Edge.prototype.dest = function() { return this.rot.rot.data; }

Edge.prototype.set_dest = function( v ) { this.rot.rot.data = v; }

Edge.prototype.left = function() { return this.rot.rot.rot.data; }

Edge.prototype.set_left = function( v ) { this.rot.rot.rot.data = v; }

Edge.prototype.set_org_dest = function( org, dest ) { this.set_org( org ); this.set_dest( dest ); }

Edge.prototype.onext = function() { return this.next; }

// Edge.prototype.rnext = function() { return this.rot.next.rot.rot.rot; }

// Edge.prototype.dnext = function() { return this.rot.rot.next.rot.rot; }

Edge.prototype.lnext = function() { return this.rot.rot.rot.next.rot; }

Edge.prototype.oprev = function() { return this.rot.next.rot; }

// Edge.prototype.rprev = function() { return this.rot.rot.next; }

Edge.prototype.dprev = function() { return this.rot.rot.rot.next.rot.rot.rot; }

Edge.prototype.lprev = function() { return this.next.rot.rot; }

Edge.prototype.is_crust = function() { return in_circle( this.left(), this.org(), this.right(), this.dest() ); }

Edge.prototype.is_infinite_edge = function() { return this.org().is_infinity || this.dest().is_infinity; }

Edge.prototype.is_vertex_on_left = function( v ) { return is_left_of( v, this.org(), this.dest() ); }

Edge.prototype.is_vertex_on_right = function(v ) { return is_right_of( v, this.org(), this.dest() ); }

Edge.prototype.vertex_colinear = function( v ) { return colinear( v, this.org(), this.dest() ); }

Edge.prototype.to_s = function() { return "org=" + this.org().to_s() + " dest=" + this.dest().to_s(); }

//=======================================
//  2D Voronoi diagram for planar datum
//=======================================

function Voronoi() {
  this.edge = null;
  this.edges = [];
  this.cosmic_vertices = [];
  this.vertices = [];
  this.circumcenters = [];
}

Voronoi.prototype.init_delaunay = function( v0, v1, v2 ) {
  this.edges.forEach( edge => this.delete_quadedge( edge ) );
  this.edges = [];
  let e0 = this.make_quadedge();
  let e2 = this.make_quadedge();
  e0.set_org_dest( v1, v2 );
  e2.set_org_dest( v1, v0 );
  e0.splice( e2 );
  e2 = e2.sym();
  this.connect( e0, e2 );
  this.edge = e0;
  this.cosmic_vertices = [];
  this.cosmic_vertices.push( v0, v1, v2 );
  this.circumcenters.forEach( cc => delete( cc ) );
  this.circumcenters = [];
  this.vertices.forEach( cc => delete( cc ) );
  this.vertices = [];
}

Voronoi.prototype.make_quadedge = function() {
  const rot_map = [ 1, 2, 3, 0 ];
  const next_map = [ 0, 3, 2, 1 ];
  const quad = [ new Edge(), new Edge(), new Edge(), new Edge() ];
  this.edges.push( quad[ 0 ] );
  for( let i = 0; i < 4; i++ ) {
    quad[ i ].rot = quad[ rot_map[ i ] ];
    quad[ i ].next = quad[ next_map[ i ] ];
  }
  return quad[ 0 ];
}

Voronoi.prototype.connect = function( e0, e1 ) {
  const e2 = this.make_quadedge();
  e2.set_org_dest( e0.dest(), e1.org() );
  e2.splice( e0.lnext() );
  e2.sym().splice( e1 );
  return e2;
}

Voronoi.prototype.insert = function( vertex ) {
  if( !this.is_inside_cosmic_triangle( vertex ) ){ return; }

  try { this.locate( vertex ); }
  catch( exception ) {
    if( exception === "LocateException" ) { return; }
    alert( exception );
  }

  this.vertices.push( vertex )
  if( this.edge.vertex_colinear( vertex ) ) {
    let tmp = this.edge.oprev();
    this.delete_quadedge( this.edge );
    this.edge = tmp;
  }

  let e2 = this.make_quadedge();
  let v1 = this.edge.org();
  e2.set_org_dest( v1, vertex );
  e2.splice( this.edge );
  do {
    e2 = this.connect( this.edge, e2.sym() );
    this.edge = e2.oprev();
  } while( this.edge.dest() !== v1 );

  while( true ) {
    let e3 = this.edge.oprev();
    if( this.edge.is_vertex_on_right( e3.dest() ) && in_circle( vertex, this.edge.org(), e3.dest(), this.edge.dest() ) ) {
      this.edge.swap();
      this.set_circumcenter( this.edge );
      this.edge = this.edge.oprev();
    }
    else {
      if( this.edge.org() === v1 ) {
        this.set_circumcenter( this.edge );
        return;
      }
      this.set_circumcenter( this.edge );
      this.edge = this.edge.onext().lprev();
    }
  }
}

Voronoi.prototype.is_inside_cosmic_triangle = function( v ) {
  let is_cosmic = true;
  const borders = [];
  const vtx = this.cosmic_vertices;
  borders[ 0 ]  = [ vtx[ 0 ], vtx[ 1 ] ];
  borders[ 1 ]  = [ vtx[ 1 ], vtx[ 2 ] ];
  borders[ 2 ]  = [ vtx[ 2 ], vtx[ 0 ] ];
  borders.forEach( e => is_cosmic &= is_left_of( v, e[ 0 ], e[ 1 ] ) );
  return is_cosmic;
}

Voronoi.prototype.disconnect_edge = function( e ) {
  e.splice( e.oprev() );
  e.sym().splice( e.sym().oprev() );
}

Voronoi.prototype.locate = function( v ) {
  const max_search_steps = 1000;
  let steps_count = 0;
  if( this.edge.is_vertex_on_right( v ) ){ this.edge = this.edge.sym(); }
  while( true ) {
    if( steps_count++ > max_search_steps || v.equals( this.edge.org() ) || v.equals( this.edge.dest() )){ throw "LocateException"; }
    if( !this.edge.onext().is_vertex_on_right( v ) ) { this.edge = this.edge.onext(); continue; }
    if( !this.edge.dprev().is_vertex_on_right( v ) ) { this.edge = this.edge.dprev(); continue; }
    return this.edge;
  }
}

Voronoi.prototype.delete_quadedge = function( e ) {
  this.disconnect_edge( e );
  [ e, e.rot, e.sym(), e.irot() ].forEach( element => delete( element ) );
}

Voronoi.prototype.set_circumcenter = function( e ) {
  const cc = circumcenter( e.dest(), e.org(), e.onext().dest() );
  this.circumcenters.push( cc );
  e.set_left( cc );
  e.lnext().set_left( cc );
  e.lprev().set_left( cc );
}

Voronoi.prototype.cursor = function( vertex ) {
  if( !this.is_inside_cosmic_triangle( vertex ) ){ return null; }

  try { this.locate( vertex ); }
  catch( exception ) {
    if( exception === "LocateException" ) { return null; }
    alert( exception );
  }

  let e = this.edge;
  while( e.is_vertex_on_left( e.onext().dest() ) && in_circle( vertex, e.org(), e.dest(), e.onext().dest() ) ) {
    e = e.onext();
  }

  e = e.sym();
  const neighbors = [];
  const stolen_areas = [];
  let v1 = e.org();
  let nn = e.org();
  let min_dist_sqr = dist_sqr( vertex, v1 );
  do {
    let area = [ circumcenter( e.dest(), e.org(), vertex ) ];
    do {
      area.push( e.left() );
      e = e.onext();
    } while( in_circle( vertex, e.org(), e.dest(), e.onext().dest() ) );
    area.push( circumcenter( e.org(), e.dest(), vertex ) );

    const a_dist_sqr = dist_sqr( vertex, e.org() );
    if( a_dist_sqr === 0.0 ) { return null; }

    if( a_dist_sqr <= min_dist_sqr ) {
      min_dist_sqr = a_dist_sqr;
      nn = e.org();
    }

    stolen_areas.push( area );
    neighbors.push( e );
    e = e.sym();
  } while( e.org() !== v1 );

  return new Neighborhood( vertex, stolen_areas, neighbors.map( ed => ed.org() ), nn );
}

function Neighborhood( vertex, areas, vertices, nearest_neighbor ) {
  this.vertex = vertex;
  this.areas = areas;
  this.vertices = vertices;
  this.nearest_neighbor = nearest_neighbor;
}
