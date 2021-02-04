let t = 50

class ball{
    x=-1;
    y=-1;
    radius=10;
    friction = {x: .05, y: .05};
    velocity = {x: 0, y: 0};
    prevX = -1;
    prevY = -1;
    color = "green";
    grabbed = false;
    collisionChecked = false;
    checkHit(ball){
        let dx = this.x-ball.x, dy = this.y-ball.y;
        if(Math.sqrt(dx*dx + dy*dy) <= this.radius + ball.radius && !ball.collisionChecked && !ball.grabbed){
            let temp = ball.velocity;
            ball.velocity.x = this.velocity.x;
            ball.velocity.y = this.velocity.y;
            if(!this.grabbed && !this.collisionChecked){
                this.velocity.x = temp.x;
                this.velocity.y = temp.y;
                this.collisionChecked = true;
            }

            return true;
        }
        return false;
    }

    checkBounds(){
        if(!this.grabbed){
            if(((this.x-this.radius)+this.velocity.x < 0) || ((this.x+this.radius)+this.velocity.x > 1920))
                this.velocity.x *=-1;
        
            if(((this.y-this.radius)+this.velocity.y < 0) || ((this.y+this.radius)+this.velocity.y > 1080))
                this.velocity.y*=-1;
        }
        if((this.x-this.radius)<=0) this.x = this.radius;
        if((this.x+this.radius)>=1920) this.x = 1920-this.radius;
        if((this.y-this.radius)<=0) this.y = this.radius;
        if((this.y+this.radius)>=1080) this.y = 1080-this.radius;
            
    }

    update(balls){
        //debug("Drawing ball: " + this.x +  " " + this.y);
        if(this.grabbed){
            this.velocity.x = (this.x-this.prevX)*t/10;
            this.velocity.y = (this.y-this.prevY)*t/10;
        }
        this.prevX = this.x;
        this.prevY = this.y;
        
        for (b of balls)
            this.checkHit(b);

        if(!this.grabbed)
            this.applyFriction();
        this.checkBounds();
        if(!this.grabbed){
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        } else{
            this.x = inputs().mouseX;
            this.y = inputs().mouseY;
        }
        canvas("beginPath()");
        canvas("fillStyle='" + this.color + "'");
        canvas(`arc(${this.x}, ${this.y}, ${this.radius}, 0, 2*Math.PI, false)`);
        canvas("fill()");
        
        //canvas("stroke()");

    }

    checkOverlap(x,y){
        let dx = this.x-x, dy = this.y-y;
        if(Math.sqrt(dx*dx + dy*dy) <= this.radius) return true;
    }

    applyAccel(deltaX, deltaY){
        this.velocity = {x: this.velocity.x + deltaX, y: this.velocity.y + deltaY};
        return this.velocity;
    }

    applyFriction(){
        this.applyAccel(this.friction.x * -this.velocity.x, this.friction.y * -this.velocity.y );
    }

    constructor(x, y, radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocity={x: (Math.random()*200)-100, y: (Math.random()*200)-100};
        this.friction = {x: Math.random(), y: Math.random()};
        //debug("New ball: " + this.x + " " + this.y);
    }
}

let balls = [];
let clicking = false;
let spawnedBall = false;
let grabbedBall = null;
balls.push(new ball(1920/2, 1080/2, 100));
while(true){
    //debug(balls);
    if(inputs().mousePresses.indexOf(0) > -1)
    clicking = true;
    else{
        clicking = false;
        spawnedBall = false;
        
        if(grabbedBall != null){
            b.grabbed = false;
            grabbedBall = null;
            //debug("released ball");
        }
    }

    
    //if(grabbedBall != null) debug(grabbedBall);
    for(b of balls){
        if(clicking && !spawnedBall && grabbedBall==null && b.checkOverlap(inputs().mouseX, inputs().mouseY)){
            b.grabbed = true;
            grabbedBall = b;
            //debug("Grabbed ball");
        }
        else if(b.grabbed && b !== grabbedBall) b.grabbed = false;
        b.update(balls);
        
    }
    if(grabbedBall == null && clicking && !spawnedBall){
        balls.push(new ball(inputs().mouseX, inputs().mouseY, 100));
        spawnedBall = true;
    }
    canvas("beginPath()");
    canvas("fillStyle='#000000'");
    canvas(`arc(${inputs().mouseX}, ${inputs().mouseY}, 2, 0, 2*Math.PI, false)`);
    canvas("fill()");
    time.wait(t);
    canvas("clearRect(0,0,1920,1080)");
    for(b of balls) b.collisionChecked = false;
    let x = 1+1;
}