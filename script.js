const imgFolder = "img/";
const outFolder = "out/";

let fs = require('fs'),
    resemble = require('node-resemble-js');

/*
let pixelmatch = require('pixelmatch'),
    PNG = require('pngjs').PNG;
let img1 = fs.createReadStream(path1).pipe(new PNG()).on('parsed', doneReading),
    img2 = fs.createReadStream(path2).pipe(new PNG()).on('parsed', doneReading),
    filesRead = 0;

function doneReading() {
    if (++filesRead < 2) return;
    let diff = new PNG({width: img1.width, height: img1.height});
    pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {threshold: 0.1});

    diff.pack().pipe(fs.createWriteStream(outFolder+'diffL.png'));
}
 */



/*

*/



let looksSame = require('looks-same');
var Jimp = require('jimp');

class Manager{
    constructor(ms){
        this.maxSpread = ms;
    }
    closestAvg(avgs, x, y){
        if (avgs.length === 0){return -1;}
        let minDistance, minIndex;
        for (let i = 0; i < avgs.length; i++){
            let distanceSqr = Math.sqrt((avgs[i].x-x)*(avgs[i].x-x) + (avgs[i].y-y)*(avgs[i].y-y));
            if (i === 0){
                minDistance = distanceSqr;
                minIndex = 0;
            }

            if (distanceSqr < minDistance){
                minDistance = distanceSqr;
                minIndex = i;
            }
        }

        if (minDistance < this.maxSpread){
            return minIndex;
        } else {
            return -1;
        }
    }
}

class Difference{
    constructor(clr, trans){
        resemble.outputSettings({
            errorColor: {
                red: clr.red,
                green: clr.green,
                blue: clr.blue
            },
            errorType: 'movement',
            transparency: trans
        });
    }
    compadeTwo(input1, input2, outBue, outRaw){

        let allDiff;
        var fileData1 = fs.readFileSync(imgFolder+input1);
        var fileData2 = fs.readFileSync(imgFolder+input2);
        resemble(fileData1).compareTo(fileData2)
        //.ignoreAntialiasing()
        //.ignoreColors()
        //.ignoreRectangles([[325,170,100,40]])
            .onComplete(function(data){
                data.getDiffImage().pack().pipe(fs.createWriteStream(outFolder+outBue));
            });
        looksSame.createDiff({
            reference: imgFolder+input1,
            current: imgFolder+input2,
            diff: outFolder+"outRawBuff.png",
            highlightColor: '#ff00ff', // color to highlight the differences
            strict: false, // strict comparsion
            tolerance: 0.001,
            antialiasingTolerance: 0,
            ignoreAntialiasing: true, // ignore antialising by default
            ignoreCaret: true // ignore caret by default
        }, function(callback) {

            if (callback){
                allDiff = callback.allDiff;
                setTimeout(function(){
                    Jimp.read(imgFolder+input2, (err, image) => {

                        if (err) throw err;
                        let avgs = [];
                        for (let i = 0; i < allDiff.length; i++){
                            let X = allDiff[i].x,
                                Y = allDiff[i].y;

                            let avgI = MANAGER.closestAvg(avgs, X, Y);
                            if (avgI === -1){
                                let newAvg = {
                                    x: X,
                                    y: Y,
                                    cnt: 0,
                                    curAvgX: 0,
                                    curAvgY: 0
                                };
                                avgs.push(newAvg);
                                avgI = avgs.length - 1;
                            }
                            avgs[avgI].cnt += 1;
                            avgs[avgI].x = avgs[avgI].x + (X - avgs[avgI].x)/avgs[avgI].cnt;
                            avgs[avgI].y = avgs[avgI].y + (Y - avgs[avgI].y)/avgs[avgI].cnt;

                            let clr = Jimp.cssColorToHex(rgbToHex(50+avgI*30,0,255-avgI*30));
                            image.setPixelColor(clr, X, Y);
                        }

                        for (let i = 0; i < avgs.length; i++){
                            let aX = avgs[i].x;
                            let aY = avgs[i].y;


                            let clr = Jimp.cssColorToHex(rgbToHex(255,0,0));

                            image.setPixelColor(clr, aX, aY);
                            image.setPixelColor(clr, aX-1, aY);
                            image.setPixelColor(clr, aX, aY-1);
                            image.setPixelColor(clr, aX+1, aY);
                            image.setPixelColor(clr, aX, aY+1);

                            image.setPixelColor(clr, aX+1, aY+1);
                            image.setPixelColor(clr, aX+1, aY-1);
                            image.setPixelColor(clr, aX-1, aY+1);
                            image.setPixelColor(clr, aX-1, aY-1);

                            let WIDTH = image.getWidth()/2,
                                HEIGHT = image.getHeight()/2;

                            let distToCenter = Math.sqrt( (WIDTH-aX)*(WIDTH-aX)+(HEIGHT-aY)*(HEIGHT-aY) );
                            let accuracy = 1-(distToCenter)/(WIDTH+HEIGHT);
                            console.log("Hit",i+":",(accuracy*100).toFixed(2)+"%",distToCenter,aX,":",aY);

                            image.write(outFolder+outRaw);
                        }

                    });

                },1000);
            }

        });
    }
}

let DIF = new Difference({red:155,green:0,blue:155},.9);
let MANAGER = new Manager(70);

DIF.compadeTwo("1.png","5.png","outBue.png","outRaw.png");



function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/*
looksSame(path1, path2, {stopOnFirstFail: false}, function(error, {equal, diffBounds, diffClusters}) {
    console.log(diffBounds);
    console.log(diffClusters);
    console.log(error);
    Jimp.read(outFolder+"out.jpg", (err, image) => {
        if (err) throw err;
        image
            .setPixelColor(0xFF0000FF, diffClusters[0].left, diffClusters[0].top)
        //.resize(256, 256) // resize
        //.quality(60) // set JPEG quality
        //.greyscale() // set greyscale

        .write('image.jpg'); // save

    });
});
*/



