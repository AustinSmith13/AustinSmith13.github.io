/*jslint browser: true, indent: 3 */

// CS 3312, spring 2017
// YOUR NAME: Austin Smith

/* 
Learning Materials:
http://learningwebgl.com/blog/?p=1253

Resources:
http://maps.jpl.nasa.gov/                                   #Place where I got my image data for planet textures
http://www.shadedrelief.com/natural3/pages/textures.html    #Earth texture from this website
http://planetpixelemporium.com/uranus.html                  #Somre more planet textures
https://threejs.org/docs/                                   #Documentation for THREE
*/


// All the code below will be run once the page content finishes loading.
document.addEventListener('DOMContentLoaded', function () {
   "use strict";
   /*global THREE */ // Defines globals that jsLint does not detect

   var canvas, renderer, scene, sun, camera, createSolarSystemModel, solarSystemModel, solarSystemController;

   // Attempts to create a gl context and sets up the canvas
   (function () {
      var aspect;
      // Gets the glCanvas element
      canvas = document.querySelector('#glCanvas');
      canvas.style.position = 'fixed';
      canvas.style.left = '0px';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Calculates the aspect of the window
      aspect = window.innerWidth / window.innerHeight;
      //JSORBIT.init();

      // Creates a perspective camera FOV: 60, aspect-ratio, near-plane: 1, farplane: 1000
      camera = new THREE.PerspectiveCamera(60, aspect, 1, 100000);
      camera.position.set(500, 350, 750);

      // Creates a new scene graph (Manages objects transforms and hierarchy)
      scene = new THREE.Scene();

      // Create the initial scene, creates the sun
      (function () {
         var object, loader, flarMat;

         // Creates a point light that will represent the sun
         scene.add(new THREE.PointLight(0xffffff, 1, 300000));
         scene.add(new THREE.AmbientLight(0x111111));

         // Uncomment this to include the grid helper in the scene
         //object = new THREE.GridHelper(10000, 100);
         //object.position.set(0, -100, 0);
         //scene.add(object);

         // Used to load textures onto geometry
         loader = new THREE.TextureLoader();

         // Load the sun texture then create the sun once that texture has finnished loading
         loader.load('textures/pl_sun.jpg', function (loadedTexture) {
            object = new THREE.Mesh(new THREE.SphereBufferGeometry(30, 64, 64), new THREE.MeshBasicMaterial({ map: loadedTexture}));

            // Sets the attribtues of the sun such as position, rotation, and scale
            object.position.x = 0;
            object.position.y = 0;
            object.position.z = 0;
            object.rotation.x = Math.random() * 2 * Math.PI;
            object.rotation.y = Math.random() * 2 * Math.PI;
            object.rotation.z = Math.random() * 2 * Math.PI;
            object.scale.x = 4;
            object.scale.y = 4;
            object.scale.z = 4;
            object.material.depthWrite = false;
            object.renderDepth = 1;
            scene.add(object);
            sun = object;
         });

         // Creates a sprite material and loads flare.png, also uses additive blending for the sun effect
         flarMat = new THREE.SpriteMaterial({map: loader.load('textures/flare.png'), color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending});
         flarMat.depthWrite = false;   // this tells it not to write to the depth buffer
         //flarMat.depthTest = false; 
         object = new THREE.Sprite(flarMat);
         // Set the render depth to something greater than the suns render depth (this will mean that the sun flare sprite will always render ontop of the sun geometry sphere)
         object.renderDepth = 10;
         object.scale.set(2000, 2000, 2000);
         object.position.set(0, 25, 0);

         // add the flare object to the scene (note that if you do not do this then it will not be rendered)
         scene.add(object);
      }());
   }());

   // Represents the model of a solar system. Contains all of the planets.
   createSolarSystemModel = function () {
      var addPlanet, planetObjects, lineMaterial, geometry;

      // Array of every planet object in the system
      planetObjects = [];

      // Creates the line material used for drawing lines
      lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});

      geometry = new THREE.SphereBufferGeometry(30, 64, 64);

      // adds a planet to the system according to the specified arguments
      addPlanet = function (args) {
         var object, material, sceneObject, lg, i, px, py, pz, vx, vy, vz, d, stepsize, start, planet;

         material = new THREE.MeshPhongMaterial({
            map: THREE.ImageUtils.loadTexture(args.imageSrc),
            specular: 0x000000
         });

         object = new THREE.Mesh(geometry, material);
         object.position.x = args.position.x;
         object.position.y = args.position.y;
         object.position.z = args.position.z;
         object.rotation.x = 0;
         object.rotation.y = 0;
         object.rotation.z = 0;
         object.scale.x = args.size;
         object.scale.y = args.size;
         object.scale.z = args.size;
         scene.add(object);
         planet = object;

         lg = new THREE.Geometry(); // lg stands for line geometry

         px = args.position.x;
         py = args.position.y;
         pz = args.position.z;
         vx = args.velocity.x;
         vy = args.velocity.y;
         vz = args.velocity.z;
         //stepsize = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2) + Math.pow(pz, 2)) / (Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2) + Math.pow(vz, 2))* 200);
         stepsize = Math.sqrt(Math.pow(px - vx, 2) + Math.pow(py - vy, 2) + Math.pow(pz - vz, 2)) * 0.1 / 200;

         // starting point of the planet, used to start off the orbit lines
         start = {
            x: px,
            y: py,
            z: pz
         };

         // Draws the orbit lines by simulating the planets orbit ahead of time and then simply marking the path
         lg.vertices.push(start);   // starting point of the line
         for (i = 0; i < 200; i += 1) {

            // This equation is the same one used for calculating the planets, thus it works with approximating the orbit lines as well
            d = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2) + Math.pow(pz, 2));
            vx += stepsize * 50 * 99999 / (d * d) * (-px) / d;
            vy += stepsize * 50 * 99999 / (d * d) * (-py) / d;
            vz += stepsize * 50 * 99999 / (d * d) * (-pz) / d;
            px += vx * 0.1 * 50 * stepsize;
            py += vy * 0.1 * 50 * stepsize;
            pz += vz * 0.1 * 50 * stepsize;

            // Pushes each aproximated position to the line geometry as a vertex
            lg.vertices.push(new THREE.Vector3(px, py, pz));

            // if the distance between where it is in the simulation and where the starting point is less than 50 then stop the sim and connect the ends
            if (Math.sqrt(Math.pow(start.x - px, 2) + Math.pow(start.y - py, 2) + Math.pow(start.z - pz, 2)) < 50) {
               lg.vertices.push(start);
               break;
            }
         }

         // Tells THREE that the geometry can change
         lg.dynamic = true;

         // Create a new scene object using the line material and line geometry
         sceneObject = new THREE.Line(lg, lineMaterial);
         scene.add(sceneObject); // add the line object to the scene

         // add the planet to the list of planets in the solar system 
         planetObjects.push({objectInfo: object, physics: {velocity: new THREE.Vector3(args.velocity.x, args.velocity.y, args.velocity.z), mass: args.mass}, trail: { data: [], object: sceneObject, indexer: 0}});

         return planet;
      };

      return {addPlanet : addPlanet, planets : planetObjects};
   };

   // Controlls solar system, responsible for creating the planets, simulating the planets, and telling the view when a step is complete (tells the view when to render)
   solarSystemController = function (solarSystem) {
      var planetListing, controls, enabled;

      // This instantiates a trackball controller object (note that the trackballcontroller is not my code)
      controls = new THREE.TrackballControls(camera);
      controls.rotateSpeed = 4; // sets the speed at which the camera will rotate around the object

      enabled = document.querySelector('#chackbox-enable').checked;

      // Instantiate the planets and the solar system
      (function () {
         var mercury, venus, earth, mars, jupiter, neptune, uranus, saturn;

         // Create mercury                // Set the init velocity                  // set init position    // radius of planet  // src texture of planet
         mercury = solarSystem.addPlanet({velocity: {x: 5, y: 1, z: -30}, position: {x: -900, y: 0, z: 0}, size: 0.1, imageSrc: 'textures/mercury.jpg'});

         // Create venus
         venus = solarSystem.addPlanet({velocity: {x: 0, y: 0, z: -20}, position: {x: -2000, y: 0, z: 0}, size: 0.5, imageSrc: 'textures/venus.jpg'});

         // Create earth
         earth = solarSystem.addPlanet({velocity: {x: 0, y: -0.3, z: -15}, position: {x: -3000, y: 0, z: 0}, size: 0.53, imageSrc: 'textures/earth.jpg'});

         // Create mars
         mars = solarSystem.addPlanet({velocity: {x: 0, y: 0, z: -12}, position: {x: -5000, y: 0, z: 0}, size: 0.4, imageSrc: 'textures/mar.jpg'});

         // Create Jupiter
         jupiter = solarSystem.addPlanet({velocity: {x: 0, y: 0.001, z: -10}, position: {x: -10000, y: 0, z: 0}, size: 0.8, imageSrc: 'textures/jupiter.jpg'});

         // Create Saturn
         saturn = solarSystem.addPlanet({velocity: {x: 0, y: -0.001, z: -8}, position: {x: -15000, y: 0, z: 0}, size: 0.8, imageSrc: 'textures/saturn.jpg'});

         // Create Uranus
         uranus = solarSystem.addPlanet({velocity: {x: 0, y: 0.1, z: -6}, position: {x: -25000, y: 0, z: 0}, size: 0.8, imageSrc: 'textures/uranus.jpg'});

         // Create Nepturn
         neptune = solarSystem.addPlanet({velocity: {x: 0, y: 0.5, z: -5}, position: {x: -35000, y: 0, z: 0}, size: 0.8, imageSrc: 'textures/neptune.jpg'});

         planetListing = {
            target: earth,
            mercury: {object: mercury, color: 0xffaa00},
            venus: {object: venus, color: 0xaa5511},
            earth: {object: earth, color: 0x1122ff},
            mars: {object: mars, color: 0xff0000},
            jupiter: {object: jupiter, color: 0x0f1521},
            saturn: {object: saturn, color: 0x114564},
            uranus: {object: uranus, color: 0xaaaaaf},
            neptune: {object: neptune, color: 0x1111ff}
         };

         camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
      }());

      // Controls which planet is a target (the target is what the camera will orbit around)
      (function () {

         // tell the camera to orbit the sun
         document.querySelector('#radio_sun').addEventListener('change', function () {
            planetListing.target = sun;
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);
         }, false);

         // tells the camera to orbit mercury
         document.querySelector('#radio_mercury').addEventListener('change', function () {
            // set the target to mercury
            planetListing.target = planetListing.mercury.object;

            // tell the controller to set its target to the planetListing target
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // set the cameras position next to the planet
            camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
         }, false);

         // tells the camera to orbit venus
         document.querySelector('#radio_venus').addEventListener('change', function () {
            planetListing.target = planetListing.venus.object;

           // tell the controller to set its target to the planetListing target
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // set the cameras position next to the planet
            camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
         }, false);

         document.querySelector('#radio_earth').addEventListener('change', function () {
            planetListing.target = planetListing.earth.object;

            // tell the controller to set its target to the planetListing target
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // set the cameras position next to the planet
            camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
         }, false);

         document.querySelector('#radio_mars').addEventListener('change', function () {
            planetListing.target = planetListing.mars.object;

            // tell the controller to set its target to the planetListing target
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // set the cameras position next to the planet
            camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
         }, false);

         document.querySelector('#radio_jupiter').addEventListener('change', function () {
            planetListing.target = planetListing.jupiter.object;

            // tell the controller to set its target to the planetListing target
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // set the cameras position next to the planet
            camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
         }, false);

         document.querySelector('#radio_saturn').addEventListener('change', function () {
            planetListing.target = planetListing.saturn.object;

            // tell the controller to set its target to the planetListing target
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // set the cameras position next to the planet
            camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
         }, false);

         document.querySelector('#radio_uranus').addEventListener('change', function () {
            planetListing.target = planetListing.uranus.object;

            // tell the controller to set its target to the planetListing target
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // set the cameras position next to the planet
            camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
         }, false);


         document.querySelector('#radio_neptune').addEventListener('change', function () {
            planetListing.target = planetListing.neptune.object;

            // tell the controller to set its target to the planetListing target
            controls.target = new THREE.Vector3(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // set the cameras position next to the planet
            camera.position.set(planetListing.target.position.x + 100, planetListing.target.position.y, planetListing.target.position.z);
         }, false);
      }());

      // Resize the gl-canvas when the window resizes
      window.addEventListener('resize', function () {
         var aspect;

         // Calculate the aspect-ratio of the window
         aspect = window.innerWidth / window.innerHeight;

         // Update the cameras aspect with the new window aspect ratio
         camera.aspect = aspect;

         // Update the cameras projection matrix
         camera.updateProjectionMatrix();

         // Set the dimensions of the renderer to the new window size
         renderer.setSize(window.innerWidth, window.innerHeight);
      }, false);

      // Update the enable variable when the checkbox state is changed
      document.querySelector('#chackbox-enable').addEventListener('change', function (e) {
         enabled = e.target.checked;
      }, false);

      // Listens for click events for the spawn planet button, on click then spawn a planet
      document.querySelector('#spawnPlanet').addEventListener('click', function () {
         solarSystem.addPlanet({velocity: {x: Math.random() * 5, y: 20 + Math.random() * 5, z: -20 + Math.random() * 5}, position: {x: 1000 + 1000 * Math.random(), y: 1000 * Math.random(), z: 0}, size: 0.5, imageSrc: 'textures/mercury.jpg'});
      }, false);

         // Handles rendering and updating the scene
      (function () {
         var render, update;

         renderer = new THREE.WebGLRenderer({ canvas: canvas });
         renderer.setClearColor(0x000000);
         renderer.setPixelRatio(window.devicePixelRatio);
         renderer.setSize(window.innerWidth, window.innerHeight);
         renderer.sortObjects = false;

         render =  function () {
            camera.updateMatrixWorld();

            controls.update();

            if (enabled) {
               update();
            }

            renderer.render(scene, camera);
            setTimeout(function () {
               render();
            }, 16);
         };

         update = function () {
            var timestep;

            timestep = 0.1;

            // If the sun is still loading, then try agin
            if (sun === undefined) {
               return;
            }

            controls.target.set(planetListing.target.position.x, planetListing.target.position.y, planetListing.target.position.z);

            // Applies newtonian forces for every planet in the system
            solarSystem.planets.forEach(function (object) {
               var d, velocity;

               // The equation I use comes from the newtonian laws of motion
               // I removed mass from being considered (its considered in my orbital mechanics version, but i didnt have time to re-introduce everything in the simplified version)

               // the distance between the object and the sun (this could easily be calculated by taking the magnitude of the objects position)
               d = object.objectInfo.position.distanceTo(sun.position);

               //newtonianForce = (G * objectA.physics.mass * objectB.physics.mass) / (d * d);

               // Position of the object
               //position = object.objectInfo.position;

               // velocity of the object
               velocity = object.physics.velocity;

               //acceleration = force;
               //acceleration.divideScalar(mass);

               // calculates the velocity of the object
               object.physics.velocity.x +=  99999 / (d * d) * (sun.position.x - object.objectInfo.position.x) / d;
               object.physics.velocity.y +=  99999 / (d * d) * (sun.position.y - object.objectInfo.position.y) / d;
               object.physics.velocity.z +=  99999 / (d * d) * (sun.position.z - object.objectInfo.position.z) / d;

               // The timestep allows you to control how fast the simulation will go and the positions are updated by adding the new velocity
               object.objectInfo.position.x += velocity.x * timestep;
               object.objectInfo.position.y += velocity.y * timestep;
               object.objectInfo.position.z += velocity.z * timestep;
            });
         };

         // Begin rendering the frame
         render();
      }());
   };

   // Create the solar system model
   solarSystemModel = createSolarSystemModel();

   // Create the solar system controller and give it the model
   solarSystemController(solarSystemModel);
}, false);
