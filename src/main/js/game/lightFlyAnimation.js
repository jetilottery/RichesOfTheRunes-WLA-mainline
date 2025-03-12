define(function module(require){
	'use strict';
	const TweenFunctions = require('./utils/tweenFunctions');
	const TweenPath 	 = require('./utils/tweenPath');
	const msgBus   		 = require('skbJet/component/gameMsgBus/GameMsgBus');
	const gr 			 = require('skbJet/component/gladPixiRenderer/gladPixiRenderer');
	const KeyFrameAnimation = require('skbJet/component/gladPixiRenderer/KeyFrameAnimation');
	const Sprite 		 = require('skbJet/component/gladPixiRenderer/Sprite');
	const SKBeInstant 		 = require('skbJet/component/SKBeInstant/SKBeInstant');
	KeyFrameAnimation.prototype.updateStyleToTime = function(time){
		if(time<0||time>this.maxTime){
			console.warn('Time out of animation range.');
			return;
		}
		if(this._onUpdate){
			if(this._onUpdate.hasOwnProperty('handler') && typeof this._onUpdate.handler === 'function'){
				this._onUpdate.handler.call(this._onUpdate.subscriberRef, {time:time, caller:this});
			}	
			else{
				this._onUpdate(time);
			}
		}
		else{
			var frame = this.getFrameAtTime(time);
			if(!frame._SPRITES){
				return;
			}
			for(var i=0;i<this._spritesNameList.length;i++){
				var sprite = this._gladObjLib[this._spritesNameList[i]];
				sprite.updateCurrentStyle(frame._SPRITES[i]._style);
			}
		}
	};
	function LightFlyAnimation(data){
		this.lightSprite = null;
		this.lightSpriteCont = null;
		this.stoneSprite = null;
		this.runeSprite = null;
		this.doorYellowBallSprite = null;
		this.doorBonusSymbolSprite = null;
		this.doorWinningPriceSprite = null;
		this.amuletYellowBallSprite = null;
		this.amuletBonusSymbolSprite = null;
		this.doorBonusSymbolPopAnim = null;
		this.whetherMoney = null;
		this.doorBonusSymbolWinValueAnim = null;
		this.kf_bottomToTop = null;
		this.kf_centerToRight = null;
		this.amuletNum = null;
		this.spriteAnimArray = Sprite.getSpriteSheetAnimationFrameArray('doorRuneEffect2');
		window.gr = gr;
	}
	LightFlyAnimation.prototype.moveTo = function (startObj, targetObj,whetherMoney,time,amuletNum){
		console.log("From "+startObj.getName()+" to "+targetObj.getName());
		window.lfa = this;
		this.initSprites(startObj, targetObj);
		this.whetherMoney = whetherMoney;
		const startPoint = this.getCentrePoint(startObj);
		const targetPoint = this.getCentrePoint(targetObj);
		const pathAtoB = new TweenPath(); //draw a line from startObj to targetObj
		pathAtoB.moveTo(startPoint.x, startPoint.y).lineTo(targetPoint.x, targetPoint.y);
		pathAtoB.closed = false;
		const distanceAtoB = parseInt(pathAtoB.totalDistance());
		const lengthOfLight = this.lightSprite.getCurrentStyle()._width;
		this.setLightSpritePosition(startPoint, targetPoint);
		if(distanceAtoB > lengthOfLight){
			/* distance from start to target is bigger than the length of the lightSprite, therefore
			the ligthSprite needs to move a certain distance(diff) to make sure it reach the end, 
			and play the animation during the movement.
			*/
			const distance_diff = distanceAtoB - lengthOfLight;
			const newTargetPoint = pathAtoB.getPointAtDistance(distance_diff);
			this.kf_bottomToTop.startPoint = startPoint;
			this.kf_bottomToTop.targetPoint = {x: parseInt(newTargetPoint.x), y:parseInt(newTargetPoint.y)};
		}
		else{
			/* only play the sprite animation by the keyFrameAnimation but do not need to move*/
			this.kf_bottomToTop.startPoint = null;
			this.kf_bottomToTop.targetPoint = null;
		}
		this.kf_bottomToTop.maxTime = time;
		this.lightSprite.setImage("doorRuneEffect2_0001");
		this.lightSpriteCont.show(true);
		this.kf_bottomToTop.play();
		gr.getTimer().setTimeout(()=>{
			this.kf_bottomToTopWillBeComplete();
		},150);
		this.amuletNum = amuletNum;
		console.log(this.kf_bottomToTop._name+" is called to play!");
		//this.lightSprite.gotoAndPlay("doorRuneEffect2", 0.5, false);
	};

	LightFlyAnimation.prototype.getCentrePoint = function(sprite){
		return { //center of the sprite
			x: sprite.toGlobal({x:0,y:0}).x + sprite.getCurrentStyle()._width*0.5,
			y: sprite.toGlobal({x:0,y:0}).y + sprite.getCurrentStyle()._height*0.5
		};
	};

	LightFlyAnimation.prototype.kf_bottomToTopWillBeComplete = function(sprite){
		this.doorYellowBallSprite.show(true);
		 gr.getTimer().setTimeout(()=>{
            this.yellowBallAnimComplete();
        },400);
		msgBus.publish('gameScenceShake', 30);
		this.bonusDoorRuneSprite.show(false);
		this.doorYellowBallSprite.gotoAndPlay('doorRuneEffect', 0.5, false);
	};

	LightFlyAnimation.prototype.initSprites = function(startObj, targetObj){
		this.stoneSprite = startObj;
		this.runeSprite = targetObj;
		const stoneOrderNum = this.stoneSprite.getName().substr(this.stoneSprite.getName().length-1); //stone's number 1 - 8
		const runeOrderNum = this.runeSprite.getName().substr(this.runeSprite.getName().length-1);	// rune's number 1-4
		this.lightSpriteCont = gr.lib["_effectBAnchro_"+runeOrderNum];
		this.lightSprite = gr.lib["_doorRuneEffectB_"+runeOrderNum];
		this.doorYellowBallSprite = gr.lib['_doorRuneEffect_'+runeOrderNum];
		this.doorBonusSymbolSprite = gr.lib['_bonusDoorRuneWin_'+runeOrderNum];
		this.doorWinningPriceSprite = gr.lib['_bonusDoorWinValue_'+runeOrderNum];
		this.amuletYellowBallSprite = gr.lib['_bonusAmuletEffect_'+runeOrderNum];
		this.amuletBonusSymbolSprite = gr.lib['_bonusDoorAmuletSymbols_'+runeOrderNum];
		this.doorBonusSymbolPopAnim = gr.animMap['_bonusDoorAmuletSymbolsAnim_'+runeOrderNum];
		this.doorBonusSymbolWinValueAnim = gr.animMap['_bonusDoorWinValueAnim_'+runeOrderNum];
		this.bonusDoorRuneSprite = gr.lib['_bonusDoorRune_'+runeOrderNum];
		console.log("initialised "+this.lightSpriteCont.getName()+", "+this.lightSprite.getName());
		if(this.kf_bottomToTop == null){
			this.setupKeyFrameAnimations(runeOrderNum);
		}
	};

	LightFlyAnimation.prototype.setupKeyFrameAnimations = function (surfix){
		const duration = 1000;
		const that = this;
		//keyFrameAnimation for movement from stone to door.
		this.kf_bottomToTop = new KeyFrameAnimation({
			"_name": 'kf_bottomToTop'+surfix,
			"_keyFrames": [
				{"_time": 0, "_SPRITES": []},
				{"_time": duration,	"_SPRITES": []}
			]
		}); 
		this.kf_bottomToTop._onUpdate = function (timeDelta){
			that.kf_bottomToTopOnUpdate(timeDelta);
		};
		this.kf_bottomToTop._onComplete = function (){
			that.kf_bottomToTopOnComplete();
		};
		//KeyFrameAnimation from door to bonus symbol
		this.kf_centerToRight = new KeyFrameAnimation({
			"_name": 'kf_centerToRight'+surfix,
			"_keyFrames": [
				{"_time": 0, "_SPRITES": []},
				{"_time": duration,	"_SPRITES": []}
			]
		}); 
		this.kf_centerToRight._onUpdate = function (timeDelta){
			that.kf_centerToRightOnUpdate(timeDelta);
		};
		this.kf_centerToRight._onComplete = function (){
			that.kf_centerToRightOnComplete();
		};
	};
	LightFlyAnimation.prototype.getLightFrameIndexFromTime = function (timeDelta, totalTime){
		const time = (timeDelta < totalTime)?timeDelta:totalTime;
		const frameNumIndex = parseInt(TweenFunctions.linear(time, 0, this.spriteAnimArray.length-1, totalTime));
		return this.spriteAnimArray[frameNumIndex];
	};
	LightFlyAnimation.prototype.kf_bottomToTopOnUpdate = function (timeDelta){
		const duration = this.kf_bottomToTop.maxTime;
		const frameName = this.getLightFrameIndexFromTime(timeDelta, duration);
		if(frameName !== this.lightSprite.getImage()){
			//update sprite image according to the time
			this.lightSprite.setImage(frameName);
			//console.log(frameName);
		}
		if(this.kf_bottomToTop.startPoint && this.kf_bottomToTop.targetPoint){
			const newX = TweenFunctions.linear(timeDelta, this.kf_bottomToTop.startPoint.x, this.kf_bottomToTop.targetPoint.x, duration);
			const newY = TweenFunctions.linear(timeDelta, this.kf_bottomToTop.startPoint.y, this.kf_bottomToTop.targetPoint.y, duration);
			this.lightSpriteCont.updateCurrentStyle({"_left":newX, "_top":newY});
		}
	};

	LightFlyAnimation.prototype.kf_bottomToTopOnComplete = function (){
		// light animation from stone to door is finished, do what you need here.
		this.lightSpriteCont.show(false);
		// this.doorYellowBallSprite.onComplete = function(){
		// 	that.yellowBallAnimComplete();
		// };
		console.log(this.kf_bottomToTop._name+" is completed!");
	};
	LightFlyAnimation.prototype.yellowBallAnimComplete = function(){
		this.doorYellowBallSprite.show(false);
		//add your condition here to change which one been turn on.
		const that = this;
		this.doorBonusSymbolSprite.show(false);
		if(this.whetherMoney){
			this.amuletBonusSymbolSprite.setImage('bonusDoorRuneWin_'+this.amuletNum);
			this.amuletBonusSymbolSprite.show(true);
			this.doorBonusSymbolPopAnim.play();
			this.doorBonusSymbolPopAnim._onComplete = function(){
				that.doorBonusSymbolPopAnim_OnComplete();
			};
		}else{
            this.doorWinningPriceSprite.show(true);
            this.doorBonusSymbolWinValueAnim.play();
		}
	};
	LightFlyAnimation.prototype.doorBonusSymbolPopAnim_OnComplete = function(){
		if(SKBeInstant.getGameOrientation()==="landscape"){
			this.moveToRight(this.runeSprite, this.amuletYellowBallSprite);
		}else{
			msgBus.publish('centerToRightOnComplete',{amuletNum:this.amuletNum});
		}
	};
	LightFlyAnimation.prototype.moveToRight = function (startObj, targetObj){
		const startPoint = this.getCentrePoint(startObj);
		const targetPoint = this.getCentrePoint(targetObj);
		const pathCtoD = new TweenPath(); //draw a line from startObj to targetObj
		pathCtoD.moveTo(startPoint.x, startPoint.y).lineTo(targetPoint.x, targetPoint.y);
		pathCtoD.closed = false;
		const distanceCtoD = parseInt(pathCtoD.totalDistance());
		const lengthOfLight = this.lightSprite.getCurrentStyle()._width;
		this.setLightSpritePosition(startPoint, targetPoint);
		if(distanceCtoD > lengthOfLight){
			/* distance from start to target is bigger than the length of the lightSprite, therefore
			the ligthSprite needs to move a certain distance(diff) to make sure it reach the end, 
			and play the animation during the movement.
			*/
			const distance_diff = distanceCtoD - lengthOfLight;
			const newTargetPoint = pathCtoD.getPointAtDistance(distance_diff);
			this.kf_centerToRight.startPoint = startPoint;
			this.kf_centerToRight.targetPoint = {x: parseInt(newTargetPoint.x), y:parseInt(newTargetPoint.y)};
		}
		else{
			/* only play the sprite animation by the keyFrameAnimation but do not need to move*/
			this.kf_centerToRight.startPoint = null;
			this.kf_centerToRight.targetPoint = null;
		}
		this.kf_centerToRight.maxTime = 500;
		this.lightSprite.setImage("doorRuneEffect2_0001");
		this.lightSpriteCont.show(true);
		this.kf_centerToRight.play();

	};
	LightFlyAnimation.prototype.kf_centerToRightOnUpdate = function (timeDelta){
		const duration = this.kf_centerToRight.maxTime;
		const frameName = this.getLightFrameIndexFromTime(timeDelta, duration);
		if(frameName !== this.lightSprite.getImage()){
			//update sprite image according to the time
			this.lightSprite.setImage(frameName);
			//console.log(frameName);
		}
		if(this.kf_centerToRight.startPoint && this.kf_centerToRight.targetPoint){
			const newX = TweenFunctions.linear(timeDelta, this.kf_centerToRight.startPoint.x, this.kf_centerToRight.targetPoint.x, duration);
			const newY = TweenFunctions.linear(timeDelta, this.kf_centerToRight.startPoint.y, this.kf_centerToRight.targetPoint.y, duration);
			this.lightSpriteCont.updateCurrentStyle({"_left":newX, "_top":newY});
		}
	};
	LightFlyAnimation.prototype.kf_centerToRightOnComplete = function (){
		msgBus.publish('centerToRightOnComplete',{amuletNum:this.amuletNum});
		console.log("Bonus symbol animation completed "+this.kf_centerToRight._name);
	};
	LightFlyAnimation.prototype.setLightSpritePosition = function (startPos, targetPos){
		const degree = this.getDegreeFromTwoPoint(startPos, targetPos);
		this.lightSpriteCont.updateCurrentStyle({"_left":startPos.x, "_top":startPos.y,"_transform":{"_rotate":degree}});
	};
	LightFlyAnimation.prototype.getDegreeFromTwoPoint = function(startPos, targetPos){
		const angle = Math.atan2((startPos.y-targetPos.y), (targetPos.x-startPos.x)); //弧度 -0.6435011087932844, 即 2*Math.PI - 0.6435011087932844
		const theta = parseInt(angle*(180/Math.PI));  //角度 -36.86989764584402，即360 - 36.86989764584402 = 323.13010235415598
		const degree = 180 - theta; //transform to the other corner.
		return degree;
	};
	return LightFlyAnimation;
});