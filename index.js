const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const pngPath = path.join(__dirname, 'screenshot.png');
let ctx;

let xyRate = 7/4;

const getScreenShot = function(){
	// const writeStream = fs.createWriteStream('./screenshot.png');
	const exec = child_process.exec('/Users/TooBug/Library/Android/sdk/platform-tools/adb exec-out screencap -p >' + pngPath);
	// const exec = child_process.exec('/Users/TooBug/Library/Android/sdk/platform-tools/adb shell screencap -p >' + pngPath);
};

// debug，将中心画出来
const debugPoint = function(point, radius = 7){
	let debugData = ctx.createImageData(radius*2, radius*2);
	for(let j=0;j<debugData.data.length;j+=4){
		debugData.data[j] = 255;
		debugData.data[j+1] = 0;
		debugData.data[j+2] = 0;
		debugData.data[j+3] = 255;
	}
	ctx.putImageData(debugData, point.x-radius, point.y-radius);
}

const drawPng = function(){
	const $canvas = document.getElementById('canvas');
	ctx = $canvas.getContext('2d');
	const img = new Image();
	img.src = 'file://' + pngPath + '?' + Date.now();
	img.onload = function(){
		ctx.drawImage(img, 0, 0);
		doJump();

	};
};

const getDollCenter = function(){
	// 中心颜色#383862
	// 搜索区域坐标
	let x = 200;
	let y = 900;
	let width = 1080 - x*2;
	let height = 1920 - y - 750;
	const imageData = ctx.getImageData(x,y,width,height);
	for(let i=0; i<imageData.data.length; i+=4){
		if(imageData.data[i] === 0x38 &&
			imageData.data[i+1] === 0x38 &&
			imageData.data[i+2] === 0x62){
			let center = {
				// 微调
				x: x + Math.floor((i%(width*4))/4) - 10,
				y: y + Math.floor(i/width/4)
			};
			// debugPoint(center);
			return center;
			break;
		}
	}
	// ctx.putImageData(imageData, x, y);
};

const getNextTop = function(dollCenter){
	// 搜索区域坐标
	let x = 0;
	let y = 300;
	let currentY = y;
	let width = 1080 - x*2;
	let top = null;
	let currColor = [];
	while(!top && currentY < 1000){
		// 一次搜索10像素高区域
		let imageData = ctx.getImageData(x, currentY, width, 10);
		currentY += 10;
		for(let i=0; i<imageData.data.length; i+=4){
			if(!currColor.length){
				currColor = [
					imageData.data[i],
					imageData.data[i+1],
					imageData.data[i+2]
				];
				continue;
			}
			let delta1 = Math.abs(imageData.data[i] - currColor[0]);
			let delta2 = Math.abs(imageData.data[i+1] - currColor[1]);
			let delta3 = Math.abs(imageData.data[i+2] - currColor[2]);
			// console.log(delta1, delta2, delta3);
			if(delta1 + delta2 + delta3 > 10){
				// console.log(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
				// console.log(currColor);
				// console.log(delta1, delta2, delta3);
				let nextTop = {
					// 微调
					x: x + Math.floor((i%(width*4))/4),
					y: currentY + Math.floor(i/width/4) - 12
				};
				if(Math.abs(nextTop.x - dollCenter.x) < 50){
					currColor = [
						imageData.data[i],
						imageData.data[i+1],
						imageData.data[i+2]
					];
				}else{
					top = nextTop;
					break;
				}
			}else{
				currColor = [
					imageData.data[i],
					imageData.data[i+1],
					imageData.data[i+2]
				];
			}
		}
	}
	// debug，将中心画出来
	// debugPoint(top, 1);
	return top;

};

const getNextBottom = function(top){
	// 搜索区域坐标
	let bottom = null;
	let currentY = top.y;
	let currColor = [];
	// 当前已有多少个像素不一样
	let rcCount = 0;

	let imageData = ctx.getImageData(top.x, top.y, 1, 1400-top.y);
	for(let i=0; i<imageData.data.length; i+=4){
		if(!currColor.length){
			currColor = [
				imageData.data[i],
				imageData.data[i+1],
				imageData.data[i+2]
			];
			continue;
		}
		let delta1 = Math.abs(imageData.data[i] - currColor[0]);
		let delta2 = Math.abs(imageData.data[i+1] - currColor[1]);
		let delta3 = Math.abs(imageData.data[i+2] - currColor[2]);
			// console.log(delta1, delta2, delta3);
		if(delta1 + delta2 + delta3 > 10){
			rcCount++;
			if(rcCount < 50) continue;
			console.log(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
			console.log(currColor);
			console.log(delta1, delta2, delta3);
			let nextBottom = {
				// 微调
				x: top.x,
				y: currentY - rcCount
			};
			bottom = nextBottom;
			break;
				/*if(Math.abs(nextTop.x - dollCenter.x) < 50){
					currColor = [
						imageData.data[i],
						imageData.data[i+1],
						imageData.data[i+2]
					];
				}else{
					top = nextTop;
					break;
				}*/
		}else{
			currColor = [
				imageData.data[i],
				imageData.data[i+1],
				imageData.data[i+2]
			];
			currentY++;
		}

	}
	// debug，将中心画出来
	let debugData = ctx.createImageData(15, 15);
	for(let j=0;j<debugData.data.length;j+=4){
		debugData.data[j] = 255;
		debugData.data[j+1] = 0;
		debugData.data[j+2] = 0;
		debugData.data[j+3] = 255;
	}
	ctx.putImageData(debugData, bottom.x-7, bottom.y-7);
	return bottom;

	// ctx.putImageData(imageData, x, y);
};

const getLeftEdge = function(top){
	let start = {
		x: top.x,
		y: top.y + 15
	};
	let currentX = top.x;
	let currColor = [];
	let rcCount = 0;

	let left = null;
	while(!left && currentX >= 0){
		currentY = Math.ceil((start.x - currentX)/xyRate + start.y);
		let imageData = ctx.getImageData(currentX, currentY, 1, 1);
		if(!currColor.length){
			currColor = [
				imageData.data[0],
				imageData.data[1],
				imageData.data[2]
			];
			continue;
		}

		let delta1 = Math.abs(imageData.data[0] - currColor[0]);
		let delta2 = Math.abs(imageData.data[1] - currColor[1]);
		let delta3 = Math.abs(imageData.data[2] - currColor[2]);

		if(delta1 + delta2 + delta3 > 10){
			if(rcCount < 30){
				rcCount++;
				continue;
			}
			// console.log(imageData.data[i], imageData.data[i+1], imageData.data[i+2]);
			// console.log(currColor);
			// console.log(delta1, delta2, delta3);
			let leftEdge = {
				// 微调
				x: currentX - 9,
				// 三角函数
				y: currentY - rcCount/xyRate + 9
			};
			return leftEdge;
		}
		rcCount = 0;
		currentX--;
	}

};

const getDistanceByPoint = function(p1, p2){
	let x = p1.x - p2.x;
	let y = p1.y - p2.y;
	let distance = Math.sqrt(x*x + y*y);
	return distance;
};
const getDistanceByTop = function(dollCenter, nextTop){
	// 比例
	let xDistance = nextTop.x - dollCenter.x;
	// 下一个目标在当前目标的左边还是右边
	let targetDirection = 'right';
	if(xDistance<0){
		targetDirection = 'left';
		xDistance = -xDistance;
	}
	let yDistance = xDistance/xyRate;
	let distance = Math.sqrt(xDistance*xDistance + yDistance*yDistance);
	return {
		distance,
		direction: targetDirection
	};
};

const triggerTap = function(distance){
	let rate = 1.4;
	if(distance > 500){
		rate = 1.34;
	}else if(distance < 250){
		rate = 1.48
	}
	let timeout = (distance * rate) | 0;
	console.log('%s\t%s', distance, timeout);
	// 0.000066*dis^3-0.031*dis^2+8*dis-212
	// console.log(distance.distance|0);
	const exec = child_process.exec('/Users/TooBug/Library/Android/sdk/platform-tools/adb shell input swipe 200 200 200 200 ' + timeout);
};


const doJump = function(){
	dollCenter = getDollCenter();
	if(!dollCenter){
		console.log('已停止');
	}else{
		// console.log(dollCenter);
		let nextTop = getNextTop(dollCenter);
		// console.log(nextTop)
		// let nextBottom = getNextBottom(nextTop);
		let leftEdge = getLeftEdge(nextTop);
		// console.log(leftEdge);

		debugPoint(dollCenter);
		debugPoint(nextTop);

		let distance;
		if(leftEdge){
			debugPoint(leftEdge);
			let topLeftDistance = getDistanceByPoint(nextTop, leftEdge);
			if(topLeftDistance > 50){
				let nextCenter = {
					x: nextTop.x,
					y: leftEdge.y
				};
				debugPoint(nextCenter);
				distance = getDistanceByPoint(dollCenter, nextCenter);
			} else{
				distance = getDistanceByTop(dollCenter, nextTop).distance;
			}
		}else{
			// 异常了
			distance = getDistanceByTop(dollCenter, nextTop).distance;
		}
		triggerTap(distance);
	}
	setTimeout(start, 3000);
};

const start = function(){
	getScreenShot();
	setTimeout(drawPng, 1000);
};

start();
