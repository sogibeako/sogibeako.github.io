Intro
0:00
These are two connected portals. It's easy to  imagine how an object would pass through them,  
0:05
but what about if the blue portal comes into  the orange one? Will this create a black hole,  
0:11
or might the universe just return an error?  Let's try it! ... Well, the universe is safe,  
0:21
and blue portal just comes out of itself. But  there is something interesting going on. This is  
0:27
my solution to this problem and in this video we  will see what's inside of this, what a portal is,  
0:32
how portals can move, how it works, why there is  no singularity and what will happen to the object  
0:38
inside. My name is Ilya, let's dive in. For this video I wrote a program called  
Portal Explorer program
0:46
Portal Explorer that draws portals using  ray tracing. In Portal Explorer, you can  
0:51
put a portal into another portal and explore  everything shown in this video by yourself!  
0:56
It even works on most smartphones. And there's  a link to this program in the description.  
1:01
You're probably familiar with portals, thanks  to the Portal game, where they connect the same  
Formulating the problem
1:06
universe and can teleport light, unlike  portals in many other works of fiction.  
1:11
After the game's release, the community came  up with this question. And it's very hard to  
1:15
imagine a solution because there are no portals  in real life, we can't experiment with them and  
1:21
develop visual intuition. So please remember  that this video is just a reasonable model  
1:26
that I explore via my simulation. Whenever this question comes up,  
About portal movement
1:30
people always say, "Portals can't be placed on  moving surfaces." You really can't do this in  
1:35
the first game, but it's possible in the second  game. Who is right? It doesn't matter, let's not  
1:41
base our understanding of portals on some games,  it's better to think of a portal as an abstract  
1:47
mathematical concept that can potentially exist  in real life. Then our only limitation is rules  
1:52
of logic, therefore let's assume that portals  can move, until we run into contradictions.  
What a portal is
1:59
Let's first understand what a portal even is.  There isn't a strict mathematical definition  
2:04
of them, only a vague idea of what a portal should  be. I think that the portal concept comes from the  
2:10
idea of a doorway, which can connect two different  rooms. We can build portals by cutting and joining  
2:16
space between doorways, like this. Now we can say  that a doorway is just two back-to-back portals.  
2:22
This becomes our first property of a portal: if  we connect two portals back-to-back to make a  
2:27
doorway, everything should work the same. Let's  apply this property to the moving doorway. We  
2:33
see that the two portals that comprise it are  moving too, and even if we move them slightly,  
2:39
nothing really changes. This also works  for this kind of movement. As we can see,  
2:45
there's nothing preventing portals from moving. We've learned that portals can move while  
2:50
stationary relative to each other. Now let's  consider another type of movement: when only  
2:54
one portal moves. And we already have another  community picture for this. I won't discuss it  
Riddle about portal movement
3:00
because it's just plain wrong as a question.  It has no concrete values: speed, mass,  
3:04
force - everything. You can say that the object  is very heavy and the portal is slow, therefore  
3:09
A is correct, or the object is lightweight and the  portal is fast, therefore B is correct. Everyone  
3:16
interprets this picture their own way. So, I have  plans to make a video about this situation with  
3:21
concrete values and with respect to energy and  momentum conservation, so subscribe if you want to  
3:26
see this. For now, let's forget physics and talk  only about geometry. This is a similar situation  
My version of that riddle
3:33
without gravity, air friction, conservation  of energy, or other physics. Here, the blue  
3:38
portal and object are still, but the orange portal  moves and will fly onto the object. I claim that  
3:43
the teleported object will fly out from the blue  portal, despite not moving before teleportation.  
3:50
Like this. And this is just visually appealing.  But if you want an explanation, let's use the  
3:56
first property of portals. In a geometrical  sense, a moving portal and stationary object  
4:01
is the same as a moving object and stationary  portal. So if we connect backs of the portals,  
4:07
then the object should also move for the blue  portal. So when portals move, they change the  
4:12
speed of anything going through them. Finally, since the portals can move,  
Two portal pairs
4:17
we can return to the original problem. To answer  complex questions such as "portal-in-portal",  
4:22
we must understand how a portal can teleport  another portal at all. For that, we can take  
4:27
two independent pairs of portals: triangular and  circular. Each has both parts: triangular here  
4:34
and circular here. Let's say that two different  portal guns created them. So, now we can take one  
4:40
triangular portal and push it inside the circular  portal. The result is straightforward. Everything  
4:46
looks continuous, and we can barely notice any  change. But when the effect is so seamless,  
4:52
it's hard to understand how it works, so let's  break the continuity illusion and disable light  
4:57
teleportation. Now our portals can teleport  objects but can't teleport light. We see that  
5:02
there is some surface behind which is another  place. We will use that frequently to understand  
5:08
how portals work. Here, the red color represents  the triangular portal part before teleportation.  
5:14
And the wall color has nothing to do with it.  Next, the green color is after the teleportation.  
5:20
As a result, when we push the triangular  portal inside, it splits into two pieces.  
5:25
We can see why the first portal splits, but  why does this one split too? Why was it red,  
5:31
then half green, and then full green?  Let's suppose that at this stage, here,  
5:36
it must be not half red, but full red. What  would happen then? We can understand that in  
Why portal must have the same shape on input and output
5:42
the following scene. We can treat the missing part  as green. It seems that everything is fine. When  
5:48
we move the teleported object up, it breaks on  one side. This violates our first portal rule:  
5:54
when we connect the backs, we don't get a clean  doorway. It means that portals must always have  
6:00
the same shape on both sides. And therefore,  here, our portal is split into two pieces: red and  
6:06
green. When we teleport the input, the output will  change its shape too. It might seem strange that  
6:12
changing one portal forces the other to change  too. But it all makes sense when we remember  
6:17
that portals are created from a single doorway and  they are one thing that looks like two things.  
Why split portal looks continuous
6:24
But if there are two portals, then why does  this look so continuous? How does this work?  
6:29
Let's take a circular portal and split it into two  pieces: red and green. It's split from both sides.  
6:36
There are many ways to split it. But if we turn on  light teleportation, we will see that everything  
6:42
is continuous despite the portal being cut into  two pieces. Therefore, this division exists only  
6:48
in our minds, and there is no way to determine  portal division by its appearance. We can divide  
6:54
any portal into infinitely many pieces, and this  will be useful later. Now we understand that when  
7:00
two portals touch at their edges, then they can  create a continuous image. In one case they touch  
7:06
physically, in another - through a portal. We always push objects into a whole portal. So  
How split portal will teleport object
7:12
how should we handle a split portal? If we move  this square object, it will look like this. But  
7:18
how must that work in the implementation?  If one object enters two different portals,  
7:23
then there must be two different objects on the  other side. The green portal creates a green copy,  
7:29
and the red portal creates a red copy. We can do  that by placing an imaginary knife on the portal  
7:34
borders; this knife will cut an object along its  speed direction, resulting in separate objects  
7:39
entering their own portal. An object is cut on  the input, but it will be joined on the output,  
7:45
and portals always work this way. There is no  way to determine when an object is being cut. So  
7:51
this knife also exists only in our minds. Now we have a clear picture of that scene.  
Why two portal pairs scene is important
7:56
And this is very important because that's the  whole point. In the "portal-in-portal" problem,  
8:02
nothing teleports by itself, **every portal  is teleported by another portal**. Our job is  
8:07
to split the portal into independent pieces.  Thereby we get rid of paradoxes and turn an  
8:13
impossible task into a computational one. But before continuing further explanation,  
Common information about the "portal in portal"
8:18
let's return to the start of the video and better  figure out what is happening. The first thing to  
8:24
notice - that portal is moved to the edge.  This border prevents it from moving further.  
8:29
Then we should see that the blue portal comes  out from the blue portal, in other words,  
8:33
it comes out of itself. So one picture about the  "portal-in-portal" problem that I found on the  
8:38
internet is wrong: colors do not alternate. Then, what if we look inside? We see an exciting  
What if look inside "portal in portal"
8:45
recursion pattern from the blue portal and the  same image from the orange portal. Such recursion  
8:50
isn't strange, because we see similar effects with  standard portals. Due to that recursion, everyone  
8:56
thinks that we have some sort of singularity here,  but actually, we don't; everything works like  
9:02
regular portals, and I will show that by placing  an object here. An object can be there without  
What if put object into "portal in portal"
9:07
touching anything, with no singularities yet. If  we push it into the portal, it's just teleported  
9:13
to a different place; it will not duplicate,  sometimes splitting into three parts. But if we  
9:18
enable light teleportation, it will look like the  object isn't teleported anywhere, not even cut.  
9:24
And the distance between the object and its images  is preserved, just like with regular portals.  
9:30
So there is no singularity. If we disable light teleportation,  
Teleportation degrees
9:34
we will see colors: red, green, and blue. We  already saw this in the previous scene with  
9:39
red and green colors. Here these colors  represent the same thing. The red color  
9:44
represents the non-teleported part, the green  color represents the first outgoing part, and  
9:49
blue represents the second outgoing part. These  colors represent "teleportation degree" - how many  
9:55
times that portal section has been teleported.  Red represents first degree, green second degree,  
10:02
and blue third degree. There are infinitely  many degrees represented by other colors:  
10:07
for example, there is a fourth yellow degree for  this setup. When one portal comes into another,  
10:14
the degree of an incoming portal ([in]) and  degree of receiving portal ([input]) add up  
10:19
into an outgoing portal ([out]). This happens  because of how portals work mathematically,  
10:24
but this video will be too long with  a math explanation. Write a comment  
10:28
if you want portal math analysis. To get a green  portal, we need to put a red portal into the red  
10:33
portal. And this works. To get a blue portal, we  can put red into green or green into red. There  
10:38
are many ways to get a yellow degree. And for the end of this section, let's  
Rotating portal in portal animation
10:43
just look at beautiful rotations of portal  inside itself. If we pause this animation,  
10:54
we will see this beautiful picture. See how  many teleportation degrees there are.  
Base of the discrete approach
11:01
Okay, it's all clear now, but how do we unite all  this magic and make it work? If you've worked with  
11:06
physics simulation or game development, then  a naive solution is obvious. We need to take  
11:11
discrete steps and make a procedure that will  return the next simulation step from the current  
11:16
one. This is how we will make a discrete approach.  We have this scene where the object has come into  
11:24
the portal in one discrete step. By the end of  this step, we can cut the entered part entirely.  
11:30
If previously we cut by the speed of an incoming  object, then now we have a second cut approach:  
11:36
cutting along the portal's surface. And  we see that we have two different parts:  
11:41
one fully enters the portal, and the other doesn't  enter at all. And we can teleport the second part.  
11:48
This is how teleportation looks: move, cut,  return, teleport, move again. We can imagine  
11:57
something like that for portal teleportation. Now we have all the pieces to create a discrete  
Solution of "portal in portal" by discrete approach
12:02
approach. I spent months programming this a long  time ago before Portal Explorer. Here colors are  
12:09
different because of a different algorithm, but  the main idea is preserved. We have some state;  
12:14
let's continue with it. First, we find where to  cut. Like we did previously, cutting by portal  
12:19
plane. Notice when we cut the blue portal, a seam  appears on the orange portal too. Now move and  
12:25
teleport. And now join parts with the same color  which is physically near. This is needed to save  
12:32
computational resources. Now cut by portal plane  again. And here we have a new stage - cutting by  
12:38
speed knife. We see that this little piece  is caught exactly by this type of cutting.  
12:43
Previously we had two different portals nearby  too, and the border between these parts creates a  
12:48
speed knife. And now look, if we cut the incoming  portal by these borders, and these borders emerge  
12:55
from cutting, then we have recursion, and cutting  process might continue indefinitely. Fortunately,  
13:01
this doesn't work like that, and this process  will stop. In this scene, we got fortunate  
13:06
because there is a small number of parts, but  for other setups, this can work badly.  
13:12
Do you remember I said that every portal is  teleported by another independent portal? So,  
13:18
this is the essence of the discrete approach.  We cut a portal into pieces until we have each  
13:23
portal teleported by another independent portal  to get rid of paradoxes. This is the reduction  
13:29
of an impossible task to a computational one.  Everything works like that further in that scene.  
13:34
The problem is fully solved for flat portals. But  for complicated, non-flat portals, my code mostly  
13:41
worked albeit with strange bugs that I haven't  figured out yet. Let's try to put this complicated  
13:47
portal into another part of it. At first,  everything works fine but then some triangles  
13:52
appear. This is the bug. Because of that, I call  this approach naive because it's easy to invent,  
13:58
but it's ineffective and difficult to implement.  This led me to believe that I'm doing something  
14:03
wrong, and there should be a much simpler way. And I managed to invent such a method, but a bit  
14:08
accidentally. I call this the analytical approach.  I will start by explaining it on an object and  
Base of the analytical approach
14:15
then transfer this to portals. First we will  learn how to teleport a triangle. The triangle is  
14:21
defined by its coordinate system. This coordinate  system determines the plane for the X and Y axes,  
14:27
in which the triangle is located. The blue axis  is Z, the normal axis to that plane. The triangle  
14:34
remains fixed in that coordinate system,  therefore to move the triangle, we need to  
14:38
move its coordinate system. Similarly, portals  are just planes determined by two coordinate  
14:44
systems. And there is an operation called  "teleportation", which takes three coordinate  
14:49
systems and returns another coordinate system.  Here X represents the triangle coordinate system,  
14:54
and P1 and P2 are the coordinate systems of the  portals. In the interface, this coordinate system  
15:00
is created this way. So, teleported coordinate  system will be placed behind blue portal. And if  
15:05
we move the triangle, this coordinate system will  move too. So we can replace that coordinate system  
15:11
with second triangle. And when moved, the triangle  looks like it comes out from the blue portal.  
15:16
Let's push this triangle by half. If we disable  the added triangle, then we will see only one  
15:21
useful part of the first triangle. The other part  does nothing useful and must be removed. But if  
15:27
we disable the first triangle and enable the  second, we will see the same but inverted. But  
15:33
if we enable both parts, it will look like our  teleportation works but with two excess parts.  
15:38
So we need to get rid of them. And here, we  need to pause for a moment. In this program,  
15:43
I use raytracing to draw everything. For example,  let's draw a circle. To do this, we write a  
15:49
function that takes an arbitrary point on the  plane, determines if it lies within the circle,  
15:54
and returns a material number that defines  how that point should be painted.Therefore,  
16:00
if we want to filter something, we can do this  for each point independently. For example,  
16:05
we can get a circle by writing that the  distance must be lower than 1, just like  
16:10
in the highshcool definition of a circle. Now how to get rid of excess parts. Remember  
16:15
that portals are just planes. The useful part  is located in the positive half of the Z-axis,  
16:22
and the excess part is located in the negative  half of the Z-axis. Then we can add this code to  
16:28
filter excess points. In this code, we transform  the current point on a triangle surface into  
16:34
orange portal local coordinates and then if the  Z part is negative then we remove that point from  
16:40
the painting. This removes the extra part. We'll  do the same thing for the other triangle. And now  
16:47
triangle teleportation looks correct. Let's think  about what happened. We have two triangles, and we  
16:53
can say that they are two teleportation degrees of  the triangle: first and second. And we just filter  
16:58
which part is visible and which is not. But  this isn't a perfect solution, because we filter  
17:04
incoming objects by unbounded planes and not by  portal surface. So, the key idea of an analytical  
17:10
approach is: add as many teleportation degrees  as needed, then filter excess parts.  
17:16
And this is enough to solve the portal-in-portal  problem. Here everything works the same way. We  
Solution of "portal in portal" by the analytical approach
17:22
have some number of teleportation degrees, and we  filter excess parts a little smarter. But here,  
17:28
the code is more complicated; first, we have code  to transform coordinates of the orange portal,  
17:33
and then we have code to filter by planes.  The code is big for the 11th degree because  
17:38
we must filter it by 10 previous portals. I use  only 11 teleportation degrees. I can do more,  
17:44
but in most cases, this isn't necessary. This  is how all 11 teleportation degrees look without  
17:50
filtration. And they are looking very cool when  rotating together. This is how the analytical  
17:56
approach works, and it's better than the discrete  approach. But it has pros and cons. Cons:  
18:02
It works only for ray-tracing; therefore, we need  a lot of computational resources; we have to write  
18:07
each teleportation degree by hand in code; it  works only at the visualization stage, that is, to  
18:13
put physics here, we need to reinvent everything.  Pros: It can be programmed very easily; therefore,  
18:20
it's less prone to errors; it works very well for  demonstration purposes which is what I'm pursuing  
18:25
in the first place. By the way, I have an idea  how to solve the problem of the unbounded planes,  
18:31
but this is the topic for another video.  To solve this video's problem, I wrote a  
18:35
discrete approach for months, it was really hard  and tedious. But with this analytical approach,  
18:41
I made the "portal-in-portal" just in one day. And  from this example, I'm more convinced that it's  
18:47
more important to learn how to find effective  and clever solutions instead of being diligent  
18:52
in solving naively and for a long time. Okay! Now what you definitely want to know. As  
What if move next, ignoring limitations
18:58
I said, here the portal can't be moved further  than that. I'm sure that you are interested in  
19:04
what will happen if we move the portal further,  ignoring these limitations. There were no  
19:09
unbounded planes in my old code, so thanks to  it, we can see what will happen. Previously we  
19:15
stopped here. Okay, we move forward and see that  the portal is being cut parallel to its velocity.  
19:21
This occurs because the speed knife exists not  only between portals but also on borders. Now,  
19:27
this portal breaks here. On the orange portal,  these parts are located nearby, but for the blue  
19:33
portal they are placed far from each other;  therefore, here we have a deadly knife. If we  
19:39
look at this scene with light teleportation, then  it will look like that. Sorry about this rough  
19:44
visualization, the old program can't do better. As I said, to solve the problem of this video,  
About my program
19:50
I wrote this program where you can see and create  portal scenes. And every scene that I showed in  
19:55
this video is in this program. In scenes, you can  tweak different parameters. This program has many  
20:00
windows for users. This is the most important.  Here you can control the current scene or read a  
20:06
detailed description about it. This program also  has camera and rendering settings. For example,  
20:13
you can enable Panini projection or increase  antialiasing. And the next window is most  
20:18
important for me; I can edit a scene here,  and you can too if you want. And a couple  
20:23
of words about the technical details. As I  said, everything is drawn by ray tracing.  
20:28
It works on GPU through shaders. Shaders are  automatically generated using available objects.  
20:35
Matrices and sliders are transmitted by uniforms.  Uniforms can be sent in real-time, which is very  
20:41
convenient to create real-time movement. The whole thing was written in pure Rust - my  
Base of the program
20:46
favorite programming language. The interface  is made using the concept of an "Immediate  
20:51
Mode GUI". I didn't expect that I could make all  that so fast. For this type of interface, I used  
20:59
the "egui" library. This program works not only in  the browser but also on Windows, Linux, and macOS,  
21:05
thanks to the "macroquad" library. And in the  browser, this works not because it's written  
21:10
in JavaScript, but because Rust can be compiled to  WebAssembly, which can run in browsers. The source  
21:17
code of this program is available on my GitHub. I have many more portals of different complexity,  
Outro
21:23
and many more paradoxes and questions. So,  don't forget to subscribe. That's all, bye.

Intro
0:00
Regular portals have two parts: blue and  orange. They both act as input and output.  
0:05
But what about portals with three parts? Should  that duplicate matter? Or should one part do  
0:11
time-travel? Not really. I have an elegant  geometric solution, but to understand it,  
0:16
we need to understand prerequisites first.  In this video I present you not only a portal  
0:21
with three parts, but also a portal with  only one part? Afterwards we will merge  
0:26
them into an even stranger portal, and  explore other strange one-part portals.  
0:30
I discovered all of this myself.  This is the optozorax channel,  
0:34
my name is Ilya, let's get started. As we learned in my previous video, a portal  
Surface portals
0:43
is made from a doorway, but now nothing prevents  us from creating a three-dimensional doorway.  
0:49
Then we can make a three-dimensional portal  out of it. Any object still freely teleports,  
0:54
and you can even look through it from the side.  This happens because light ray teleports twice and  
1:00
returns to the original place. The only thing is  that the parts are now not symmetrical. But this  
1:06
isn't truly three-dimensional, so I call these  surface portals. A true three-dimensional portal  
1:12
is a wormhole, like you may have seen in the movie  Interstellar, and it's based on the warp of space,  
1:19
as shown in this picture. Okay, let's look at this scene,  
1:23
these look like normal portals, right? Actually  no, if we turn off the light teleportation,  
1:29
they're hemisphere-portals. But you can't really  tell that by eye! This happens because the light  
1:35
ray teleported twice and returned to its  original place, as we saw previously with  
1:39
the surface portals. So, the most important thing  about portals is their frame, not their surface,  
1:46
as the surface doesn't actually affect anything.  But for certain definitions of portals,  
1:52
it can affect something, but this is the  topic for another video. If you want to  
1:56
dive deeper into this, read the description  of this scene about non-linear movement.  
Triple portal
2:05
I know that there exists the Portal Reloaded game  with three portals, which can do time-travel, but  
2:11
it's possible to solve the question without such  concept. If you haven't figured out the solution  
2:16
at this point, you can press pause and think if  you want. A long time ago I asked this question  
2:21
to my friend Artyom Yashin, and he came up with  a very interesting option that I had not thought  
2:27
of before. It uses double-sided portals and looks  like this. To assemble it we need three doorways,  
2:34
then just move their halves clockwise. So  each piece depends on the previous one,  
2:39
and they're all connected. It's technically  correct, but it's not what we are looking for.  
2:45
Now let me tell you how I arrived at the  answer. You know how they say that some  
2:50
discoveries are made by accident? That's exactly  how I discovered the triple portal. It was about  
2:56
3 AM. I took the surface portal and thought:  it's bent, but it preserves the incoming object,  
3:02
doesn't destroy it. What if this portal cut the  incoming object? Then we don't want to think of it  
3:07
as a portal. We want portals to have the property  of not destroying the incoming object, otherwise  
3:13
why do we need such a portal if we die using it?  So that's a fundamental property of the portals we  
3:19
want. And what if we put some portal connections  at the fracture points to keep the object from  
3:25
being cut? We'll call these support portals. It  already looks like it's a three-part portal. At  
3:32
that time I drew it all on a piece of paper and  couldn't visualize the picture in my head, and I  
3:37
really wanted to see what it looks like. I didn't  have a visual editor, and I was writing in C++,  
3:43
I wrote the matrices of all parts of the portal  by hand, I compiled the code, ran it, and....  
4:03
At that moment, I felt something like this.  Yes, it turned out to be a portal with three  
4:08
symmetrical parts, the real answer to the  question. I didn't believe it would work until  
4:13
I programmed it and saw this with my own eyes.  If you go through it, nothing will happen to you,  
4:19
you'll be unharmed. You will be made up of several  parts, but portals will provide cohesion to those  
4:25
parts. This portal can connect three universes.  From the red universe you can get to any of the  
4:31
other universes: green and blue. Such a portal  can be assembled from a triple doorway, or from  
4:37
three pairs of regular doorways, as you like. And now for the beauty! Normal portals positioned  
4:43
opposite each other give a repetitive and boring  picture, even if you rotate them. But the triple  
4:49
portal is not like that. I've got a nice slider  here that allows you to move all three portals  
4:54
symmetrically. Let's pull them back and spin  them around. This makes these interesting  
5:00
rooms. And you can try so many positions, as  you can see in these pictures. Picture one.  
5:06
Picture two. Picture three. Interestingly, no  one had invented the triple portal before me,  
5:12
even though it seemed like such a simple  thing. By the way, the triple portal case  
5:18
can actually be generalized, and you  can create portals that link as many  
5:21
worlds as you want. Take a look at this weird  doorway. You can build four portals from it.  
Linear transformations
5:32
After the surface portal, we can no longer say our  portals are flat. So how do we distinguish them  
5:38
from wormholes? I believe that unlike wormholes,  normal portals perform linear transformations  
5:44
over space, incoming objects, and light. It means  that straight lines remain straight and parallel  
5:50
lines remain locally parallel. A wormhole  definitely makes the light path not straight,  
5:56
and distorts parallel lines. Moving and  rotating are fairly obvious examples of  
6:01
linear transformations. So here's a non-obvious  one: a mirrored doorway, once you enter it,  
6:07
the whole world is mirrored for you. The  next linear transformation is scaling,  
6:12
with the help of such a portal you can shrink  or enlarge objects. By the way, such portals  
6:17
were often used in the game Superliminal. And  the last linear transformation is called skew  
6:23
or shear. I don't know what it's good for,  but I just want you to know about it.  
Monoportal
6:32
Now about a portal with only one part. Can you  guess it? Here's a clue: you have two of them at  
6:38
your home, and there are 4 of these elementary  ones. You can pause to think about it. And the  
6:45
answer is this: the first simple one-part portal  is a doorway. Okay, the second one is a regular  
6:51
mirror. Yes, a mirror is also a portal, it's  just that you can't enter it because you're  
6:57
interfering with yourself. Now, what happens if  you mix their properties? You get the mirrored  
7:02
doorway we've already seen and the mirror without  mirroring. That's the answer to the question  
7:11
about the one-part portal. I call it a monoportal.  You see the text on the wall. Now, you look into  
7:17
the portal, and it's not mirrored. You can go  into it and you come out the other side.  
7:23
What's interesting is that the only mention  of this kind of portal I found is in this  
7:27
12-year-old video. And it's not magic, it's made  up of ordinary portals. Can you guess how? And  
7:35
here's the answer: take a doorway shaped  like a semi-ellipse, unfold one portal,  
7:41
merge them and then remove the borders, and  that's basically it. Here are two bare parts  
7:47
of one portal, you're probably wondering why  they don't tear both object and space? Why is  
7:54
it considered a valid portal? The first sign is  that the picture across this boundary maintains  
7:59
continuity. And next, this boundary can't tear  the object because it will interfere with itself.  
8:06
An interesting property is that such a portal  does not change the picture in any way if you  
8:11
rotate it around the vertical axis. By the way,  a mirror without mirroring can be assembled from  
8:18
two regular mirrors, this is called a true mirror,  you can watch a video from Action Lab about it.  
Rotating monoportal
8:28
This is a rotating monoportal. While our last  monoportal gave symmetry around the axis parallel  
8:34
to the portal plane, this one creates symmetry  perpendicular to the portal plane. That is,  
8:39
it simply rotates the object next to it by 180  degrees, that's why it is called rotating. To  
8:46
assemble this portal, you'll have to rotate  half of a regular monoportal in the fourth  
8:51
dimension to reflect it. Or you can assemble  it initially from a round mirrored doorway.  
N-monoportal
9:01
What happens if you cross a monoportal  and a triple portal? Does that sound  
9:06
like nonsense? Well, let's see. You get a  triple monoportal. It's a regular monoportal,  
9:12
but between its halves is not 180 degrees, but  120 degrees, which makes it look like there are 3  
9:19
parts. And it doesn't tear anywhere because of  this arrangement. The object next to it looks  
9:25
like it has three copies. In fact, you can do  it this way for any number of sub-portals 4,  
9:31
5, and so on. Or you could summon Satan. Whereas the other monoportals could reflect,  
Offsetting monoportal
9:40
rotate, and who knows what else, this portal  can do another basic transformation - just  
9:45
offset. Let's see how it is formed. It takes  a regular monoportal, and one part of it is  
9:51
shifted upwards. Then support portals are used  to eliminate the places where space is broken,  
9:57
and to connect everything together. In the end  we get a portal that shifts everything to half  
10:03
its height. By the way, I have a slider that  allows you to change the amount of displacement,  
10:08
and you can see that nothing but 0 and half height  positions work, because the picture breaks.  
Scaling monoportal
10:18
Remember the scaling portal? Can we make a  scaling monoportal? Then it would need to have  
10:24
a single surface that somehow scales up and down  simultaneously. Seems like an impossible task.  
10:30
Especially considering that our portals are made  up of discrete parts, and there would have to be  
10:36
some sort of gradual scaling to fit everything  into one surface. It doesn't look like a linear  
10:42
transformation. Let's take the offsetting  monoportal and transform its shape into a  
10:47
trapezoid. And then shrink that trapezoid so that  the portals match. That's a scaling monoportal!  
10:53
You can easily change the degree of scaling from  none to infinitely small. If you enter the upper  
10:59
part, your size will increase, and if you enter  the lower part, your size will decrease. You  
11:04
can even see it in the way the scale of  the supporting portals has changed.  
11:09
But there is another solution to this problem:  take a rotating square monoportal with a hole,  
11:15
add a doorway at the bottom, which will then  become a supporting portal. Then we reduce  
11:20
one part, keeping relative dimensions. In this  portal, the left side is larger than the right  
11:26
side. This is how the change of scale is ensured.  And the continuity of the surface is provided by  
11:32
the supporting portal. If we want to go into  the left part, we will be decreased in size,  
11:37
which can be seen from the right part. And with  the right part it works vice versa - we can  
11:42
come out enlarged. So here the problem is solved  using clever design and supporting portals. Also,  
11:49
this option can be turned into a logarithmic  spiral that increases and decreases in radius  
11:54
exponentially. From this position, you can see  through the supporting portal that the large  
11:59
part continues perfectly along the current  part, similarly with the small part.  
Tilings
12:09
Many people have probably thought of the following  set of portals. We take two pairs of portals and  
12:14
arrange them in a square. This creates an infinite  portal room. It's almost like a mirror room. If  
12:20
we paint the walls of different portals with  different colors, we get this picture. This  
12:26
portal can be assembled in an alternative way,  and then we will get a different picture in the  
12:30
portal room. By the way, exactly the same room  can be assembled from hexagons. Ideologically,  
12:36
it is no different from a square room. And  there is an alternative position, which  
12:41
also alternates colors. It's called a tiling,  and I have shown you two regular tilings.  
12:47
Do you think it is possible to create a portal  in the form of a triangular tiling? Actually yes,  
12:53
and that's what it looks like, and it's pretty  simple to assemble - take the monoportal and bend  
12:59
it into a triangle. It turns out that all three  of these portals are also sort of monoportals,  
13:06
because they have one part, and one continuous  teleporting surface. But what about semi-regular  
13:12
tilings? Take this handsome fellow, for example. I  figured out that only three parts are enough: two  
13:18
triangular and one square. In this picture you can  see a scheme of how to assemble it from regular  
13:23
pairs of portals. This is how it looks with light  teleportation. First, you can see that the floor  
13:29
is light and the ceiling is dark. You can see  that some of the portals have a picture of the  
13:34
dark ceiling, simply because they're upside down.  And if you look inside, you get this set of rooms.  
13:41
Like any triple portals, they can all be arranged  into all sorts of interesting fractal pictures.  
13:47
But I won't focus on that. Of course, in exactly  the same way, other tilings can be made.  
Outro
13:55
As always, you can try out every scene  that I showed here in my web demo!  
14:01
That's all that I have for you in this video,  but I'm already making another video on portals,  
14:06
so subscribe if you don't want to  miss it. Thanks for watching, bye!

0:00
Let's take the input and output of a portal.  Then roll them up against all laws of logic.  
0:05
Surprisingly, everything keeps working. And when  we roll it all the way up... then we have what  
0:11
I call the Cylindrical Portal! Let's turn off the  light teleportation, so we can see the teleporting  
0:17
surface of this portal. We can see that it  is completely open on one side and completely  
0:22
closed on the other. At the same time, objects can  pass through it, and they won't interact with the  
0:27
inside of the cylinder at all. To help visualize  this let's make two rooms - red and blue,  
0:33
one room will have one part of the portal, and the  other room will have another part. We will start  
0:38
with a flat portal. After rolling it, we see that  a light ray goes through the blue room and back to  
0:44
the red room. Roll it all the way up again. If you  look at the blue part from the top and bottom, it  
0:50
is a simple cylinder that can be placed anywhere.  If you look at the side, you can walk through it.  
0:56
With the orange portal, it's the opposite. The cylindrical portal is one of the most  
1:01
unusual portals in my opinion, and it is  incredibly practical. You can use it to  
1:06
make a table without legs. To do this we take  4 cylindrical portals, and put them on a table,  
1:12
now it stands firmly on the ground, but does  not interfere with legs. Another application  
1:17
is that you can make a piece of perfect armor.  We can put portal cylinders on this stickman.  
1:23
But it has weaknesses like regular armor, with  the gaps at the joints where body parts move.  
1:29
I invented this portal myself, and haven't  found anything similar on the Internet.  
Intro
1:37
If this was too much space-bending for you, you  may want to watch my two previous videos. In the  
1:43
first video we learned that a portal can be  made from a doorway and what happens if you  
1:48
put a portal in a portal. In the second video we  saw how it's possible for portals to be non-flat  
1:54
and how we can create a portal with three parts.  Further in this video we'll look at even stranger  
2:00
and more absurd portals. There's a Mobius strip, which is  
Mobius strip
2:07
already quite a mind-blowing thing. It's a shape  with only one side. Can we make a portal from  
2:13
it? I was puzzled by this question in my Telegram  channel back in 2021. And I wanted to see it for  
2:20
myself. This was the trigger for almost the entire  portal thing that I am now publishing. I'd like  
2:26
to tell this little story. To start solving this  question, I made the MVP of raytracing on shaders,  
2:32
which runs in a browser. Then I made the first  demo with portals in the form of a Mobius strip,  
2:38
where you could only rotate around with a mouse.  Then I experimented with the so-called immediate  
2:44
mode GUI, and it was unreasonably productive. I  sat down and very quickly made a visual editor,  
2:50
which helped me to visualize a bunch  of portals. Then in the process of  
2:54
experimentation I accidentally discovered that  it's very easy to make a portal in a portal in  
2:59
this editor. And that's it, I was doomed to  create a video about the portal in a portal  
3:04
from that moment, and then this video too. But I digress. The issue was eventually resolved,  
3:11
and this is what the portal from the Mobius  strip looks like. The blue one teleports to  
3:16
the orange one and vice versa. In general, they  look like regular portals opposite each other,  
3:21
only with a complex shape. To better show how  this shape works let's teleport objects. If we  
3:27
move this object, it just teleports like  with regular portals. Or we can try this  
3:32
position and teleport the object to this side,  and if we look at the back of the orange portal,  
3:38
we can't see the object. It looks like regular  two-sided portals, but a Mobius strip has only  
3:44
one side. Similarly if we look at the blue portal.  Don't worry, this works exactly the same way as  
3:50
normal portals, it just looks strange. My tweet about this portal got popular.  
3:55
From the comments, I found out  about the program called PolyCut,  
3:59
developed by Professor Ken Brakke. He published  the latest version back in 1997. By the way,  
4:06
the author of this video was born in '98. This  program shows many interesting portals, including  
4:12
a Mobius strip portal that looks identical  to mine. So I kind of discovered this myself,  
4:17
but someone beat me to it before I was even born.  He has more interesting variants of the Mobius  
4:22
portal in his program here, this one can teleport  to 3 universes, but it uses a trick in the form of  
4:28
a circle in the center of this structure. What happens if you cross a monoportal and the  
Mobius monoportal
4:36
Mobius strip? Let's start with regular Mobius  portals. Move them towards each other, rotate one  
4:43
portal along the vertical axis to make sure they  match in shape after that transformation. Separate  
4:50
them and remove halves in the same places. And  put them together. The process is very similar  
4:56
to creating a regular monoportal. After trying  different ways, this is the only method that  
5:02
gives a working Mobius monoportal. Now we've got  a real Mobius portal in every sense: one side,  
5:09
one portal. It teleports from its left side to its  right side, just like regular monoportal.  
Hopf link
5:20
In topology, one of the basic shapes is a  Hopf link or a simple chain element. It can  
5:26
also be used to make a portal, and this is  how it looks. The central part disappears,  
5:32
because the light is teleported twice here. I  don't know how to realistically assemble this,  
5:37
but in the simulator I just had to  connect the two pairs like this.  
Trefoil knot
5:48
The portal from a knot. I would never have come up  with this myself, I'm just repeating what other,  
5:54
smarter people did. There's an ordinary  knot. You can hardly make a portal out of it,  
6:00
because it has open ends. But! If you merge its  ends, you get what's called a trefoil knot. The  
6:07
Wikipedia illustration already show the knot  colored to resemble portal parts. And yes,  
6:12
you can make a portal out of it. I wanted to  avoid round shapes with this, because they  
6:17
require a lot of math for rendering. So I decided  to take a simpler route. There are several simple  
6:24
forms of this knot. The first consists of  sticks, and it's right there on Wikipedia.  
6:40
The second one is called cubic trefoil knot,  which looks as follows. I only found out about  
6:46
the second one thanks to Zeno Rogue, who made  this portal and tweeted his results. By the way,  
6:52
I saw this shape on the streets of my hometown  Almaty in Kazakhstan, when I was riding a bike, it  
6:58
definitely was installed by a man of culture. I started by cutting this knot out of paper and  
7:04
understanding how it's constructed, and found that  it has three identical parts, each of which looks  
7:10
like this. This part has a normal boundary,  and another boundary to touch other portals,  
7:16
then there is a front and a back part. The front  and back are independent of each other, so we can  
7:21
connect them to other portals. I call this part  letter A. The second part is just rotated and I  
7:28
call it B, and the third way of rotation I call  C. If we place all these parts together, without  
7:35
any portals, we see a regular trefoil knot. To  turn it into a portal, we need to tell which  
7:41
front part will teleport to which back part. Let's take two knots. This is how they look in  
7:46
the interface of my program. The front part A  teleports to 1a, which is actually a doorway,  
7:52
similar to 1b, 1c. The second knot also teleports  to itself. What if we make the front of 1a  
8:00
teleport to the back of 2a, and similarly with  the rest of the letters. And we get two portals  
8:06
from the trefoil knot! It connects the two worlds,  and going through the sides takes you to the other  
8:11
world, while the center keeps you in the same  world, because passing through twice returns you  
8:16
to the start, roughly how it works with a surface  portal. If we place an object in the center of  
8:21
such a portal, we can directly observe the effect  of no teleportation in the center. In this case  
8:27
from the side the object is not visible,  because we're looking into the blue world,  
8:31
where the object is not present. And in the  blue world it is visible only from the side,  
8:36
because we look into the red world from here. This approach is very easy to scale, and you can  
8:42
make a triple portal from the trefoil knot. Just  click and we're done! Here in the center we see  
8:47
the green world, because this world is located  after two teleportations. When we put the object  
8:53
at the green world's entrance, then we should  see the object in the green world. In the blue  
8:58
world you can only see it from the side, in the  parts that teleport to the green world. But in the  
9:03
green world, the object is expectedly visible from  behind. I hope the example of the object shows how  
9:10
this set of portals works. Of course, you can make  a quadruple portal in the same way. From the front  
9:16
it will look the same as the triple portal, and  from the back we will see the last yellow world.  
9:22
The structure is a shifted diagonal matrix. Now let's talk about my favorite monoportals.  
9:28
Is there any way to make them here? Of  course we can! Look, we have one part,  
9:34
it has a front part and a back part. What if we  teleport the front part A to the back part B,  
9:40
then B to C and C to A, roughly like we did with  some triple portal from the previous video? This  
9:46
creates a monoportal that rotates objects! Let's  put the object in the center of this portal,  
9:52
which has the blue part looking up and the red  part looking down. If you look from behind,  
9:56
you can see the portal rotating it, but from  the side you can see a different rotation.  
10:02
And now can we make something adequate out of  two parts? Let's just remove the third part,  
10:07
and make one teleport to the other and vice versa.  Now, where does this bottom pipe go? Wow, it  
10:22
works! This portal looks like it's hiding inside  itself! That's why it's called self-hiding. If you  
10:28
put the object in this corner, you can see it from  the back side here. Here you can clearly see how  
10:34
the front part is connected to the back. Next, you  can make three self-hiding portals that connect  
10:39
three universes! The structure is immediately  clear from this interface. By the way, only this  
10:45
self-hiding version was already presented in the  PolyCut, the author called it trefoil partial.  
10:52
The next combination with a self-hiding  portal is two regular trefoil knots and  
10:56
one self-hiding one. In such an interesting  combination, there is always one part that  
11:02
doesn't teleport anywhere. This one came from a  Zeno Rogue video about trefoil knot portals.  
11:08
The next portal was invented by Bill  Thurston, at least in 1992. In his video,  
11:13
he explains the theory of knots through  the transformation of the trefoil knot  
11:18
into portals. He came up with a portal that could  connect 6 different universes, designed and drew  
11:24
a diagram of it. He did this before the famous  game appeared, and without any computer graphics,  
11:29
which is pretty epic. So Bill shows a portal  that must connect 6 worlds, and each entrance  
11:36
must lead to a different world. If it wasn't  for the second condition, then we could make  
11:41
this diagonal and get the right portal. When I  tried making each part lead to a different world,  
11:46
I couldn't do it. It was very complicated. I didn't have time to think, so I had to go to  
11:52
my favorite PolyCut and steal the structure from  there. This is what it looks like. I would have  
11:57
spent days figuring this out. It's called the  portal to Narnia, and it connects 6 worlds in  
12:03
such a way that from each portal you can see  every other world, our diagonal portals can't  
12:08
do that. But that's not its only interesting  feature. It turns out that in all past portals,  
12:14
if you trace along the boundary-pipes, it is one  single continuous pipe, which is tied in knots in  
12:19
space. You can see this using these color buttons.  If you click and look at the portal, you will  
12:25
quickly realize that it can be painted only in one  color. But the portal to Narnia has 3 independent  
12:31
borders, which do not overlap in any way! There might be more portal forms from this  
12:37
knot that can fit into 6 worlds. I tried to make  other portals, even made an interface for this,  
12:43
but I didn't find anything. I thought about  automating the search, but I decided not to,  
12:49
because I've already spent a lot of time on this  scene. So, viewer, here's a challenge for you:  
12:54
find new interesting working portals from the  trefoil knot. For example, you can formalize  
12:59
the validity of a portal and write a program  that tries all possible variants. You don't need  
13:04
special knowledge for this. If you find something  then write to me, I will add it to the program.  
Other portals
13:14
These are the most interesting portals that I  know at the moment. There are some others that  
13:19
I didn't do, because they won't bring anything  fundamentally new, but they worth mentioning  
13:24
anyway. For example, the figure-eight knot,  which is also available in the wonderful polycut,  
13:29
with all possible variants of self-hiding  portals. And there is also a cubic form  
13:34
for it, and surprisingly it was invented not by  mathematicians a hundred years ago, but by members  
13:39
of the ZenMagnets community. Ideologically,  the figure-eight knot is no different from the  
13:45
trefoil knot, so I didn't waste my time on it. The next interesting figure is Borromean rings,  
13:51
which look like a regular chain. But this image  is misleading, this is an impossible figure,  
13:57
you can't make this from regular rings.  On the Internet I found a couple ways to  
14:01
create this figure. The first one uses curved  corners, and it looks most like the original.  
14:07
And the second one uses ellipses, but it is  not very similar to the original image. This  
14:12
is also not really different from the Hopf  link, this is why I only mention it here.  
Outro
14:18
As always, everything from this video is available  on my web demo. It works from a phone too.  
14:34
Now you're thinking with portals.

Intro
0:00
We already know what happens if you put a portal's  exit into its entrance - it comes out of itself  
0:05
and hits the edge. But what if we make it small  enough so it fits? You've asked me this countless  
0:12
times, and I was curious myself, but it broke  in my program and I had no idea how to solve  
0:17
it. Until NOW. I finally have the solution -  let's check it out. Look at this tiny portal:  
0:24
it's moving forward, forward... and it  emerges... somewhere. Let's revolve around,  
0:29
wait... Where did it go????? The portal  created a pocket dimension??? Yes - and this  
0:34
is the correct answer, which we'll explore  in detail in this video. The key to all of  
0:39
this is one overlooked portal axiom that not  only explains this result, but also unlocks  
0:44
amazing new possibilities for other portals and  completely flips our understanding of portal  
0:50
physics! You're on the Optozorax channel,  my name is Ilya - let's get started.  
0:55
Let's take two portals; they can teleport an  object. If we turn off light teleportation,  
Teleporting surface
1:01
then we can see the teleporting surface. When  crossing this surface, an object or light  
1:06
teleports to the other portal. That's exactly  how it works in my program: when a light ray  
1:11
hits this surface, it jumps to another location  and keeps going. In one of my previous videos,  
1:17
I showed an axiom that says "a portal's behavior  doesn't depend on the shape of its surface". So we  
1:23
can make it hemispherical, and nothing really  changes. Let's dive into how this works.  
1:29
First, let's look at how a light ray behaves with  different surfaces. A light ray that starts here  
1:35
and going in this direction doesn't change at all.  But if we make the shape hemispherical, the light  
1:40
ray first teleports to the orange portal, then  back to the blue one, and ends up in exactly  
1:46
the same spot as with the flat surface. This  explains why changing its shape doesn't affect  
1:52
how portal looks. Object teleportation works  the same way. But look - with a flat surface,  
1:59
the back part is flat, but with the other surface,  it looks completely different. That doesn't really  
2:05
match our axiom. To solve this problem, we can  turn the back surface into a portal too. It  
2:11
turns out this axiom only works for two-sided  portals, which we haven't explored before.  
2:17
By the way, notice that at some point the object  doesn't actually teleport, but it looks like it  
2:23
did. As if the teleporting surface is drawn around  it. What if we do the same with a portal? Let's  
2:29
take an ellipsoidal portal with a similar surface  and place it inside itself as far as it can go.  
2:36
And here's how it looks with light teleportation.  Now it looks like the orange part teleports  
2:42
the blue part, although this doesn't actually  happen. Remember how I used to do this before?  
2:48
I created multiple degrees of teleportation  and filtered them in a special way. So I could  
2:54
have skipped all that work and just made such a  teleporting surface to get the same result?! Well,  
3:00
it turns out these approaches are equivalent. So  the next logical step is to take a small portal  
3:06
with a hemispherical surface and simply place  it in the orange part. And that's the entire  
3:12
solution - inside, we get a pocket dimension. Later in the video, we'll discover if it can be  
3:19
moved indefinitely, figure out how infinite space  emerges, and conduct many experiments. But first,  
3:25
I want to tell you how I came to this discovery.  After publishing my previous videos, I thought  
How the discovery was made
3:31
I'd shown absolutely everything possible, and  there was nothing left to discover about portals.  
3:37
Scrolling through Twitter, I found this message:  "you can actually put a portal INSIDE itself fully  
3:42
by using the half-sphere portals". I thought:  Hmm, nothing interesting - the guy just moved  
3:48
a portal. Of course, a small hemisphere will  fit in a large one. But hemispherical portals  
3:54
work exactly the same as flat ones. SO HE PLACED A  FLAT PORTAL INSIDE ITSELF??? I was flabbergasted.  
4:02
This discovery is what led me to quit my job  and focus on YouTube to make this video. And  
4:08
this guy deserves credit - he did this using a  scene editor to get this result. Before that,  
4:14
I had tried to solve the small portal problem in  a million ways, analyzed all possible matrices,  
4:20
tried different calculation methods, but  nothing worked, and I eventually gave up.  
4:26
But let's figure out why exactly this  axiom is true - beyond the fact that it  
4:31
just looks right. There are two types of  portals: scanner-printer and spatial.  
"Scanner-printer" portal
4:37
A scanner-printer portal scans and destroys  an object on one side and recreates it on the  
4:42
other. This would need tons of energy, and this  kind of portal could theoretically exist in our  
4:49
world. But it disobeys our axiom, because it has  only one active surface, and its shape affects its  
4:56
behavior. Later in the video I'll propose  an experiment to measure this surface.  
5:03
Now about the spatial portal. I borrowed this  clip from the video "The Shape of Space",  
Spatial portal
5:08
which I highly recommend. It shows how a torus  unfolds into a flat sheet of space. A torus has  
5:16
such a structure that in the flat version, the  right side leads to the left, and the top leads  
5:21
to the bottom. You could say this works just like  portals. And these portals create this shape in  
5:27
the form of a torus. So what would the shape of  space look like for our portals? To show this,  
5:35
I wrote an entirely new program capable of  simulating this curvature of space. For example,  
5:41
this is how a flat torus looks in it - we see that  the blue square teleports between top and bottom,  
5:48
while the green square teleports between the right  and left edges. My program glues left to right  
5:54
and top to bottom. Then it runs a simulation  to which shape this will lead to. It moves  
5:59
in a funny way and converges to a torus. With  this torus, both squares end up continuous.  
6:07
Next, let's take this scene on a plane. Here  we have a two-sided portal. The blue square  
6:12
teleports and moves in a circle, while the green  one simply teleports. In the simulation, this part  
6:18
of the portal is glued to another part. I start  the simulation, and it converges to this shape.  
6:24
As we can see, the green square doesn't appear  to teleport at all. And if we rotate the view,  
6:30
we can see a cylindrical surface in the back, and  the blue square moves in a circle within it. And  
6:36
when viewed from this angle, it resembles  a visual representation of a wormhole.  
6:41
Now let's examine a portal with a different  teleporting surface. Similarly, this surface  
6:46
in one place is glued to this surface in  another place. We start the simulation,  
6:52
and it converges to exactly the same  shape. You could say that portals in  
6:56
this configuration inherently define this shape,  and the teleporting surface is simply our choice  
7:03
of how we cut through that shape, to represent  space in a flat way. This means the teleporting  
7:09
surface is a virtual entity - something we use  for our convenience. And that's exactly what  
7:15
justifies the axiom introduced in this video. From here, we can derive many interesting things.  
7:22
For example, a doorway and a portal represent  the same local space. Furthermore, we could say  
7:29
that a portal doesn't just have one teleporting  surface, but that all possible surfaces exist  
7:34
simultaneously - and at the same time, none of  them truly exist. Also, for a spatial portal,  
7:42
there's no such thing as "before teleportation"  and "after teleportation." Now, let me clarify  
7:49
that I'm using hemispherical portals only because  they're easier to program. In reality, the surface  
7:55
can be anything: flat, hemispherical, zigzagging -  it can even intersect itself. The only constraint  
8:03
is that one part must not intersect the other,  as shown here. But actually, even a broken  
8:10
surface like this can be fixed. We just need  to teleport this piece to the orange portal.  
8:16
However, I avoid doing that because those are the  same calculations as degrees of teleportation,  
8:23
and they're not easy to implement. This is just a quick tour of my new  
8:27
space curvature simulation program. I haven't  explained how it works, why there are holes here,  
8:35
what the Nash embedding theorem has to do  with this, and much more. In the future,  
8:40
I'd also like to simulate the curvature of  space for a portal inside another portal  
8:45
or for a moving portal. But all of this will  take a lot of time and effort. Let me know if  
8:51
you want a dedicated video about that. Now for the experiments. Let's see how an  
What if you place an object inside?
8:57
object passes through such a portal. Without  light teleportation enabled, nothing unusual  
9:02
happens - the object simply gets bigger. But when  light teleportation is on, we see multiple copies  
9:08
of the object. It's important to understand that  these are only reflections: there's always just  
9:14
one object; you can't physically duplicate it.  You can even rotate the view inside the portal  
Where does the infinite space come from?
9:19
and look at all these reflected copies. This leads us to the next question:  
9:24
how does infinite space appear inside the  portal, and why is it so dark in there?  
9:30
I created a new feature for the camera - now it  can teleport through portal. To demonstrate this,  
9:36
we rotate inside a portal-within-a-portal scene.  Here's how it looks with light teleportation,  
9:43
and here it is with both modes enabled. Each  time we teleport, we see only two hemispheres.  
9:49
But because the portals work so seamlessly, we  don't notice the transition. This is how infinite  
9:55
space is formed: with each teleportation, you  become smaller and smaller, which means you can  
10:00
fit infinite space inside a finite volume. By the  way, I want to emphasize that the pocket dimension  
10:08
technically exists right here, between the two  portals. Nothing actually separate from the  
10:14
universe is created - it just appears that way. So, why is it so dark in there? Because many light  
Why is it so dark in there?
10:21
rays get stuck in teleportation loops. We can  demonstrate this by flying in this direction.  
10:26
Let's turn on the dual-mode display. As we fly, we  see constant teleportation, but no visible exit.  
10:33
In my program, when a light ray gets trapped and  teleports endlessly, it's rendered as black.  
10:40
Now let's take a look at another scene. Here, two  portals are facing each other, and the small one  
Two portals face to face
10:45
enters the larger one head-on. This resembles that  gif where two portals move toward each other - or  
10:52
that video you've probably seen. With flat  portals, this would be an unsolvable situation.  
10:58
But now, we can place the small portal inside.  We fly through it and turn around - and we see a  
11:04
pyramid of all degrees of teleportation stretching  in both directions infinitely. It's still just one  
11:10
portal, but the space is folded in such a way  that we perceive multiple copies. Just like  
11:16
with the object, there's only one instance. And can we move this portal forward infinitely?  
11:22
Let's take this shape and move it. As soon as it  touches its own surface, everything breaks - one  
11:28
part of the surface begins to intersect the other.  But since the portal is smaller, we can keep  
11:33
increasing the length of its surface indefinitely,  allowing it to move farther and farther without  
11:38
intersecting anything. So yes, the portal can  move forward forever. And this is what it would  
11:44
look like. Just make sure not to drop anything  into such a portal - or it'll be lost forever.  
11:50
For infinite movement in other scenes like  this one, we need to change the shape of the  
Why this approach is not universal
11:55
surface in smarter way, but it's generally  possible. This is the main limitation of  
12:00
this surface-shape approach. The surfaces must  not intersect, otherwise the image breaks and  
12:06
becomes nonsensical. It turns out we can't  come up with a single portal surface that  
12:11
will work in all cases - for each individual  case we need a new surface shape. For example,  
12:17
let's recall these ellipsoidal portals. Here,  the hemispherical surface has reached its limit,  
12:23
it touches the boundary, we can't enlarge it  anymore, but with light teleportation we see that  
12:29
the portal hasn't fully entered the other portal.  My flat portals with degrees of teleportation  
12:35
worked perfectly in such situation. So we need  to devise a new, more complex surface shape for  
12:41
the portal to fully enter here. Or we need to  somehow combine these two approaches into one,  
12:47
so that it can solve all possible problems. I've  already found a solution and it's very unusual,  
12:54
but more on that in the next video. Also in the  next video, I'll show whether it's possible to  
13:00
put a normal-sized portal inside itself. So  be sure to subscribe so you don't miss it.  
13:06
Another reason why this is an incredible discovery  is that this idea can even be generalized to the  
Generalization to a triple portal
13:12
triple portal, which I showed in this video.  The regular triple portal is one-sided,  
13:19
because it has this closed back surface. And to  make it two-sided, you need to add another portal  
13:24
to each part, so that each part looks like the  letter Y. Now our axiom works for this portal.  
13:31
This means we can create a non-flat teleportation  shape like this, using a third of a sphere. It's  
13:37
quite non-trivial shape, but it works exactly  the same as ordinary triple portals. And since  
13:43
we have such a shape, now we can place two portals  into another one, let's say like this. Let's get  
13:49
closer, turn on light teleportation, and we  can revolve inside just like we did for other  
13:55
portals. Here we get such a beautiful and  complex fractal, because the triple portal  
14:01
connects space in a more complex way. And the same can be done with a cylindrical  
Generalization to a cylindrical portal
14:06
portal! Here, you can inflate the surface  like this, and the portal will work exactly  
14:11
the same way. Now let's shrink one part and place  it in the center. Next, let's fly in. We see that  
14:18
there is an infinite black space again. And the  portals are arranged in the shape of an hourglass.  
14:25
Let's turn off light teleportation and inflate the  surface again so that the portal can move beyond  
14:31
the flat boundaries. And now the same movement,  but with light teleportation turned on. And from  
14:38
this position, you can rotate this portal. This  new approach is perfect for creating mesmerizing  
14:44
animations. Or you can rotate it another way. It's  interesting how the angular velocity of rotation  
14:53
increases to infinity as the size decreases. Now about the physics. Let me clarify that I'll be  
Portal movement without acceleration
15:01
using the terms "before teleportation" and "after  teleportation" because it's easier to program and  
15:07
reason about different surfaces. And it's easier  to understand what leads to contradictions and  
15:12
what doesn't. We need to remember that no place  before or after teleportation exists anymore.  
15:19
Let's take this scene, which we've already  discussed in one of my previous videos.  
15:25
There's no gravity or air resistance here. The  portal moves uniformly and in a straight line,  
15:31
by inertia, it has no acceleration, and it doesn't  stop anywhere. Before teleportation, the object  
15:39
is stationary, and it moves after teleportation.  People don't like that the object somehow gains  
15:45
momentum in this scene. After all, portals work  like doorways, and when a doorway runs into you,  
15:52
nothing happens. Yes, because in a doorway, the  entrance and exit move at the same speed relative  
15:58
to each other. But in this case, they move at  different speeds. People probably assume that  
16:04
the portal should behave something like this, when  the object stops immediately after teleportation  
16:10
to avoid gaining any momentum. We remember that  this can't be the case, because there is no moment  
16:17
after teleportation. But let's try to follow  this logic. I think everyone agrees that the  
16:24
object should be stationary BEFORE teleportation  right here. So here's the big brain move - what if  
16:30
I make a teleporting surface like this? Here, the  object NEVER teleports and it's always stationary,  
16:36
but it looks as if it teleported and gained  momentum. As we remember, any law of portals  
16:42
must work the same for all surfaces. So for this  scene the only working option is the movement  
16:49
after teleportation. This kind of stopping can  only work for one flat surface. But movement  
16:56
after the teleportation works for any surface. But  this is only if we accept this axiom, which gives  
17:02
such incredible results as pocket dimension. Let's continue. In this scene, the portal moves  
Portal movement with acceleration
17:09
in a circle instead of a straight line -  which means it's constantly accelerating  
17:14
and changing direction of its speed. Let's  add an object here. And now the question is:  
17:19
how will the object move after teleportation? The  first option - it will move in a straight line.  
17:26
Look, before teleportation it moved in  a circle, this is the gray trajectory,  
17:31
and after teleportation it started moving in a  straight line by inertia, and acquired rotation.  
17:38
This fits a scanner-printer portal, which  has a specific surface that exerted force on  
17:43
the exiting object, so now it moves according to  the normal laws of physics. And this is a way to  
17:49
measure the surface of a scanner-printer portal  when we can't see it. In the same situation,  
17:54
we launch multiple objects before teleportation,  they move in a circle, and then they start moving  
18:00
in a straight line. If the surface were different,  for example hemispherical, the objects would start  
18:06
moving in a straight line at a different moment  in time, and by using this we could calculate  
18:11
this surface. The second solution to this problem  - the object continues to move in a circle. This  
18:18
fits perfectly for spatial portals. And that's  because we can design such a surface where the  
18:24
object never teleported, but it looks like it's  moving in a circle. This is even better seen if  
18:30
you stand in the object's position. So what does  this mean? It looks like action at a distance  
18:35
that applies to everything that passes through  portals. If you entered a portal and it started  
18:41
moving differently, then this will affect you  from any distance. This is absurd! This is a very,  
18:47
very bad result and a real reason to doubt our  axiom! Or something else needs to be rethought.  
18:55
And now my favorite picture. If you don't know it,  pause and decide what you'd choose. I've always  
That physical paradox, again
19:02
been for option B where the object flies out of  the portal with some speed. And I never understood  
19:09
supporters of option A, where the object stops  immediately after teleportation and slides down.  
19:15
But now I understand that there's more than meets  the eye. This picture is essentially a combination  
19:21
of the two previous scenes. First, the portal  moves without any acceleration at a constant  
19:27
speed, and then it stops. And this stopping moment  is what I've been ignoring all this time. After  
19:34
all, this is accelerated movement, which gave us  an absurd in the previous scene. Now what if we  
19:40
make a hemispherical teleporting surface for the  portal? When the portal stops, it never teleported  
19:45
anything and the object was always in its original  place. So, then option B is correct for a flat  
19:52
surface, and option A is correct for hemispherical  surface. And which one to choose? I don't have an  
19:58
answer, but I have something better - direction  to an answer. Portal gravitational waves! I think  
20:05
that an accelerating portal should emit something  like gravitational waves that propagate at the  
20:10
speed of light and affect objects, thus we can  avoid action at a distance. It seems that when  
20:17
stopping, the gravitational wave should somehow  slow down the object, and the final answer should  
20:22
be something in between A and B. But to research  this, one needs to know the theory of relativity  
20:28
and its math, but I'm not familiar with this.  So my friends, I'll leave the physics to you,  
20:35
while I responsible for the geometry. But  again, this is just an idea! Maybe I'm wrong  
20:41
and everything should work differently. As always, you can try out every scene that  
Outro
20:46
I showed here in my web demo! And  now there's another one too.  
20:52
For the next video, most of the work is already  done, it will be coming soon. By the way,  
20:58
now I have a Discord server where you can chat  about portals. And thanks for watching!

0:00
This video is sponsored by  Brilliant, more about it later.  
0:04
In this video, we'll look at how regular  normal-sized portals can create infinite  
0:09
recursive space. We'll use them to create  really beautiful structures. Then I'll  
0:15
explain how it works, and then represent them  as teleportation surfaces. And at the end we'll  
0:22
even understand a bit of portal topology. In the last video, many of you asked me to make  
Camera rendering
0:28
the camera visible. I've added it - this  is the camera, or you could say it's you,  
0:34
the viewer. You'll see it in the  main scenes, but not in all of them,  
0:38
since I have to program it differently for each  scene. So I hope you'll cut me some slack here.  
0:45
In the last video, I showed what happens when you  place a small portal inside a large one - you get  
The problem
0:51
a pocket dimension, and we did this using a  curved portal surface. The whole construction  
0:58
was based on one portal being smaller than  the other, so the surface of one part could  
1:05
fit inside the other. This raises a question -  is it possible to pull off the same trick when  
1:12
both portals are the same size? Because when  you enlarge the small portal, its surface will  
1:18
also enlarge, and eventually it won't fit  and everything will break. It is possible,  
1:25
and here's what it looks like. And now we get  a fair infinite space. But how does it work?  
1:33
So there are two concepts for calculating  portal-through-portal teleportation. The  
1:38
first is teleportation degrees, where we create  copies of the portal and filter their parts - I  
1:45
explained this in detail in this video. The second  way involves creating a clever teleportation  
1:52
surface that never intersects the portal, and we  don't have to teleport anything or create copies.  
1:59
The issue is that first method works great in  almost all cases, but breaks when we try to place  
2:06
a small portal in a large one. The second method  works for a small portal in a large one, but it's  
2:12
very limited - it's unclear how to program  these surfaces to work in the general case.  
2:19
So next I'll explain how I improved  the first approach with teleportation  
2:24
degrees so it works for a small portal in  a large one too. But before I get to that,  
2:30
I want to say that for surface approaches I'll use  two-sided portals, because that's their natural  
2:36
state. And for teleportation degree approaches,  I'll always use one-sided portals, because it's  
2:44
easier to program and it gives you less visual  noise. You can imagine it's actually a two-sided  
2:50
portal that just has its back covered. Let's recall how the teleportation degrees  
Teleportation degrees
2:56
approach works. First, we take two coordinate  systems that will define our portals, and then  
3:03
place these portals at these locations. If we send  one portal into another, then nothing happens when  
3:10
they intersect, because we didn't yet program  any behaviour. We can see there's an extra part  
3:17
behind the orange portal that technically entered  the portal and should be teleported. Actually,  
3:24
if you think about it, we never need anything  behind the orange portal, so for all future  
3:29
parts I'll write code to remove them when they  go behind the orange portal. So we have our  
3:36
first break - above the portal. It can be fixed  if we continue the blue part here. To do this,  
3:43
we teleport the coordinate system of the entering  portal from the orange portal to the blue portal  
3:49
and get a new coordinate system. I call this  the second teleportation degree. We can place a  
3:55
new portal on it. Here we see this new part looks  okay, but we need to remove the back part behind  
4:02
the blue portal. We remove it and now everything  works. We move further, and have a break again.  
4:09
To get a new teleportation degree, we need to  teleport the second teleportation degree from  
4:15
the orange portal to the blue one, and we get  the third teleportation degree. Then we do the  
4:20
same operations - add a new teleportation degree  and filter it. So the algorithm is that when the  
4:27
portal image breaks - you need to add a new  teleportation degree. And with this approach,  
4:33
you can add them infinitely. Only those  that do something useful will be visible.  
4:39
I want to say that this teleportation degrees  approach works perfectly as long as our portals  
4:45
are the same size and as long as they don't  intersect boundaries. No matter how hard I tried  
4:52
to place a portal inside itself without hitting a  wall - I couldn't do it. By the way, in the last  
4:59
video I said I created all teleportation degrees  manually, but now they're generated automatically  
5:06
and there can be as many as needed. Now let's look at a small portal entering a large  
Improving teleportation degrees
5:12
one. And this is where it breaks, and the problem  is that new teleportation degrees won't help here.  
5:20
Because all these teleportation degrees are behind  the orange portal and they all get filtered and  
5:26
disabled. This is exactly where I gave up in  the past, because I couldn't imagine that it  
5:33
was possible to fix. But now we have hemispherical  portals, which can give us a clue to the solution.  
5:39
My plan was to take screenshots at the same camera  angles and figure out what's happening and how to  
5:45
program it. And here's what I understood. First,  a new type of break happens when this small blue  
5:52
part enters its larger version. And it enters  completely, not partially. Also, before, portals  
6:00
were exclusively outside and didn't create new  space. But now with these hemispherical portals,  
6:07
we get something like a separate space. So if we  want to simulate this with flat portals, we have  
6:13
no choice but to program a separate space with a  black background at this new break location. So  
6:20
the new break becomes a portal to a black pocket  dimension, with only this one part visible. OK,  
6:26
so what should be in this space? When I looked at  the screenshots, I realized all the teleportation  
6:33
degrees of the entered part should be there. OK, I  implemented this and let's compare the images with  
6:40
the hemispherical situation. Hmm, some portals  are missing. I increased the number of rendered  
6:47
teleportation degrees, but nothing appeared. And  here you can see we need teleportation degrees  
6:53
in the reverse direction, or in other words,  we need negative teleportation degrees.  
6:59
Previously, I teleported the blue portal from  the orange portal to the blue portal and got  
7:05
new teleportation degrees. And these were portals  that could be seen through the blue portal. But  
7:11
what about portals visible through the orange  portal? What if we teleport the orange portal  
7:17
through the blue portal? Then we get different  portals and these are the ones that go in the  
7:23
reverse direction and fit this situation. After  adding them, the new approach starts working  
7:29
identically to hemispherical portals. Before,  negative teleportation degrees weren't needed  
7:35
because the blue portal was teleported by  the orange one. But here two teleportations  
7:41
happened at once - blue teleports orange, and  orange teleports blue simultaneously! Look,  
7:48
this small part enters its larger version, but  you could also say that part of the large one  
7:54
enters the small one too. And on the outside there  are only positive teleportation degrees, while  
8:00
the pocket dimension has all the teleportation  degrees, from minus infinity to plus infinity.  
8:07
Now we have a working approach and we're  not limited by any surfaces and don't need  
8:13
to program them, expand them, and so on. And  of course, we can make a normal-sized portal  
8:19
inside. And it works! We fly inside and see that  nothing intersects with anything, everything looks  
8:26
correct! We can revolve around however we want,  and the portals go in this infinite line.  
8:33
You might be wondering how I'm able to figure out  such things? The secret sauce is this visual scene  
8:40
editor where I can add an object or portal, and  then play with them to get immediate feedback on  
8:46
what works and what doesn't. And this is a good  way to solve problems and understand the topic.  
8:53
This is why I'm happy to introduce you to this  video's sponsor - Brilliant. Brilliant helps you  
8:59
become a better thinker and problem solver—with  thousands of visual, interactive lessons in math,  
9:05
science, programming, data analysis, and AI. To  develop the skills for building visualizations  
9:11
like mine, I highly recommend their courses on  vectors and programming. The latter will help  
9:17
you think like a programmer and get familiar  with Python to start programming right away.  
9:23
What I love about Brilliant is that it focuses  on problem-solving, and I've always believed that  
9:29
this is the best way to build real understanding.  Plus, their mobile app lets you learn at any time  
9:36
and any place. Except, maybe, for the pocket  dimension. Use Brilliant just a few minutes  
9:42
a day to sharpen your problem-solving skills. To  get started, go to brilliant.org/optozorax. You  
9:48
can also click the link in the description  or simply scan this QR code. By doing so,  
9:53
you'll get a 30-day free trial plus a 20% discount  on the annual subscription. Thank you, Brilliant,  
9:59
for sponsoring and now back to the portals. Let's experiment with this framework. Let's take  
10:06
this object and enlarge it forward until  it collides with something. We see it  
10:11
can enlarge infinitely and doesn't intersect  with anything. We fly in and inside we see a  
10:17
huge space without end. That's why it's so dark  here. So we can say that real infinite space is  
10:25
created here. And this isn't the same as in  the previous video, when scaling portal can  
10:31
fit infinite space in a finite volume. Now let's place a small portal inside,  
Experiments
10:39
fly in here and try to scale it up to normal size.  This works continuously and it seems like we can  
10:46
continue further. We do it and it surprisingly  works. It turns out with this approach we  
10:52
can place a large portal in a small one too! A  completely counterintuitive result that actually  
10:58
works. And this looks symmetrical to the process  of placing a small portal in a large one.  
Beautiful picture
11:05
Next, let's just look at a beautiful picture.  Let's take this combination of large and small  
11:11
portals. When we place one in the other, we see  how many teleportation degrees come out of the  
11:17
blue portal in the shape of a shell. And this is  what it looks like from the pocket dimension. We  
11:24
get an infinite logarithmic spiral. By the way,  that little spiral of white spheres represents  
11:31
the camera. Now let's gradually change the scale  to normal. We get an infinite vertical spiral.  
11:38
A very beautiful and massive structure. And  let's also look at this animation of how the  
11:44
portal scale changes from large to normal and  vice versa. Thanks to no restrictions on the  
11:51
teleportation surface, we can play around here  and get lost in it for hours. As a reminder,  
11:57
you can visit my web demo and play with this  yourself, at this link in the description.  
12:04
And how will an object look in such space? We  place it, and it looks normal, the cube just goes  
12:11
along a straight line. But inside, the cube also  repeats from minus infinite teleportation degree  
12:18
to plus infinite. Here space is looped in such a  way that one object looks like many objects.  
12:26
Now I want to show what's forbidden to  do with portals. Let's move the small  
Limitations
12:31
portal to a face-to-face position, and then  inside we scale the portal to normal size.  
12:37
We fly inside and see an infinite line of portals.  But what if we rotate it? We see the line turns  
12:44
into a circle that infinitely intersects itself.  This configuration is invalid because at some  
12:51
point the distant teleportation degrees start  intersecting the backs of existing portals and  
12:58
all infinite teleportation degrees lie in one  finite circle, and if they had any thickness,  
13:04
they couldn't fit here. That's probably why  this is an invalid configuration. Before with  
13:11
the portal-in-portal configuration we were only  limited by portal boundary intersections, but now  
13:18
in this pocket dimension there are more complex  restrictions that I can't formulate yet.  
Teleportation surfaces/Negative portal
13:25
And now about teleportation surfaces. As I said,  there are two approaches - teleportation degrees  
13:32
and special shapes of teleportation surfaces.  I generalized teleportation degrees to a pocket  
13:38
dimension where a normal-sized portal works. But  how to do the same with teleportation surfaces?  
13:45
I thought about it for a long time and found  a solution. Let's look at the following 2D  
13:50
animation. We have a small portal, and we place it  in a large one, to make this work we need to bend  
13:57
the surfaces so they don't intersect. Next,  we've inserted it and want to scale it up.  
14:04
We scale it and the surfaces need to scale  accordingly. And if you do this in a clever way,  
14:10
the surfaces will turn into infinitely extended  parallel lines! This is the solution to how to  
14:16
represent a normal-sized portal as a teleportation  surface. And this animation was suggested by  
14:25
several users in my Discord server. So here are two normal-sized portals with  
14:31
an infinite surface beyond the portal. If  we rotate around these portals, we teleport  
14:37
to their outer side and it looks like there's  nothing between them. The portals are parallel,  
14:43
so their planes are also parallel and  don't intersect. With light teleportation,  
14:49
you can see the black pocket dimension. If we  fly inside, we see the familiar line of portals.  
14:55
And if we turn off light teleportation, we can  see how the entire pocket dimension simply lies  
15:01
between two planes. This explains why there's  real infinite space, why an infinite rod can  
15:08
fit here. It borrows an infinite piece of space  from the originally infinite Euclidean space!  
15:15
But what's that strange white line? We turn off  light teleportation and see that this line is at  
15:22
the boundary where the two infinite portal planes  converge. Actually, this happens because the ray  
15:29
teleports indefinitely between these boundaries  and due to limited floating-point precision in  
15:35
computers, at one point the error becomes larger  than the distance between these infinite planes  
15:42
and the ray escapes beyond the surface. So it's  just a rendering artifact, nothing more.  
15:49
But such negative surface works well when our  portals are parallel. But what if we want to  
Mathematics of teleportation surfaces
15:55
rotate one portal, for example, like this? Then  the portal surfaces will intersect and it won't  
16:02
work. But we can orient planes in such a way that  they become parallel again. And as you may notice,  
16:10
I also use sphere pieces around the portal to  maintain surface continuity. And the picture  
16:18
inside looks familiar. But here the rendering  artifact is much larger. The next scene is this  
16:27
spiral inside the pocket dimension. And outside  it's represented by these parallel planes.  
16:35
But how to find the plane tilt angle for different  portal rotations? When portals are parallel,  
16:42
the plane normals are also parallel, then when  we rotate the portal, the plane normals stop  
16:48
being parallel. And then, when we reach the right  tilt angle, the normals become parallel again. So  
16:55
we need to find such a normal vector that is  parallel to its version after teleportation.  
17:01
Let's write this mathematically. The next part  is for people who had linear algebra in college.  
17:08
Don't worry if you don't understand, it's not  very important. As I said, portals consist of  
17:13
two coordinate systems. And each coordinate  system can be written as such coordinate  
17:19
transformation matrix. Then teleportation  of a normal vector can be written like this:  
17:26
first we transform the vector to local coordinates  of the orange portal, and then transform them from  
17:32
the coordinates of the blue portal. And after  all this, the normal should equal to itself.  
17:38
Looks familiar? If we put brackets around the  matrices, this becomes an eigenvector of this  
17:44
matrix! And this is the first time in my life when  eigenvectors were useful to me. It turns out that  
17:52
this eigenvector of the teleportation  matrix is the normal vector, which can  
17:57
then be used to calculate the portal surface. Next I want to show how such negative portal looks  
How a negative portal warps space
18:04
like in my space curvature simulation program from  the last video. Quick update - previously there  
18:11
were holes here, but I've now fixed them, and the  surface became continuous. So, this is a negative  
18:19
portal scene, here a green square moves outside  this portal, a blue square moves in a circle in  
18:25
the pocket dimension. And the red one moves in  both spaces. The top and bottom go to infinity. We  
18:33
run the simulation and it converges to this shape.  On it we have a regular plane and a separate  
18:39
cylinder, and both are connected by a portal  tunnel. So when we're inside the pocket dimension,  
18:46
we're here, in a separate cylinder. And it's no  wonder why rays loop and it looks so dark. And  
18:53
the regular space outside is here, where the  green square moves. So the pocket dimension  
18:59
is really a separate entity that's connected to  the regular world by a small portal tunnel.  
Pocket dimension without scaling portals?
19:06
And finally, the question that's probably been  bothering you this whole time: is it possible to  
19:12
place a normal-sized portal inside itself without  shrinking it in such a way that it forms infinite  
19:19
space? Because before I always first shrank it,  then inserted it, then scaled it back up. Yes,  
19:27
it's possible! But if your portal has an infinite  surface. For example, this portal has an angle  
19:33
shape, and its other part goes infinitely  down-left. You can just move the portal down  
19:40
and to the left - it will fit since it's infinite,  just like in Hilbert's hotel. There's the pocket  
19:47
dimension! OK, but what if the portal has a finite  boundary? The problem is that no matter how much I  
19:55
tried different positions of portal-in-portal,  I couldn't find one where I could insert it. I  
20:03
even made this interface where you can change the  surface, add, remove pieces in different places,  
20:10
but I still couldn't find that position. But maybe supportals, which I proposed in  
20:17
this video, will come to our rescue? Look, when a  portal enters another, it gets stuck here. What if  
20:24
we place a new portal here that will prevent this  collision? Let's try. So there's this supportal,  
20:31
here's its entrance and there's its exit. We  move the portal exactly the same way, and now  
20:37
it doesn't get stuck, it can move further. We move  more, and look, now we're limited by this place,  
20:45
the blue portal will hit the boundary of the  supportal. But it's in such position that now  
20:52
we can move the supportal through the blue portal  and can continue moving the large portal. And this  
20:58
is the maximum I've reached. I don't know how to  proceed further, too many variables appear. So  
21:05
friends, I actually don't know if this is possible  or not! But it was worth giving it a shot.  
Portal topology
21:13
And now I want to try to answer the same question  from a topology perspective. Topologically,  
21:19
an infinite 2D plane is equivalent to a sphere  with one punctured point. I think this is somehow  
21:27
related to the stereographic projection. And a  regular portal is equivalent to a plane with one  
21:34
hole. So a regular portal is equivalent  to a torus with a punctured point. Next,  
21:41
a cylinder is equivalent to a sphere without two  points. And a negative portal is a plane connected  
21:49
to a cylinder, so it's equivalent to a sphere  with three punctured points. So if we compare a  
21:56
regular portal and a negative portal with a pocket  dimension, they're topologically not equivalent to  
22:02
each other. And since regular portal movements  should preserve topological space equivalence,  
22:08
this can probably serve as proof of why one portal  can't be placed in another without shrinking! But  
22:16
I'm still not sure about this, since scaling  should also preserve topological space  
22:21
equivalence, but somehow it breaks everything. And now the answer to one of the most frequently  
Answering question from the comments
22:29
asked questions from the last video: what if  you place an object in the pocket dimension and  
22:35
then pull it out? So there's an object here and a  face-to-face portal. We fly in here and move the  
22:42
portal inside itself to create a pocket dimension.  Now we can move the object inside. You can see  
22:49
it's fully inside the pocket dimension, beyond  the portals. Next we pull out the portal and  
22:55
see that the object also came out. So the object  can't actually get lost in the pocket dimension,  
23:02
it just might become smaller if you push it too  far. And it works very simply - I represent the  
23:08
portal as this teleportation surface, place the  portal inside, then place the object inside,  
23:15
and when I pull out the portal, the object  stays in the same place, but due to the axiom  
23:20
about surface irrelevance, we can claim that the  object is actually here where we can see it.  
23:28
By the way, initially this video was much more  complex - for example I considered infinite cones  
Outro
23:34
instead of planes. I wanted to talk about their  complex constructions and properties. But user  
23:41
RareBeeph in my Discord suggested using planes  and this simplified the explanation a lot. Also,  
23:49
instead of the topological proof, I originally  thought to justify this through the impossibility  
23:55
of a pocket dimension in spherical geometry, but  also decided to remove this part as unnecessary  
24:02
when I came up with the idea that a negative  portal can be made in my space curvature program.  
24:08
It's a shame that sometimes this happens - you  make a scene, write a script, program animations,  
24:14
and then it doesn't get used. And I wanted to thank all the  
24:18
brilliant people from my Discord server,  your ideas shaped this video a lot.  
24:23
As you can see, these videos take a lot of effort  to produce. So if you'd like to support my work,  
24:29
you can join my Patreon! That's all, thanks for watching!

0:00
Everyone who has ever played Portal has created  a portal configuration where anything can fall  
0:05
infinitely. But where does the energy for this  come from? Do portals just create it out of thin  
0:12
air, letting you build a perpetual motion machine?  Yes, because this is an example of incorrect naive  
0:19
gravity in a universe with portals, which assumes  that at every point gravity points downward,  
0:26
regardless of the position and orientation of the  portals. But in reality, portals should bend or  
0:34
teleport gravity, and here's what it looks  like. With this kind of gravity, you can't  
0:40
create a perpetual motion machine and it doesn't  violate the laws of physics. But why? And what do  
0:47
all these arrows and colors mean? I know, none of  this makes sense yet, but later I'll explain:  
0:54
* what is drawn here and how I calculated it; * what equations make it work;  
1:00
* what criteria the correct gravity should meet; * how this gravity affects the world  
1:06
and objects in different setups; * and of course we'll look at how this affects  
1:11
the most debated portal physics question, and  what kind of gravity we get in that situation.  
1:18
And specifically for this video I programmed  a pretty complex physical simulation that  
1:23
calculates not only gravity with portals,  but also how it affects a physical object. So  
1:29
everything you will see later comes from actual  calculations, and not just my speculations.  
1:35
But the most interesting thing happens  with gravity in three dimensions. As   for the inside... Wait, what is this? You solved gravity for 2D only. And this  
1:45
is the Sponsor Dimension. Oh, I'm good, thanks   Just give me a minute! Well, fine, since you closed the portal  
1:54
This video is sponsored by boot dot dev  - a platform where you learn backend   development in Python, SQL and Go by actually  building things and writing a ton of code.  
2:05
Well, everyone has basics, but  are there any in-depth lessons?  
2:10
Yes! For example, have you ever wondered  how memory in Python actually works?   They have a course on writing your own  garbage collector from scratch in C.  
2:19
Sounds like it's all pretty hard. But you like puzzle games, right? On   boot dot dev, learning is gamified too: XP,  achievements, boss battles. And there are  
2:30
memes in the lessons. I also really enjoyed their  course on building an asteroid game in Python.  
2:37
Sounds interesting, but I don't know All lessons are free to read and watch.  
2:42
If you're interested, go to boot dot dev, and you  can use promo code OPTOZORAX for a 25% discount.  
2:49
Okay, I will take a look. How  can I leave this dimension?   I've opened the exit portal behind you. You might be asking: why is such gravity  
Portal axiom
3:07
incorrect? What exact law does it violate? It  breaks one portal axiom that I introduced in  
3:14
this video. I recommend watching it first. But for  now let me briefly remind you what it is about. We  
3:21
are considering portals that don't just teleport  you from one place to another through some kind of  
3:27
scanning and reconstruction devices, but portals  that bend space itself in such a way that this  
3:34
space-bending looks like teleportation. Sort  of like how wormholes work; they bring distant  
3:41
parts of space close together through a higher  dimension. The special thing about this model  
3:48
is that now the portal surface is just a way to  make a cut through this space bending. Because if  
3:54
you take such an elongated portal surface, the  final space bending will still converge to the  
4:00
same shape as with a flat surface. And if you  want to shine a flashlight near a flat portal,  
4:06
the light ray will arrive at exactly the same  place as for this semicircular portal. Because  
4:12
first it teleports through the orange portal,  then comes back. So just by looking at it,  
4:17
it's impossible to tell what shape the portal  surface is. For any surface it will look the  
4:23
same. Or you could say that this surface simply  does not exist. And this space-bending model  
4:30
can be reduced to a pretty simple axiom:  that a portal's behavior does not depend  
4:35
on the shape of its teleporting surface. And now, how exactly does naive gravity violate  
4:42
this axiom? Actually, this portal setup  obeys it, but it still violates the law  
4:47
of energy conservation. Therefore,  let's look at another scene. Here,   an object goes into the blue portal and emerges  from the upper portal. It falls straight down,  
4:58
everything makes sense. At every point gravity  points downward. But look: at this moment on one  
5:04
side of the portal, gravity acts downward on the  object, and on the other side, it acts leftward.  
5:11
And that's exactly where the problem for our axiom  lies. Let's take a semicircular portal surface.  
5:18
Here gravity points downward at every point  too. But now when the object enters the portal,  
5:24
it will feel downward gravity longer than leftward  gravity, and will end up at a different place.  
5:33
So you get a different result in each case. Yes, you could say this depends on how I program  
5:39
portals, and I could make gravity point leftward  here, then everything would work the same. But how  
5:45
will you find the place where gravity should make  a sharp turn on a continuous space bending? There  
5:51
are no portal surfaces here. So let's figure out  how we can actually teleport gravity so that it  
5:58
doesn't break this axiom and stays consistent. To understand how to teleport gravity through  
First model
6:08
portals, first, let's remember what  we know about it. The key thing is:   that its force can be calculated using  Newton's law of gravitation. It works for  
6:18
two point masses separated by some distance. And when we look at this equation, we can see  
6:24
its main problem - distance. It is clear how to  measure the distance between two points when we  
6:31
have an infinite flat space. But what if we have  portals. In that case we have regular distance r1,  
6:39
and we have distance through portals r2.  Which one should we choose? Or take this case,  
6:47
where there's a portal between the objects. In  any direction there's no direct path from one  
6:53
object to another, because the portal blocks  the path. Then should the distance go around  
6:59
the portal? All this is unclear and this makes  it hard to calculate gravity with portals.  
7:06
One of the first solutions that came to my mind  is to imagine as if there are gravity carrier  
7:12
particles - gravitons. They constantly stream out  from any mass and go in all directions. And when  
7:20
they reach another body, they give it a pull,  directed back towards where the graviton came  
7:26
from. This model can be tweaked to give the same  results as Newtonian gravity. And it's pretty  
7:32
easy to plug portals into such a model, because in  that case, they should just teleport gravitons as  
7:38
shown here! In this case, you get a bunch of very  sharp "gravitational shadows" from the portals,  
7:45
which means the body will feel abrupt changes  in gravity. And behind portals there won't be  
7:51
any gravity at all, meaning in this model  gravity doesn't go around the portals.  
7:57
I abandoned this model and didn't develop it  further, but I wanted to show how it could work  
8:03
since many of you probably had the same idea. Before I explain the next model, I want to  
Visual language
8:13
show the visual language of all the following  simulations. So here's a planet with some mass,  
8:19
where white means no mass, and gray means there  is mass. This planet creates gravity, which  
8:26
is calculated trivially by Newton's law. To make  things easier, from now on we won't talk about the  
8:32
gravitational *force* between two bodies. Instead,  we'll talk about gravitational *acceleration*,  
8:38
which only depends on one mass. Basically, it's  the force that an object with a mass of 1 would  
8:44
feel at any point in space around this planet.  The color shows how strong the acceleration is.  
8:52
Dark color means weak or zero gravity, and yellow  means 1g. We can make the mass 10 times bigger,  
9:00
and then we get a gradient of red and white, where  white is 10g or more. You can see that outside the  
9:07
planet, gravity changes predictably, and inside  the planet, it smoothly decreases to zero as you  
9:13
get closer to the center, because parts of the  planet's gravity cancel each other out. Next,  
9:19
we can add arrows that point in the direction  of gravity. And we can make the arrow size  
9:25
represent the strength of gravity at that  point. Next, let's add another small planet,  
9:31
and their combined gravity will look like this.  We see a place between planets where their forces  
9:37
balance and gravity equals zero. If we increase  the small planet's mass, this point will move,  
9:43
and the gradient will change. But arrows  aren't very convenient, so instead I'll use  
9:49
these streamlines. These are idealized movement  paths that make it easier to see where gravity  
9:56
points. I won't show them in animations because  they flicker a lot, as you can see. By the way,  
10:02
the gravity gradient here is actually continuous  and smooth, but I'm using just a few colors to  
10:09
make its shape easier to see. And to finish off  this visualization, here's what a falling object  
10:15
looks like with two planets. The planets have  the same density, so it's attracted to the larger  
10:21
one and rolls on its surface. By the way, if you  create a small object in the center of this spot,  
10:28
then with one offset it'll fly one way,  and with another offset the other way. So  
10:35
it's not quite accurate to say gravity here  is zero, rather very weak and unstable.  
Gravitational potential
10:45
And now we need to get familiar with a new  concept. The gravitational field we looked at,  
10:50
has direction and force at each point, meaning it  has two numbers at each point, and is denoted by  
10:57
the letter g. But in physics it's more convenient  to use another quantity - gravitational potential,  
11:04
which is denoted by the letter phi. It shows the  potential energy of unit mass at each point. So at  
11:11
each point it's just one number. For example,  here it's zero, and here it's 0.07. And the  
11:19
relationship between potential and gravity is that  gravity is always directed towards the decrease of  
11:25
potential. In other words, if you picture the  gravitational potential as a landscape, then  
11:32
gravity at any point is just the direction a ball  would roll downhill. Or, if you know these words,  
11:39
gravity is calculated as minus the gradient of  potential. So they're totally interchangeable, and  
11:45
you can always calculate one from the another. But why do we need this? Look, besides Newton's  
11:52
law, there's another, totally equivalent way  to describe gravity using potential. They  
11:57
often teach about it in university, and it's  called Poisson's equation. It looks like this.  
12:04
It lets you calculate the potential, phi,  from the mass density, rho. And pi and G are  
12:10
just constants. We won't go deep into what it  means right now, just know that it exists. To  
12:17
oversimplify, this equation says the potential at  any point is the average of the potential of its  
12:23
infinitely close neighbors. That is, each point in  space depends only on its surroundings. Now look,  
12:31
if you take a mass distribution like this, plug  it into the right side of the equation, and then  
12:37
solve it, you'll get the potential for the entire  area. And from that, we can calculate the gravity  
12:44
with its direction and force. And there are no  distances in this equation, it works on infinitely  
12:51
small patches, which means we can calculate it  on literally any space, not just a flat one.  
12:58
Therefore, we can use it to calculate gravity with  portals. And as we remember, portals bend space in  
13:05
this interesting way, which means we can try to  calculate gravity on such a curved space using  
13:11
Poisson's equation. And this picture right here  shows what gravity looks like on such a curved  
13:17
space. But you might ask, how did I calculate  this? I'll talk about this closer to the end  
13:24
of the video, but the short answer is, I used a  numerical method called the Finite Element Method.  
13:31
But I want to clarify right away that I calculated  all this for a flat 2D world. And the result  
13:38
will be slightly different from our volumetric 3D  world, but the differences are not fundamental.  
13:46
Before we move on to the experiments, I want  to clarify an important detail. According to  
A comment on the theory of relativity
13:51
the theory of relativity, gravity is the curvature  of spacetime. So some of you are probably thinking  
13:57
that since our portals bend space, they should  also create their own gravity. Actually, no.  
14:04
First, we are not considering Einstein's theory of  relativity. Poisson's equation describes Newtonian  
14:10
gravity. Second, portals bend space in such a way  that it remains flat. Yes, that sounds absurd,  
14:18
but it's too much to explain here; I'll make  a separate video about it someday. And most  
14:24
importantly, if I put two portals in my simulation  in a vacuum with no other masses, no gravity will  
14:30
appear, it will be 0g everywhere. That is,  portals don't create their own gravity; they  
14:37
just bend the gravity that's already there. Okay, now for the experiments. So, right now we're  
EXPERIMENTS
14:48
in Earth's gravitational field. Gravity points  down, and the force is 1g. Okay, we create one  
14:54
portal on the top and another on the bottom. Right  now, I have gravity teleportation turned off. I  
15:01
want to show how this works in a typical game with  portals, using that naive, incorrect gravity. Our  
15:07
portals are two-sided, so if we create a cube  at the top, it will fall to the floor through  
15:12
a short path. But if we spawn it in the center,  it'll fall forever and keep gaining speed forever.  
15:19
And this will only be limited by air resistance.  And now, we calculate gravity using Poisson's  
15:26
equation on the curved space. This is what it  looks like for these portals. A lot has changed,  
15:32
so let's go in order. Here we are also in the  Earth's gravitational field with a force of 1g,  
15:39
which is represented with yellow color. Above and  below the portals, we see that gravity has become  
15:45
a little stronger than 1g. We place a cube on top,  and it falls just like before. Now for the most  
15:53
interesting part, what if we release a cube right  between the two portals. It first falls down, then  
16:00
up, and down again, and then it gets pushed out.  And looking at the streamlines, this is exactly  
16:08
what we'd expect. Now let's create an object above  the bottom portal. It gets pushed out to the side  
16:14
immediately, just like the streamlines show. But  up here, near the top portal, the lines point  
16:22
upward. Does that mean the object will be sucked  in? Let's run it. Whoa, it really is. And I want  
16:30
to clarify that I spawned this object with zero  initial velocity - this is genuinely what happens.  
16:38
And if you spawn it a little lower, the pull isn't  strong enough to suck it in. Next, I want to show  
16:45
you how these portals affect objects a little  further away. If you create the object here,  
16:50
it gets attracted to them. But if you spawn it  below the center, it's pushed away. Next, we can  
16:58
make a visualization like this. Here I created a  lot of independent particles in different places.  
17:04
When I start the simulation, they will fall at  the same time. Starting. And pause immediately.  
17:11
Notice how aggressively the bottom portal repels  all the particles. Continuing. So from this,  
17:18
we can guess that the air at the edge of  the bottom portal would get pretty thin  
17:23
But what about our favorite infinitely falling  cube? Is it impossible after all? Actually,  
17:29
we can still do it. We need to create a cube with  some initial velocity, which I depicted with this  
17:36
white arrow. It flies and doesn't seem to stop.  But the trick is that it's not gaining speed.  
17:43
There's no gravity here to speed it up. So here,  it's just flying on inertia. In some places it  
17:50
speeds up a little, and in other places it slows  down a little, but its energy remains constant.  
17:57
Kind of like a pendulum that swings back and  forth, speeding up and slowing down under the  
18:03
influence of gravity. This is related to a similar  idea about extracting infinite energy from such a  
18:10
portal, using water falling under gravity, but  as we see, in honest physics this won't work.  
18:18
So sorry, trolls, no perpetual motion machine.  What's even more mind-blowing, you can create a  
18:24
cube that is initially flying upwards. And it  will do it till the end of time, if we don't  
18:31
consider air resistance. If I enable it, it would  be thrown out from this loop. So, with the real  
18:38
gravity there is no infinitely moving cube through  portals. It will always fail at some point.  
18:45
The next thing that might be bothering you is  what's happening at the edges of the portals.  
18:50
Here, gravity grows really strong, to red and  then to white, which is 10g and more. Does it go  
18:57
to infinity? I can't calculate this analytically,  so I don't know for sure, but from my experiments,  
19:04
it looks like it. We already knew that the edges  of a portal are infinitely sharp knives that can  
19:10
easily cut any object, but now infinite gravity  is added to the mix. That's why I'm putting walls  
19:17
here to protect objects from these edges. And when  object falls on this wall, it just bounces off.  
19:24
Now, if we zoom out, you can see the portals  only distort gravity right around them;  
19:29
their effect doesn't reach out to infinity. Furthermore, as we remember, portals bend space  
19:36
in such a way that it looks as if we glued  space together in the portal area. And on  
19:42
such space-bending, the gravitational field  looks continuous. The short-path section has  
19:48
become connected. And the section where the object  gets stuck in a loop looks like a small, separate  
19:54
cylinder. And you can clearly see the portal  edge point where gravity gets very strong.  
20:01
Next experiment. Now let's move the portal  sideways. The gravity changes somehow. The  
20:07
streamlines show that objects are now attracted  slightly to the side, nothing unusual is happening  
20:12
here. But what's really unusual is if we raise  the portal up. Look, the spot under the orange  
20:19
portal becomes redder, which means gravity is  getting stronger. And if you lower it down so  
20:25
that both portals are at the same height, the  portals stop affecting gravity. Very interesting,  
20:32
so the effect portals have on gravity depends on  the height difference between them? Yes. Look,  
20:39
for a gravitational field without portals, the  acceleration of free fall is 1g everywhere. But  
20:45
the potential increases from bottom to top.  And when we add portals here, they force the  
20:51
potential to be equal at every corresponding point  along their surface. And when we raise one portal,  
20:58
at every point of the portal, the potential from  above and the potential from below must be equal.  
21:04
But at this height, the potential *wants* to  be different. And Poisson's equation tries to  
21:10
compensate for these conflicting factors and  eventually converges to a state where gravity  
21:15
changes in this strange way, getting stronger  in one place and weaker in another. And as I  
21:23
already said, there is a very direct link between  gravitational potential and potential energy;  
21:29
to get energy, you just need to multiply the  potential by the object mass. This explains  
21:35
why we couldn't create a perpetual motion  machine. An object has fixed potential energy  
21:40
and the gravitational field can't do work to  accelerate more than what's contained in this  
21:46
energy. That's why I consider this gravity  to be correct, because it doesn't violate  
21:52
the law of conservation of energy. And to demonstrate this even better,  
21:58
let's take two portals that are facing each other  on the ground. We'll create a ball and shoot it  
22:03
towards the portal. It loops in this space. Now,  what if we place one portal higher than the other  
22:10
and tilt the ground? For now, I'm not teleporting  gravity, so this is the case of incorrect,  
22:16
naive physics like in the *Portal* game. In this  case, the ball accelerates indefinitely, and this  
22:23
is another perpetual motion machine. Here, the  field is doing work because the object constantly  
22:29
gains potential energy when it teleports and  it's converted into kinetic energy. And now,  
22:35
I'm turning on honest gravity teleportation. When the portals are at the same height,  
22:41
they don't do anything special. But when the  height changes, the gravity also changes.  
22:47
After we release the ball, it rolls down, and then  back up, and after wiggling back and forth a bit,  
22:53
it settles and stops rolling. And  as you can see from the streamlines,   it should be pushed into the tilted ground.  And once again, no perpetual motion machine!  
Stress-test
23:08
But did I really do everything right? Maybe  there's a fundamental error somewhere? Let's  
23:14
check this against the portal axioms. Let's  start with the axiom that the behavior of a  
23:19
portal does not depend on the shape of its  surface. We change the shape of the portal  
23:25
and see that the field doesn't change at all.  And I'm not just changing the picture here.  
23:30
I'm really plugging different portal shapes with  different triangulations into my simulation, and  
23:36
every time it converges to the same picture. The next axiom is that portals should behave  
23:42
exactly like a doorway when we put them  back-to-back. Let's try it. We start from  
23:48
a familiar position and gradually connect  them. You can see that the effect on gravity  
23:53
gets smaller and smaller, until it becomes  zero. So this axiom also works for gravity.  
24:00
The next axiom is the portal merging axiom. It  states that if you seamlessly connect two portals,  
24:06
they will behave as one portal. I used this in  my first video when I explained how to calculate  
24:12
a portal in a portal. Or in another video, when  I showed how you can create a triple portal from  
24:18
three doorways. We can check this by putting two  pairs of portals next to each other. We see that  
24:24
at the edges, there is this increase in gravity.  And when we gradually connect the portals,  
24:30
we see that the inner edges start  to get weaker and weaker, until they   disappear completely. This axiom also works. And the last axiom I just made up - it states  
24:42
that the smaller the portal, the less it should  affect the outside world. In theory, this sounds  
24:48
logical. Let's check it. We're shrinking the  portal a 100 times. Hmm, it doesn't look like the  
24:55
gravity teleportation has become 100 times weaker.  Let's make the portals 10 times more smaller. Hmm,  
25:02
almost nothing has changed. Another 10 times  decrease. What is going on, why does the influence  
25:09
on gravity remain so strong? Currently portals are  10,000 times smaller than previously, but their  
25:16
influence on gravity is still very strong and  noticeable from a large scale. What is happening?  
25:23
Does this mean that if we have a portal the size  of an elementary particle next to a black hole,  
25:29
it could tear the Earth apart? Actually, I'm not  sure why this is happening. It's probably related  
25:36
to the fact that I'm doing these calculations in  2D, not 3D, because the dependence of potential  
25:43
on distance is slightly different there. In the end, most of the axioms hold, except  
25:49
for the axiom about size and influence on the  world. So it seems like my approach is correct,  
25:56
with the small disclaimer that it  all needs to be rechecked in 3D.  
Physical question (The Portal Paradox)
26:04
Okay, with that settled, let's finally get  to the physics question. What will happen if  
26:10
a piston hits a stationary object? Will it just  slide down, because it had no initial velocity,  
26:17
or will it fly out, because the piston  gave it velocity? First, let's look at  
26:22
naive physics without gravity teleportation. This is how it will work for a flat portal.  
26:28
The object will fly out. That is, it will  behave like option B. If you want to argue,  
26:35
watch my previous video where I explained how the  portal axiom affects uniformly moving portals.  
26:42
And this is how it will work for a semicircular  portal. Nothing will happen to the object, and it  
26:48
won't even slide. So this isn't even option A. And now, we turn on gravity teleportation. In the  
26:56
flat portal version, almost nothing has changed  - the object flies out, just like in option B.  
27:02
But in the semicircular portal version, look  what happens. The object slid off!!! That's a  
27:09
1-to-1 match with option A!!! Insane. All my life  I believed that option A was absolute nonsense,  
27:17
but when you see something like this in a  simulation, it's hard to argue. So it really seems  
27:23
this scene was missing gravity teleportation. But why does it behave differently depending on  
27:30
the portal's surface? We have an axiom that  the behavior of portals should be the same in  
27:36
both cases. As I said in the last video, the  culprit is the fact that the portal *stops*;  
27:42
it's the acceleration from the portal stopping  that causes the problem between the different  
27:47
surface options. T o prove this, I want to show  what this scene looks like if the piston keeps  
27:53
moving and teleports the platform. So, the portal  moves, the object comes out the other side and  
27:59
behaves quite predictably. For the semicircular  shape option, the same thing happens. And if you  
28:08
overlay them, they turn out to be identical. And another way to make the portals behave  
28:15
the same for different surfaces is to  make the piston move very slowly. Then,   for a flat portal surface, the object will slide  off before the portal stops. And of course,  
28:26
it will behave identically for the semicircular  surface as well. So, I wasn't wrong when I said  
28:32
earlier that the answer in this picture also  depends on the speed of the piston, because at  
28:38
such a low speed, you can get A from B. So, just as I said in the previous video,  
28:44
to fully resolve this issue, we need to go into  the theory of relativity and develop a model of  
28:50
accelerating portals with gravitational waves. But  actually, such a model already exists. A scientist  
Potential solution to the accelerating portals
28:58
who works on theoretical physics in the field of  quantum gravity came to my Discord and developed  
29:04
the following model, where an accelerating portal  must create its own gravitational field and,  
29:09
consequently, gravitational waves. In his model,  the accelerating portal attracts the object. And  
29:16
look at this interesting thing, when the object is  pulled in, it is in two places at the same time.  
29:23
This happened automatically and is due to the  quirks of the theory of relativity. He even  
29:29
described it mathematically. Maybe one day I'll  have the energy to make a simulation based on this  
29:35
model, like I made this gravity simulation. Well, now, as promised, how does this finite  
Finite Element Method
29:45
element method work, and most importantly,  how did I implement portals in it?  
29:51
I want to briefly explain this so the main idea  is understandable even to a high school student,  
29:57
without deep diving into mathematics. And using  very specific values. So, first, I'll explain  
30:04
how to calculate the gravitational potential  when we have this round mass. Then I'll add  
30:10
portals and show you what we need to change in the  calculation scheme to make it work with them.  
30:17
So, Poisson's equation is an equation that relates  two functions, phi and rho, where rho is the mass  
30:24
density function and phi is the potential value  function. They take two numbers, which define  
30:30
the coordinates of a point, and return one  number - the value of the function at that  
30:36
point. And this equation shows the relationship  of these functions at *every* point in space.  
30:43
The difficulty with differential equations is that  writing down the final function mathematically is  
30:49
incredibly hard, and sometimes impossible. But  we want to solve this numerically on a computer,  
30:56
and computers can't store and calculate  infinitely many points, so what do we do?  
31:02
The first stage is discretization. That is,  breaking up space into a finite number of  
31:08
elements. That's why the method is called  the Finite Element Method. In this case,  
31:14
they are triangles, and there are 152 of them  here. We ourselves decide how to divide space into  
31:21
these triangles. Next, we are only interested in  the value of the potential and density functions  
31:28
at the nodes of these triangles, and there are  89 of these nodes here. And the specific result  
31:34
of this discretization is this diagram. We have  152 triangles, 89 points and their coordinates,  
31:42
and each triangle is numbered and points to  3 nodes with a specific number. We will need  
31:49
this information later. Now, what to do with the  rest of the infinite set of numbers between the  
31:54
triangles? Look, inside each triangle, you can get  an intermediate value using all three numbers, if  
32:01
you just imagine as if they are on a single plane.  I won't say how to write this down mathematically,  
32:08
but this method can be described like this: this  triangle function takes the current coordinates x,  
32:14
y as input; then the three coordinates of the  triangle; and then the three values at the nodes  
32:21
of this triangle. And this function returns one  number - the potential or density at that point.  
32:28
Inside the triangle, it gives an intermediate  value, and outside the triangle - always 0. Then  
32:34
the density function can be represented as the  sum of this function over all these triangles,  
32:41
from the 0th triangle to the 151st. And in this  function, we know everything except the current  
32:49
point's coordinates x and y. Similarly, we can  write this for the potential, and the only thing  
32:55
that will change is that we will use the potential  values at the nodes, and that we don't know these  
33:01
values, so the function also depends on them.  So we get such piecewise-defined functions.  
33:08
So, we have reduced the problem of finding an  infinite set of numbers to finding 89 unknown  
33:15
numbers. How do we find them? Well, the first  instinct is to take Poisson's equation, take our  
33:22
piecewise-defined functions, plug them in, and  somehow solve it. The direction is correct, but  
33:28
it won't work naively. To make it work, you need  to use complex math called the Galerkin method,  
33:35
which I won't go into. If you want to understand  it, this topic is explained well in this video.  
33:42
The Galerkin method takes our discretization  and Poisson's equation and turns them into a  
33:48
big system of linear equations. Here's an  example of such a system. To solve this,  
33:53
you need to express one variable in terms of  another and then substitute it into the other  
33:59
equation. So, the solution can be found quite  simply. In systems of linear equations, there  
34:05
is no multiplication of unknown variables, which  means you'll never get quadratic equations and  
34:11
so on. That's why they are fairly easy to solve.  And here is what we get specifically. There are 89  
34:18
equations and 89 unknowns. The unknowns are marked  in red. Any school student with a calculator could  
34:26
solve this system of equations. It would be  long and tedious, but they could do it.  
34:32
And after using child labor, we get these  values. Some potential was found at each  
34:38
node. Now we plug them into our triangles and  visualize the potential. This is what it looks  
34:44
like. And this is what the gravity looks like.  Of course, this is a very rough approximation  
34:51
because there are few triangles. But if we  take more and more triangles, the solution  
34:56
will get more and more accurate. Just look at how  smooth this looks with two million triangles.  
35:03
And once again, briefly about the finite element  method: we break space into finite elements. Then,  
35:10
based on them, we assemble a system of equations  using the Galerkin method and solve it.  
35:16
And then we can use the calculated values to  visualize the potential. And from the potential,  
35:22
we can calculate gravity. And of course,  I've omitted a huge number of details to  
35:27
make the explanation simpler; you can learn  all that yourself from other sources.  
35:33
But what I've described is how to calculate the  gravity of a simple object in flat space. We're  
How to add portals to the FEM
35:40
interested in portals. How do we put them in  here? What should they teleport? Actually, it's  
35:46
criminally simple. Here, we have added portals  to the triangulation; they are marked in red. And  
35:53
here I've colored the triangles above and below  the portals for convenience. Next, remember that  
35:59
portals are just some kind of space bending. And  if we place this picture onto this space-bending,  
36:06
we see that the green triangles should end  up next to each other, and the same with the   blue ones. What does this mean for our method?  Let's look at our discretization scheme. First,  
36:18
we explore normal space. Here, each triangle in  its corner uses the same unknown with index 43,  
36:26
because it's the same point in space for each  triangle. Now let's look at this green triangle.  
36:32
It's built on three unknown nodes with indices 73,  13, and 14. And the blue triangle next to it also  
36:40
uses unknown nodes 13 and 14. That is, they have  common unknowns across this edge. But from the  
36:48
portal space-bending, we see that the same point  in space is between the green triangles, but they  
36:54
refer to different indices. This means the common  unknowns should be between the green triangles,  
37:00
not between the green and blue ones. So, we just  rewrite it for that green triangle so it has the  
37:06
unknowns 73, 18, and 19. Then when we place these  indices on the curved surface, the green triangles  
37:14
will share the same unknowns, and likewise for  all other points in space. And the potential  
37:21
equation is the sum of all triangles, where each  triangle specifies which unknowns it uses. And  
37:28
that means for the triangles next to the portals,  we need to change these unknowns. Yes, all the  
37:33
portals do is just rearrange the indices of the  unknowns in each triangle a bit, and that's it!  
37:40
And then we perform the same operations to  assemble the system of equations using the  
37:45
Galerkin method and get a different system of  equations, which can be solved. I decided to  
37:52
visualize how the system with rearranged indices  differs from the original one, and here the  
37:58
differences are shown in green. A few equations  changed and a few indices in other equations, but  
38:05
otherwise, most of the equations remain the same  as before. Then we solve this system of equations  
38:11
and end up with this gravity. And this is what  it looks like if we increase the precision.  
38:17
And this is exactly why Poisson's equation  shines here, because it's local. It allows  
38:23
us to "re-glue" space like this, and it still  keeps working and gives reasonable results.  
38:30
Fun fact: in university I studied at the faculty  of applied mathematics and computer science,  
38:36
and our main program was actually programming  the finite element method. But at my last job,  
38:43
I was a regular backend developer, and now that  I've quit and become a blogger, I'm programming  
38:49
the finite element method again. Does this mean  I'm... actually working in my field of study?  
38:57
And this soft object is just a collection of  particles that are connected to each other by  
39:02
springs. And each particle is affected by both  the springs in this body and our gravitational  
39:08
field. This approach is called a "softbody" and  here's an example video where they implement  
39:14
this kind of physics from scratch. Next, I want to compare my results with  
Conclusion
39:24
the results of other people. I found two sources  where they solved this problem. The first was  
39:30
made by Zeno Rogue, known for his work on  hyperbolic geometry. He also made a model  
39:35
based on gravitational potential. And he got the  same result I did: the character is repelled from  
39:42
the bottom portals, and pulled into the upper  portal. The next person who worked on this  
39:48
problem is Greg Egan, the author of cool sci-fi  books. And for his book *The Book of All Skies*,  
39:55
he also calculated gravity through portals, and  wrote a whole article about it. And he has this  
40:01
illustration with portals in different worlds  and one source of gravity. I replicated this  
40:07
in my program, and I got a very similar  result. But it's still different, because  
40:13
Egan calculated gravity for the 3D case, and I  did it for 2D. Oh, and people from my Discord  
40:20
also got roughly similar results - Sarah and  bbob9764. You guys are awesome, thank you.  
40:29
And there's a ton of stuff that didn't make it  into this video: how gravity behaves with a portal  
40:34
in a portal; whether this can work for scaling  portals; and what happens to gravity in a pocket  
40:41
dimension. If this topic is interesting, I  can make another video about all of this.  
40:47
And if after this video you want to play with this  portal physics yourself - move portals with your  
40:52
mouse, change gravity, affect the softbody object  and see different situations without waiting for  
40:58
the next video - you can do all this in the  program I wrote for this video. I used it to  
41:04
render all the animations shown here. It took me  over 200 hours to write this program, so for now,  
41:11
I'm releasing it only on my Patreon for all paid  subscribers starting at $1. And in the meantime,  
41:18
I want to give a huge thank you to everyone  who is already supporting me! By the way,  
41:23
I spent an unhealthy amount of time on these  animations, but I don't regret a thing,  
41:29
because they are just too beautiful. And I also made a separate video where I  
41:35
explain how to create scenes in my program  if you want to make your own simulations.  
41:40
This video is on my second channel. Well that's all from me, thanks for watching!

0:00
We live in an infinite space where gravity  is easily calculated using Newton's law,  
0:06
but what if we lived in a closed space, where  the whole world repeats infinitely? Would  
0:12
gravity grow to infinity, or would it converge  to something? Or how do you calculate gravity  
0:18
on a Klein bottle? And how does a portal to a  pocket dimension affect gravity? In this video,  
0:24
we'll explore not only that, but also  the unexpected discovery of self-force,  
0:31
where a body starts pushing itself in the  presence of portals. And at the end I'll  
0:37
answer your questions from my previous video.  Welcome to the optozorax channel, let's go.  
TL;DR of a previous video
0:41
This video is a continuation of my previous  video about calculating gravity with portals.  
0:47
I recommend watching it first. Long story short:  in the previous video, we abandoned Newton's law  
0:54
for calculating gravity, because it's designed  only for infinite flat space. Portals bend space,  
1:02
so it can't work with them. That's why we switched  to Poisson's equation for the gravitational  
1:08
potential. I explained how I calculate it  using the Finite Element Method on triangles,  
1:16
and how to add portals by simply changing the  indices. As it turns out, portals bend gravity  
1:24
in a pretty interesting way, and they do  so in a way that makes perpetual motion  
1:29
machines impossible. And in the Portal Paradox,  option "A"^ gets a real logical foundation.  
Gravity on a torus
1:43
So what even is a torus? A torus is this closed  space that's depicted like this with arrows.  
1:50
The lines with arrows are portals. That's why I  chose this topic 🤭. When you enter the top portal,  
1:57
you come out of the bottom one, and when you  enter the left one, you come out of the right one.  
2:04
In other words, lines of the same color are  connected to each other. This results in an  
2:10
infinitely repeating world, but with a finite  amount of space. There are hypotheses suggesting  
2:17
that if our universe isn't infinite, it might be a  similar shape that repeats in all directions. Now,  
2:24
to calculate gravity here, let's start by placing  a circular mass in the torus space. Then we need  
2:30
a way to tell our method that this space loops  back on itself. In the finite element method, the  
2:37
space structure is defined by triangles, and the  indices of the unknown values they refer to. So  
2:44
we implemented portals as a change of indices such  that the top triangles reference the same unknowns  
2:51
as the bottom ones. And the right ones point to  the left ones. This way, the finite element method  
2:58
will see our space as if it's looped like on a  torus. However, there's one very important detail  
3:05
here. Specifically, the corners, where the portals  touch. Right now we have different unknowns at  
3:12
each corner. If we visualize the space with this  gradient, we can see that all these corners meet  
3:19
at a single point on the torus. So the corners  require special attention, so I built a dedicated  
3:26
corner-reindexing feature that takes a directional  segment like this and remaps all the corners to a  
3:32
new point. I do this manually, just by setting a  couple of these parameters. This is very important  
3:40
because, as we remember from the previous video,  even a very tiny portal point can create enormous  
3:46
gravity. So, after we've done all this, we need to  solve a system of linear equations. And I do that  
3:53
with an iterative method, so we can see what the  solution looks like with each new iteration. Well,  
4:01
it diverges - gravity just keeps increasing with  no sign of stabilizing. So what do we do now?  
4:09
To solve this problem, let's start researching,  and this is where the Opera browser will  
4:14
help - the sponsor of this video. Ever have a  million open tabs after a research session and  
4:20
forget which ones you just visited? Tab Traces  help you identify them by highlighting them with  
4:26
an underscore. The darker the underscore,  the more recently you visited the tab.  
4:32
But then I remembered that I have snowboarding  planned, and I have to find the perfect apartment  
4:38
in another country. This is where another Opera  feature helps - Tab Islands. I can collapse and  
4:45
expand all the research tabs that I organized into  one island and start a new island for apartments.  
4:52
And when I open a link in a new tab, it  automatically adds it to the current tab island,  
4:57
and I can color-code or rename the islands. But  since the apartment map doesn't show snowboarding  
5:04
tracks, I can use the split screen feature to add  another tab to the side of the apartment search so  
5:10
I can see where each apartment is located compared  to the trail map. You can have up to four tabs  
5:16
open in split-screen at once. And then, for every apartment,  
5:21
I want to check which ones have a dryer.  Checking that manually is very tedious,  
5:26
so this is where I can use the free Opera AI,  which not only has access to the page content,  
5:33
but can also work with the whole tab island. So, if you want to make your web browsing more  
5:38
convenient, download Opera with  my link in the description  
5:43
Let's start with something I skipped in the  previous video - boundary conditions. Any  
5:48
differential equation requires some boundary  conditions. For calculating planetary gravity,  
5:54
I used a simple Dirichlet boundary condition - I  simply wrote into the equations that the unknown  
6:01
potential at the boundary equals zero. When the  simulated area is small relative to the planet,  
6:08
the gravity is noticeably distorted.  But as the simulated area gets larger,  
6:14
the gravity starts looking more like the  true gravity in a real infinite space.  
6:20
And for space with gravity directed downward, I  used Neumann conditions - they're more complex,  
6:26
I won't dwell on them here. But on a torus there  can't be any boundary conditions, because there  
6:33
are no boundaries. And there's nothing to limit  the potential. So I use one standard trick - we  
6:40
need to apply a uniformly distributed negative  mass across the entire torus space, with a density  
6:47
chosen so that the total mass sums to zero. Then,  we restart the Finite Element Method. And we see  
6:55
that it has converged to a stable picture.  So if you believe our universe is closed on  
7:01
itself, then perhaps some compensating  negative mass must exist somewhere.  
7:07
Now we can finally move on to the experiments.  We enable the streamlines and see two regions of  
7:14
unstable zero gravity here. One is a point,  and the other is a line. On the 3D torus,  
7:21
these spots sit on opposite sides of the  mass, each in a different direction. Next,  
7:28
if we move the mass around, we see that the  picture doesn't change at all, it just shifts.  
7:34
This means gravity on a torus doesn't depend on  how we place the gluing portals. And we can even  
7:41
rotate this picture on the torus without changing  the result. By the way, this three-dimensional  
7:48
torus is actually just a visualization of the  topology, not its objective geometric shape. If  
7:55
you want to see what two-dimensional space on  such a three-dimensional torus would actually  
8:00
look like, check out Artem Yashin's video - I  helped out with it a bit. A torus with truly flat  
8:08
space requires a fourth dimension and is called a  Clifford torus. Now let's add a second planet and  
8:16
we see some white arrows have appeared. They show  the gravitational force acting on each planet. I  
8:24
calculated them by integrating over the surface  of each planet. And in this case, you can see  
8:30
the arrows aren't pointing perfectly toward the  centers of the planets, but slightly to the side,  
8:37
because they're being influenced by all the other  copies. Here is how the arrows change when we  
8:43
move the two planets around. Unfortunately,  I wasn't able to make these planets move and  
8:49
teleport, so I won't be showing that. The next interesting closed shape is the  
Klein bottle
9:00
Klein bottle. You've probably heard of it and know  that it actually exists in four-dimensional space,  
9:07
and when we project it into our three-dimensional  space, it starts intersecting itself. In reality,  
9:14
it doesn't intersect itself in 4D space; it's just  distorted by perspective. Structurally it's very  
9:22
similar to a torus, but the top arrow points in  the opposite direction from the bottom one. This  
9:29
means there's a mirroring portal here. So when you  enter this mirroring portal, you not only end up  
9:36
on the other side, but you also get mirrored.  And if you ever find yourself in such a world,  
9:42
don't eat mirrored food - it could kill you.  There are plenty of YouTube videos explaining why.  
9:49
As for implementation: similarly, we need to remap  the corner indices and add uniform negative mass,  
9:56
and there's nothing special beyond that. If we  move the planet up and down along this shape,  
10:03
the structure of gravity won't change at all.  But if we move the planet left and right, the  
10:10
structure of gravity changes. This means that in  such a universe you could potentially figure out  
10:16
its horizontal size through a physical experiment.  And by the way, you can rotate the picture on the  
10:22
Klein bottle in this direction, because nothing  changes along it, but you can't rotate it in the  
10:28
other direction because of this asymmetry.  And if we add a second planet, the combined  
10:34
gravity of the two planets behaves strangely.  And this is what it looks like in motion.  
10:48
The next interesting surface is the projective  plane. If you want to dive deeper into this topic,  
Projective plane
10:54
I recommend this video. Here you can see one  pair of portals, and they don't just mirror;  
11:01
the entrance and exit have different shapes. One  hemisphere is convex and the other is concave.  
11:08
These "portals" don't obey the surface-irrelevance  axiom, so many of my results don't apply to them;  
11:16
I consider them portals, but not in the full  sense. Maybe in the future I'll cover this  
11:22
type of portals in more detail. So, they're not  classical portals, but when it comes to remapping  
11:29
unknown indices, they work exactly the same way.  The Finite Element Method handles them just fine.  
11:36
Topologically, this surface is arranged so that  everything that goes into the circle comes out  
11:42
on the other side, and that's true for every  direction. And if you send a beam of parallel  
11:50
rays, they'll converge after teleportation. So it  works like some kind of portal lens. A neat way to  
11:58
visualize the projective plane is this 3D shape  known as Boy's surface. No, this isn't a surface  
12:05
for boys, it's named after its discoverer.  This surface has a pretty interesting triple  
12:11
symmetry. And its internal structure is quite  interesting too. As for corner remapping - there  
12:21
aren't corners here, but there are points where  portals touch, and they require special attention,  
12:28
just as before. Here we similarly remap both  contact points to the same point, because that's  
12:35
how the topology works. When we create a planet,  we get a picture like this. It doesn't change at  
12:41
all if we rotate its position in a circle. But  the picture does change if we move it towards the  
12:48
center. Same story as the Klein bottle. There are two more interesting variants.  
12:56
The first is the projective plane  through a square fundamental polygon,  
13:00
which is less natural for visualization on Boy's  surface. And the second option is a sphere in  
13:07
the form of a square surface. But I won't go  into detail on these. Actually, I took all  
13:14
these closed surfaces from a Wikipedia page called  Fundamental polygon. If you want to look at these  
13:20
scenes and play around with their gravity, it's  available in my program Portal Lab on Patreon.  
Pocket dimension
13:31
Now about the pocket dimension. Many of you asked  what gravity would look like in this case. As I  
13:38
explained in this video, to get a pocket dimension  you need to take two connected two-sided portals,  
13:44
make one smaller than the other, and place the  small portal inside the big one. And to do that,  
13:50
the shape of their teleporting surface has to  be curved in such a way that the small portal  
13:56
can fit inside the big one. Of course,  you can calculate that kind of gravity  
14:00
using portals of different sizes - the finite  element method can handle it - and we could  
14:06
even explore how scaling portals interact with  other bodies and their mass. But that requires  
14:13
going through the whole theory of scaling  portals, and I'm not ready for that yet.  
14:19
But there is a way to create a pocket dimension  using portals of the same size. In this video,  
14:25
I explained that we can use a negative portal  for this. A portal whose teleportation surface  
14:31
extends infinitely. Here's what it looks like in  a 2D world. From the outside, all light passes  
14:39
straight through it, so it would be invisible.  But if you enter this portal, the space becomes  
14:46
looped and infinite. And here's what the exterior  looks like from the pink ball's point of view.  
14:52
And here's what it looks like when it flies into  the pocket dimension - you can see how everything  
14:58
repeats inside. And here's the topology of this  portal. On the outside it's regular flat space,  
15:06
and the pocket dimension looks like a cylinder,  and the portal is a tunnel connecting regular  
15:12
space with this cylinder. That's exactly why I  call it a portal to a pocket dimension - because  
15:18
it creates a separate chunk of space that  can only be accessed through this portal.  
15:25
If you place a planet near such a portal,  gravity naturally leaks into the pocket  
15:29
dimension, and any object from the pocket  dimension will be attracted to that planet,  
15:35
as we can see from this particle simulation  where all particles escape from the pocket  
15:40
dimension and head toward the planet. Things get  interesting when we place a planet inside the  
15:47
pocket dimension and start moving it higher and  higher up the cylinder. Gravity along the cylinder  
15:54
seems not to decay at all, but my experiments  suggest it just decays incredibly slowly.  
16:02
If we shift one portal higher, the direction  of gravity inside the pocket dimension also  
16:07
changes and seems to follow the  direction of the eigenvector of  
16:13
the portal matrix - I talked about this here. Now for the most interesting thing I discovered  
16:20
while researching all of this. I noticed that  when I place a planet in the pocket dimension,  
16:26
its internal equilibrium point is  shifted relative to its center.  
16:31
What does this mean? Let me show you with  an example. When we have just two planets,  
16:36
the equilibrium point inside them is also  shifted a bit, because they attract each other.  
16:43
From Newton's law, we know the smaller planet  will accelerate toward the larger one more. And  
16:49
the larger one will accelerate less. And this  correlates with how the equilibrium point looks  
16:55
inside them. In the small planet, it's shifted a  lot, and in the large one, it's shifted a little.  
17:02
I decided to calculate the actual force acting on  the planet by integrating over its entire surface,  
17:10
and I got these arrows. They represent each  planet's acceleration. Now let's apply the same  
17:16
calculation to the negative portal and we get...  An arrow? But why is the planet being pulled  
17:23
somewhere? We don't have any other masses around  to pull on it. Is it actually pulling itself? Yes,  
17:30
and this is the unexpected discovery I  promised at the beginning of the video.  
17:40
It turns out that a spherical mass in a pocket  dimension creates a force that makes this mass  
Self-force
17:46
move in a specific direction. More precisely, the  planet's images through the portals create this  
17:53
force. Let's simulate this effect using a body  made of particles and see where it goes. We launch  
18:00
it near the portal. So, the body flies toward the  portal, then enters the pocket dimension and flies  
18:08
away... And the further it gets into the pocket  dimension, the stronger the pulling force. This  
18:14
is a pretty terrifying result. So if we create a  negative portal, it'll make any mass push itself  
18:21
into the abyss of the pocket dimension with no  way back? And given that gravity barely decreases  
18:27
with distance in there, this basically turns  into some kind of Newtonian black hole???  
18:35
From what I gathered by consulting ChatGPT, a  similar phenomenon exists in electrostatics,  
18:41
and is called "self-force". It's when a  charge creates a force that pushes that  
18:47
very charge in the presence of conductors. I  suppose portals act like perfect conductors of  
18:54
gravitational potential, so the analogy fits. Let's explore this self-force in more detail.  
19:01
We'll start by changing the radius of the planet  to make sure this works for point masses too.  
19:07
I'm changing the planet's radius and density  simultaneously so that the mass stays  
19:13
constant. And as we can see, the arrow doesn't  change. So this isn't a macro-scale effect.  
19:21
Next, we need to figure out how to visualize this  self-force at every point in space, to understand  
19:28
what it looks like. Just moving the planet around  and watching its arrow isn't very convenient.  
19:34
And launching a softbody from every point in space  isn't very convenient either. So I decided to just  
19:41
iterate over all possible points in space, place  a small planet there, calculate gravity with the  
19:47
Finite Element Method, then compute the surface  integral over that planet to find its self-force,  
19:54
and then place a square dot like this that shows  the direction and magnitude of the self-force.  
20:00
This takes a very long time because the Finite  Element Method is fairly slow to compute,  
20:07
and here we need to compute it exactly  10 thousand times. As far as I can tell,  
20:12
there's no mathematical method that lets you  compute this for the entire space at once,  
20:18
the way it's done with Poisson's equation, so we  just have to wait a very long time. But you won't  
20:25
have to wait, thanks to the magic of editing,  and we end up with a picture like this.  
20:30
It clearly shows that the strongest self-force  occurs inside the pocket dimension and stays  
20:37
roughly the same there. Meaning a body in this  pocket dimension will accelerate forever at a  
20:43
constant rate. Since this is a Newtonian  model, there is no speed limit. Next we  
20:49
see that near the portal, the self-force  pulls everything inside, but at a certain  
20:55
distance the negative portal creates a repulsive  self-force. Phew - so this 'Newtonian black hole'  
21:02
won't immediately suck everything in the universe  into itself - only whatever gets too close.  
21:09
Alright, the pocket dimension case is  clear. Let's look at the self-force of  
21:14
other portal configurations. This is just  flat space; here the arrows point in random  
21:20
directions due to numerical error, because  infinite flat space has no self-force.  
21:27
Now here's what the self-force looks  like on a torus. Judging by the arrows,  
21:33
there's no self-force here either. So  it's an excellent analog of infinite  
21:37
flat space, but without the infinity. And this is the self-force for the Klein bottle.  
21:45
Look at these distinct vertical lines of  stable self-force. Everything in such a  
21:50
universe would be attracted to these lines  and stay near them. Very interesting. Yet  
21:57
another way to tell when you're living on  a Klein bottle compared to other spaces.  
22:03
And self-force for the projective plane looks  like this. Here everything gets attracted from  
22:09
the center toward the edges. Most likely  this happens because all the curvature of  
22:15
this shape is concentrated at the edges,  while the rest of its space is flat.  
22:21
Okay, but is there self-force between regular  portals? Here's what it looks like for a pair of  
22:27
portals. And here we see a pretty interesting  thing - the portal edges create a repulsive  
22:33
self-force. And if I rotate the portals,  the behavior stays roughly the same.  
22:40
So it turns out almost any portal  configuration, except for a torus,  
22:45
creates some kind of self-force that makes bodies  push themselves in certain directions. Maybe this  
22:52
has something to do with the fact that portals  change the topology and break certain symmetries,  
22:58
similar to how the law of conservation of  energy doesn't work in an expanding universe.  
Q&A from previous video
23:10
Let's start with one of the most frequently  asked questions - will light be bent because  
23:16
portals bend gravity or bend space? No. We're  considering Newtonian gravity, where gravity  
23:24
doesn't affect light at all. And portals bend  space while keeping it flat. So portals will still  
23:31
look like magical doorways to other worlds. Next, a lot of people asked what would happen  
23:38
if you rotate the portals. Nothing special;  the body will just take a longer trajectory  
23:44
downward. And if you place them at the  same height, they'll change gravity in  
23:49
a clearly noticeable way compared to non-rotated  portals. And a body here will behave like this.  
23:59
But you can also rotate portals by 90 degrees,  and I want to show this simulation in that regard.  
24:06
Here the portals are placed at different heights,  and we want to use one portal to get to a higher  
24:12
elevation. But if we throw an object into the  lower portal, it'll be repelled with a strong  
24:18
force. It's very hard to enter. And if we place an  object near the upper portal, it'll roll into the  
24:25
lower elevation. And this is just a small height  difference, yet already such a huge difference in  
24:31
gravity. The greater the height difference, the  stronger the effect. So it turns out portals that  
24:38
teleport gravity are pretty useless in practice -  there's no point in making a game with them - you  
24:45
literally wouldn't be able to go anywhere. And  if we place such a portal on the Moon, the lunar  
24:51
soil would get sucked into the portal very quickly  and sent to Earth, because the potential on Earth  
24:58
is very different from the Moon's. So these  portals can only be used at the same height,  
25:04
or placed in space far from gravity sources,  to minimize the different-potential effect.  
25:12
And now the answer to the most discussed  question from my previous video. Does my  
25:18
4th "axiom" about portal size really hold up?  Yes, I got the terminology wrong - it's more  
25:24
of an "expected behavior" than an "axiom." A  lot of comments said my intuition was wrong,  
25:31
and that as portals approach zero size  they should still have a measurable effect  
25:36
on gravity. Because they glue together areas at  different heights, meaning different potentials,  
25:44
so their influence on gravity will always be  noticeable. Then one day I opened my inbox and  
25:51
found an email from someone called finegeometer,  who'd worked out an analytical way to compute  
25:58
portal gravity using complex analysis. I open  the attached document, and there's a PDF with  
26:05
mathematical calculations. This is what I love  about my community - you solve things I can't,  
26:11
and point me toward ideas I wouldn't come up  with on my own. Thank you for that. I'll put his  
26:18
calculations under this link in the description.  But here are all the pages from those PDFs,  
26:24
in case you'd rather just read everything right  here on screen. And according to his calculations,  
26:30
the influence of portals on gravity really does  approach zero, but at an inverse logarithmic rate,  
26:37
which is INSANELY slow. So my intuition  didn't let me down, and a whole lot of  
26:43
commenters turned out to be wrong. So folks,  the final word always belongs to the math.  
26:50
Also in these documents he  showed that gravity near a  
26:53
portal edge really does grow to infinity. And there was a lot that didn't fit into this  
27:00
video: gravity of a monoportal, gravity of a  triple portal, the physics of scaling portals,  
27:07
gravity of a portal-in-portal. But all  of that can be explored in my program,  
27:12
which is available on my Patreon. For now,  I just want to give a massive thank you to  
27:17
everyone who's already supporting me! That's all from me, thanks for watching!