/**
 * @module game/playAnimationController
 * @description 
 */
define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'skbJet/component/SKBeInstant/SKBeInstant',
    'game/utils/gladButton',
    './lightFlyAnimation',
], function(msgBus, audio, gr, loader, SKBeInstant, gladButton, LightFlyAnimation) {
    var prizeTable = {}; //To record ticket prize table
    var tutorialIsShown = false;
    var playResult;
    var symbolCh = 2;
    var revealAll = false;
    var jackpot = 0;
    var onlyBonus = 0;
    var baseTransitions, bonusTransitions;
    var clickedNum = 0,
        clickRuneNum = 0;
    var winValue = 0;
    var BaseGameArray = [],
        RuneArray = [],
        Amulet = [],
        RuneRandomArr = [];
    var runeNum = 0,
        amuletNum = 0;
    var isRuneBonus = false,
        isAmuletBonus = false,
        isInit = true,
        firstTicket = true;
    let gameError = false;
    let buttonRules = { 'avoidMultiTouch': true, 'automaticSetImg': true };
    let symbolButton = {},
        runeButton = {},
        amuletButton = {};
    let haveReveal = true;
    const lightAnimations = { receptions: [], free: [], used: [] };

    function resetAll() {
        tutorialIsShown = false;
        BaseGameArray = [];
        RuneArray = [];
        Amulet = [];
        RuneRandomArr = [];
        symbolCh = 2;
        playResult = null;
        revealAll = false;
        jackpot = 0;
        onlyBonus = 0;
        clickedNum = 0;
        winValue = 0;
        clickRuneNum = 0;
        runeNum = 0;
        amuletNum = 0;
        isRuneBonus = false;
        gameError = false;
        isAmuletBonus = false;
        if (isInit) {
            isInit = false;
        }
        initialBaseGame();
        resetRuneSymbols();
        initialRuneBonus();
        initialAmuletBonus();
    }

    function resetRuneSymbols() {
        for (let i = 1; i < 4; i++) {
            for (let j = 1; j < 6; j++) {
                let sprite = gr.lib['_runeSymbols_' + i + '_' + j];
                let data = sprite.data;
                sprite.updateCurrentStyle({
                    "_top": data._style._top,
                    "_left": data._style._left,
                });
            }
        }
    }

    function cloneGladAnim() {
        for (var i = 1; i < 9; i++) {
            gr.animMap._bonusAStoneLightAnim_1.clone(['_bonusAStoneLight_' + i], '_bonusAStoneLightAnim_' + i);
            gr.animMap._bonusAStoneDisapper_1.clone(['_bonusAStoneBG_' + i], '_bonusAStoneDisapper_' + i);
            gr.animMap._bonusStoneRuneAnim_1.clone(['_bonusStoneRune_' + i], '_bonusStoneRuneAnim_' + i);
        }
        for (var k = 1; k < 7; k++) {
            gr.animMap._bonusBwinValueAnim_1.clone(['_bonusBwinNumbleValue_' + k], '_bonusBwinValueAnim_' + k);
            gr.animMap._bonusBSymbolsAnim_1.clone(['_symbosS_' + k], '_bonusBSymbolsAnim_' + k);
        }
        for (var c = 1; c < 5; c++) {
            gr.animMap._bonusDoorRuneAnimA_1.clone(['_bonusDoorRuneWin_' + c], '_bonusDoorRuneAnimA_' + c);
            gr.animMap._bonusDoorWinValueAnim_1.clone(['_bonusDoorWinValue_' + c], '_bonusDoorWinValueAnim_' + c);
            gr.animMap._bonusDoorAmuletSymbolsAnim.clone(['_bonusDoorAmuletSymbols_' + c], '_bonusDoorAmuletSymbolsAnim_' + c);
        }
        for (var a = 1; a < 4; a++) {
            for (var b = 1; b < 6; b++) {
                gr.animMap._runeSymbolsRevealAnim_1.clone(['_runeSymbols_' + a + '_' + b], '_runeSymbolsRevealAnim_' + a + '_' + b);
                gr.animMap._noWinSymbolsAnim_1.clone(['_noWinSymbols_' + a + '_' + b], '_noWinSymbolsAnim_' + a + '_' + b);
            }
        }
    }

    function onStartUserInteraction(data) {



        var splitArray;
        if (data.scenario) {
            splitArray = data.scenario.split('|');
            BaseGameArray = splitArray[0].split(',');
            RuneArray = splitArray[1].split(',');
            Amulet = splitArray[2];
            playResult = data.playResult;
            winValue = data.prizeValue;
        } else {
            return;
        }
        for (let i = 0; i < data.prizeTable.length; i++) {
            prizeTable[data.prizeTable[i].description] = Number(data.prizeTable[i].prize);
        }
        let index = 0;
        for (var i = 1; i < 4; i++) {
            for (var j = 1; j < 6; j++) {
                gr.lib['_stoneLightAnim_' + i + '_' + j].show(true);
                gr.lib['_stoneExplosion_' + i + '_' + j].show(false);
                if (firstTicket) {
                    symbolButton[index].click(gr.lib['_stoneLightAnim_' + i + '_' + j].revealFun);
                }
                gr.lib['_stoneLightAnim_' + i + '_' + j].pixiContainer.cursor = "pointer";
                gr.lib['_stoneLightAnim_' + i + '_' + j].pixiContainer.interactive = true;
                gr.lib['_stoneLightAnim_' + i + '_' + j].on('mouseover', symbolAnimStop);
                gr.lib['_stoneLightAnim_' + i + '_' + j].on('mouseout', symbolAnimstart);
                index++;
            }

        }
        firstTicket = false;
        symbolAnimstart();
    }

    function symbolAnimStop() {
        for (var i = 1; i < 4; i++) {
            for (var j = 1; j < 6; j++) {
                if (!gr.lib['_stoneLightAnim_' + i + '_' + j].reveal) {
                    gr.lib['_stoneLightAnim_' + i + '_' + j].gotoAndStop(0);
                }
            }
        }
        gr.lib[this.name].gotoAndPlay('stoneLightAnim', 0.2, true);
        hitAreaButton(gr.lib[this.name], 0.2);
    }

    function symbolAnimstart() {
        for (var i = 1; i < 4; i++) {
            for (var j = 1; j < 6; j++) {
                if (!gr.lib['_stoneLightAnim_' + i + '_' + j].reveal) {
                    gr.lib['_stoneLightAnim_' + i + '_' + j].gotoAndPlay('stoneLightAnim', 0.2, true);
                    hitAreaButton(gr.lib['_stoneLightAnim_' + i + '_' + j], 0.2);
                }
            }
        }
    }

    function onReStartUserInteraction(data) {
        onStartUserInteraction(data);
    }

    function onReInitialize() {
        resetAll();
    }

    function setSymbolRevealFun(symbol, i, j) {
        symbol.revealFun = function() {
            if (tutorialIsShown) {
                return;
            }
            clickedNum++;
            console.log('clickedNum:' + clickedNum);
            symbol.reveal = true;
            if (clickedNum === 15) {
                msgBus.publish('hiddenInfo');
                gr.lib._buttonRevealAll.show(false);
                gr.getTimer().setTimeout(function() {
                    allSymbolsRevealed();
                }, 2400);
            } else {
                if (symbol.needPlayAnim) {
                    symbolAnimstart();
                }
            }
            symbolCh++;
            if (symbolCh > 6) {
                symbolCh = 3;
            }
            symbol.pixiContainer.interactive = false;
            symbol.pixiContainer.$sprite.cursor = "default";
            var index = symbol.gameIndex;
            var prizeDetail = BaseGameArray[index];
            var isWin, Iscollection;
            isWin = prizeDetail.substring(0, 1);
            Iscollection = prizeDetail.substring(1, 2);
            if (symbol.needPlayAnim) {
                if (isWin === "Y") {
                    audio.play('SymbolWinning', symbolCh + 4);
                } else {
                    audio.play('SymbolReveal', symbolCh + 4);
                }
                if (Iscollection < 5) {
                    if (Iscollection > 0) {
                        audio.play('SymbolRune', symbolCh);
                    }
                } else {
                    audio.play('SymbolAmulet', symbolCh);
                }
            } else {
                if (isWin === "Y") {
                    audio.play('SymbolWinningQuick', symbolCh + 4);
                } else {
                    audio.play('SymbolRevealQuick1', symbolCh + 4);
                }
                if (Iscollection < 5) {
                    if (Iscollection > 0) {
                        audio.play('SymbolRuneQuick', symbolCh);
                    }
                } else {
                    audio.play('SymbolAmuletQuick', symbolCh);
                }
            }
            gr.lib['_stoneLightAnim_' + i + '_' + j].stopPlay('stoneLightAnim');
            gr.lib['_stoneLightAnim_' + i + '_' + j].show(false);
            gr.lib['_stoneExplosion_' + i + '_' + j].show(true);
            gr.lib['_stoneExplosion_' + i + '_' + j].gotoAndPlay('stoneExplosion', 0.6, false);
            gr.lib['_stoneExplosion_' + i + '_' + j].onComplete = function() {
                gr.lib['_stoneExplosion_' + i + '_' + j].show(false);
                if (isWin === "Y") {
                    gr.lib['_winSymbols_' + i + '_' + j].show(true);
                    msgBus.publish("WinningSymbolReveal");
                } else {
                    gr.lib['_noWinSymbols_' + i + '_' + j].show(true);
                    gr.animMap['_noWinSymbolsAnim_' + i + '_' + j].play();
                }
                if (Iscollection < 5) {
                    if (Iscollection > 0) {
                        gr.lib['_runeLight' + i + '_' + j].show(true);
                        gr.lib['_runeSymbols_' + i + '_' + j].setImage('SymbolsR_' + Iscollection);
                        if (symbol.needPlayAnim) {
                            gr.animMap['_runeSymbolsAnim' + i + '_' + j].play();
                            gr.lib['_RuneSymbolsLight_' + i + '_' + j].show(true);
                            gr.lib['_RuneSymbolsLight_' + i + '_' + j].gotoAndPlay('RuneSymbolsLight', 0.3);
                            gr.animMap['_runeSymbolsAnim' + i + '_' + j]._onComplete = function() {
                                gr.lib['_runeLight' + i + '_' + j].show(false);
                                gr.lib['_runeEffect_' + Iscollection].show(true);
                                gr.lib['_runeEffect_' + Iscollection].gotoAndPlay('RuneSymbolsEffect', 0.5, false);
                                gr.lib['_runeEffect_' + Iscollection].onComplete = function() {
                                    gr.lib['_runeEffect_' + Iscollection].show(false);
                                    runeBonusLight(Iscollection);
                                };
                            };
                        } else {
                            gr.lib['_runeLight_' + i + '_' + j].show(false);
                            gr.lib['_runeSymbols_' + i + '_' + j].show(false);
                            gr.lib['_RuneSymbolsLight_' + i + '_' + j].show(false);
                            gr.animMap['_runeSymbolsRevealAnim_' + i + '_' + j]._onComplete = function() {
                                gr.lib['_runeLight' + i + '_' + j].show(false);
                            };
                            gr.lib['_runeEffect_' + Iscollection].show(true);
                            gr.lib['_runeEffect_' + Iscollection].gotoAndPlay('RuneSymbolsEffect', 0.5, false);
                            gr.lib['_runeEffect_' + Iscollection].onComplete = function() {
                                gr.lib['_runeSymbols_' + i + '_' + j].show(true);
                                gr.lib['_runeEffect_' + Iscollection].show(false);
                                gr.animMap['_runeSymbolsRevealAnim_' + i + '_' + j].play();
                                runeBonusLight(Iscollection);
                            };
                        }
                    }
                } else {
                    gr.lib['_runeLight' + i + '_' + j].show(true);
                    gr.lib['_runeSymbols_' + i + '_' + j].setImage('SymbolsA_' + (Iscollection - 4));
                    if (symbol.needPlayAnim) {
                        gr.animMap['_amuletSymbolsAnim' + i + '_' + j].play();
                        gr.lib['_RuneSymbolsLight_' + i + '_' + j].show(true);
                        gr.lib['_RuneSymbolsLight_' + i + '_' + j].gotoAndPlay('RuneSymbolsLight', 0.3);
                        gr.animMap['_amuletSymbolsAnim' + i + '_' + j]._onComplete = function() {
                            gr.lib['_runeLight' + i + '_' + j].show(false);
                            gr.lib['_amuletEffect_' + (Iscollection - 4)].show(true);
                            gr.lib['_amuletEffect_' + (Iscollection - 4)].gotoAndPlay('AmuletSymbolsEffect', 0.5, false);
                            gr.lib['_amuletEffect_' + (Iscollection - 4)].onComplete = function() {
                                gr.lib['_amuletEffect_' + (Iscollection - 4)].show(false);
                                amuletBonusLight(Iscollection, 1);
                            };
                        };
                    } else {
                        gr.lib['_runeLight_' + i + '_' + j].show(false);
                        gr.lib['_runeSymbols_' + i + '_' + j].show(false);
                        gr.lib['_RuneSymbolsLight_' + i + '_' + j].show(false);
                        gr.lib['_amuletEffect_' + (Iscollection - 4)].show(true);
                        gr.animMap['_runeSymbolsRevealAnim_' + i + '_' + j]._onComplete = function() {
                            gr.lib['_runeLight' + i + '_' + j].show(false);
                        };
                        gr.lib['_amuletEffect_' + (Iscollection - 4)].gotoAndPlay('AmuletSymbolsEffect', 0.5, false);
                        gr.lib['_amuletEffect_' + (Iscollection - 4)].onComplete = function() {
                            gr.lib['_amuletEffect_' + (Iscollection - 4)].show(false);
                            gr.lib['_runeSymbols_' + i + '_' + j].show(true);
                            gr.animMap['_runeSymbolsRevealAnim_' + i + '_' + j].play();
                            gr.lib['_runeLight' + i + '_' + j].show(false);
                            amuletBonusLight(Iscollection, 1);
                        };
                    }

                }
            };
        };
    }

    function setRuneSymbolRevealFun(symbol) {
        symbol.revealFun = function() {
            if (tutorialIsShown) {
                return;
            }
            clickRuneNum++;
            symbol.reveal = true;
            console.log('clickRuneNum:' + clickRuneNum);
            if (clickRuneNum === 4) {
                msgBus.publish('allRuneSymbolsRevealed');
                msgBus.publish('hiddenInfo');
                allRuneSymbolsRevealed();
            }
            symbolCh++;
            if (symbolCh > 6) {
                symbolCh = 3;
            }
            let currentIndex = RuneRandomArr[clickRuneNum - 1];
            let prizeDetail = null;
            if (RuneArray[currentIndex - 1].length !== 1) { //The winning type is money
                audio.play('BonusRuneSelectPrize', symbolCh);
            } else {
                audio.play('BonusRuneSelectAmulet', symbolCh);
            }
            symbol.pixiContainer.interactive = false;
            symbol.pixiContainer.$sprite.cursor = "default";
            gr.lib._numbleText.setText(4 - clickRuneNum);
            gr.animMap['_pickNumbleAnim'].play();
            gr.lib['_bonusAStoneLight_' + symbol.gameIndex].show(false);
            gr.animMap['_bonusAStoneLightAnim_' + symbol.gameIndex]._onComplete = function() {}; //Turn off breathing effects
            gr.lib['_bonusStoneRune_' + symbol.gameIndex].setImage('bonusStoneOn_' + currentIndex);
            gr.lib['_bonusStoneRune_' + symbol.gameIndex].show(true);
            gr.animMap['_bonusStoneRuneAnim_' + symbol.gameIndex].play();
            gr.lib['_bonusDoorRuneWin_' + currentIndex].show(true);
            gr.animMap['_bonusDoorRuneAnimA_' + currentIndex].play();
            gr.getTimer().setTimeout(function() {
                gr.lib['_bonusAStoneAnim_' + symbol.gameIndex].show(true);
                gr.lib['_bonusAStoneAnim_' + symbol.gameIndex].gotoAndPlay('qiuB', 0.5, false);
            }, 900);
            gr.animMap['_bonusDoorRuneAnimA_' + currentIndex]._onComplete = function() {
                gr.lib['_bonusDoorRuneWin_' + currentIndex].show(false);
                gr.lib['_bonusStoneRune_' + symbol.gameIndex].show(false);
            };
            gr.getTimer().setTimeout(function() {
                gr.animMap['_bonusAStoneDisapper_' + symbol.gameIndex].play();
            }, 600);
            gr.lib['_bonusAStoneAnim_' + symbol.gameIndex].onComplete = function() {
                const anim = getAFreeLightAnim();
                if (RuneArray[currentIndex - 1].length !== 1) { //The winning type is money
                    prizeDetail = prizeTable[RuneArray[currentIndex - 1]];
                    jackpot += prizeDetail;
                    onlyBonus += prizeDetail;
                    gr.lib['_bonusDoorWinValue_' + currentIndex].setText(SKBeInstant.formatCurrency(prizeDetail).formattedAmount);
                    anim.moveTo(symbol, gr.lib['_doorRuneEffect_' + currentIndex], false, 300);
                    gr.getTimer().setTimeout(function() {
                        if (jackpot > winValue) {
                            msgBus.publish('winboxError', { errorCode: '29000' });
                        } else {
                            msgBus.publish('updateWinValue', { value: jackpot });
                            gr.lib._bonusATotalWinValue.setText(SKBeInstant.formatCurrency(onlyBonus).formattedAmount);
                        }
                    }, 600);
                } else {
                    anim.moveTo(symbol, gr.lib['_doorRuneEffect_' + currentIndex], true, 300, RuneArray[currentIndex - 1]);
                }
                gr.lib['_bonusAStoneAnim_' + symbol.gameIndex].show(false);
            };
            gr.animMap['_bonusAStoneDisapper_' + symbol.gameIndex]._onComplete = function() {};
        };
    }

    function getRandomSymbol() {
        let arr = [];
        while (arr.length < 4) {
            let num = Math.floor(4 * Math.random() + 1);
            if (arr.indexOf(num) == -1) {
                arr.push(num);
            }
        }
        return arr;
    }

    function runeBonusLight(num) {
        var numParams = Number(num);
        runeNum++;
        switch (numParams) {
            case 1:
                gr.lib['_RuneSymbols_' + numParams].setImage('RuneSymbols_1');
                break;
            case 2:
                gr.lib['_RuneSymbols_' + numParams].setImage('RuneSymbols_2');
                break;
            case 3:
                gr.lib['_RuneSymbols_' + numParams].setImage('RuneSymbols_3');
                break;
            case 4:
                gr.lib['_RuneSymbols_' + numParams].setImage('RuneSymbols_4');
                break;
        }
        if (runeNum === 4) {
            isRuneBonus = true;
            gr.lib._runeBonusWinText.show(true);
            gr.lib._AmuletMeterAnim_1.show(true);
            gr.lib._AmuletMeterAnim_1.gotoAndPlay('AmuletMeterAnim', 0.2, true);
            audio.play('BonusTriggeredRune', 2);
            gr.lib._AmuletMeterLightEffect_1.show(true);
            gr.lib._AmuletMeterLightEffect_1.gotoAndPlay('AmuletMeterLightAnim', 0.15, true);
        }
    }

    function amuletBonusLight(num, type) {
        amuletNum++;
        if (amuletNum === 4) {
            isAmuletBonus = true;
            if (type !== 2) {
                audio.play('BonusTriggeredAmulet', 1);
                gr.lib._amuletBonusWinText.show(true);
                gr.lib._AmuletMeterAnim_2.show(true);
                gr.lib._AmuletMeterAnim_2.gotoAndPlay('AmuletMeterAnim', 0.2, true);
                gr.lib._AmuletMeterLightEffect_2.show(true);
                gr.lib._AmuletMeterLightEffect_2.gotoAndPlay('AmuletMeterLightAnim', 0.15, true);
                gr.lib._runeBonusAmuletMeterAnim_1.show(true);
                gr.lib._runeBonusAmuletMeterAnim_1.gotoAndPlay('AmuletMeterAnim', 0.2, true);
                gr.lib._runeBonusAmuletMeterLightEffect_1.show(true);
                gr.lib._runeBonusAmuletMeterLightEffect_1.gotoAndPlay('AmuletMeterLightAnim', 0.15, true);
            }
            gr.lib._bonusAmuletWinText.show(true);
            gr.lib._doorEffect.show(true);
            gr.lib._doorEffect.gotoAndPlay('doorEffect', 0.07, true);
        }
        var numParams = Number(num);
        switch (numParams) {
            case 5:
                if (type !== 2) {
                    gr.lib['_amuletSymbols_' + (numParams - 4)].setImage('AmuletSymbols_1');
                }
                gr.lib['_bonusAmuletSymbols_' + (numParams - 4)].setImage('AmuletSymbols_1');
                break;
            case 6:
                if (type !== 2) {
                    gr.lib['_amuletSymbols_' + (numParams - 4)].setImage('AmuletSymbols_2');
                }
                gr.lib['_bonusAmuletSymbols_' + (numParams - 4)].setImage('AmuletSymbols_2');
                break;
            case 7:
                if (type !== 2) {
                    gr.lib['_amuletSymbols_' + (numParams - 4)].setImage('AmuletSymbols_3');
                }
                gr.lib['_bonusAmuletSymbols_' + (numParams - 4)].setImage('AmuletSymbols_3');
                break;
            case 8:
                if (type !== 2) {
                    gr.lib['_amuletSymbols_' + (numParams - 4)].setImage('AmuletSymbols_4');
                }
                gr.lib['_bonusAmuletSymbols_' + (numParams - 4)].setImage('AmuletSymbols_4');
                break;
        }
    }

    function allSymbolsRevealed() {
        if (gameError) {
            return;
        }
        if (isRuneBonus) {
            gr.lib._baseTransitions.show(true);
            gr.lib._baseTransitions.gotoAndPlay('Base', baseTransitions, false);
            audio.play('BonusTransitionRune', 1);
            audio.play('MusicLoop2', 0, true);
            gr.lib._baseTransitionsText.show(true);
            letterTop(gr.lib._baseTransitionsText);
            gr.lib._baseTransitionsText.setText(loader.i18n.Game['RUNEBONUS']);
            RuneRandomArr = getRandomSymbol();
            gr.animMap['_baseTransitionsTextAnim'].play();
            gr.animMap['_baseTransitionsTextAnim']._onComplete = function() {
                gr.lib._baseTransitionsText.show(false);
            };
            gr.lib._baseTransitions.onComplete = function() {
                initAllLightAnims();
                msgBus.publish('appearInfo');
                gr.lib._baseTransitions.show(false);
                gr.lib._baseGameSence.show(false);
                if (haveReveal) {
                    gr.lib._runeBonusRevealAll.show(true);
                }
                gr.lib._bonusAGameSence.show(true);
            };
        } else if (isAmuletBonus) {
            gr.lib._bonusTransitions.show(true);
            gr.lib._bonusTransitions.gotoAndPlay('Bonus', bonusTransitions, false);
            audio.play('BonusTransitionAmulet', 1);
            audio.play('MusicLoop3', 0, true);
            gr.lib._bonusTransitionsText.show(true);
            letterTop(gr.lib._bonusTransitionsText);
            gr.lib._bonusTransitionsText.setText(loader.i18n.Game['AMULETBONUS']);
            gr.animMap['_bonusTransitionsTextAnim'].play();
            gr.animMap['_bonusTransitionsTextAnim']._onComplete = function() {
                gr.lib._bonusTransitionsText.show(false);
            };
            gr.lib._bonusTransitions.onComplete = function() {
                gr.lib._bonusBTotalWinValue.setText(SKBeInstant.formatCurrency(jackpot).formattedAmount);
                gr.lib._bonusTransitions.show(false);
                gr.lib._bonusAGameSence.show(false);
                gr.lib._doorEffect.show(false);
                gr.lib._doorEffect.stopPlay();
                msgBus.publish('appearInfo');
                if (haveReveal) {
                    gr.lib._amuletBonusRevealAll.show(true);
                }
                gr.lib._bonusBGameSence.show(true);
            };
        } else {
            if (jackpot !== winValue) {
                msgBus.publish('winboxError', { errorCode: '29000' });
                return;
            }
            msgBus.publish('allRevealed');

        }
    }

    function initAllLightAnims() {
        if (lightAnimations.receptions.length === 0) {
            for (let i = 0; i < 4; i++) {
                lightAnimations["lfa" + i] = new LightFlyAnimation();
                lightAnimations.receptions.push("lfa" + i);
                lightAnimations.free.push("lfa" + i);
            }
        } else {
            lightAnimations.free = [...lightAnimations.used];
            lightAnimations.used = [];
        }
    }

    function getAFreeLightAnim() {
        if (lightAnimations.free.length !== 0) {
            const index = lightAnimations.free.shift();
            lightAnimations.used.push(index);
            return lightAnimations[index];
        }
    }

    function allRuneSymbolsRevealed() {
        gr.lib._runeBonusRevealAll.show(false);
        for (let i = 1; i < 9; i++) {
            gr.lib['_bonusAStoneBG_' + i].pixiContainer.interactive = false;
            gr.lib['_bonusAStoneBG_' + i].pixiContainer.$sprite.cursor = "default";
            gr.animMap['_bonusAStoneLightAnim_' + i].stop();
            gr.lib['_bonusAStoneLight_' + i].show(false);
            gr.animMap['_bonusAStoneLightAnim_' + i]._onComplete = function() {

            };
            if (!gr.lib['_bonusAStoneBG_' + i].reveal) {
                gr.lib['_bonusAStoneBG_' + i].setImage('bonusStoneMask' + i);
            }
        }
        gr.getTimer().setTimeout(function() {
            if (gameError) {
                return;
            }
            if (isAmuletBonus) {
                gr.lib._bonusTransitions.show(true);
                gr.lib._bonusTransitions.gotoAndPlay('Bonus', bonusTransitions, false);
                audio.play('BonusTransitionAmulet', 1);
                audio.play('MusicLoop3', 0, true);
                gr.lib._bonusTransitionsText.show(true);
                letterTop(gr.lib._bonusTransitionsText);
                gr.lib._bonusTransitionsText.setText(loader.i18n.Game['AMULETBONUS']);
                gr.animMap['_bonusTransitionsTextAnim'].play();
                gr.animMap['_bonusTransitionsTextAnim']._onComplete = function() {
                    gr.lib._bonusTransitionsText.show(false);
                };
                gr.lib._bonusTransitions.onComplete = function() {
                    gr.lib._bonusBTotalWinValue.setText(SKBeInstant.formatCurrency(jackpot).formattedAmount);
                    gr.lib._bonusTransitions.show(false);
                    gr.lib._bonusAGameSence.show(false);
                    gr.lib._doorEffect.show(false);
                    gr.lib._doorEffect.stopPlay();
                    msgBus.publish('appearInfo');
                    if (haveReveal) {
                        gr.lib._amuletBonusRevealAll.show(true);
                    }
                    gr.lib._bonusBGameSence.show(true);
                };
            } else {
                changeGameSence();
            }
        }, 4000);

    }

    function initGemEffects() {
        gr.lib._bonusALight_1.show(true);
        gr.animMap['_bonusALightAnim_1'].play();
        gr.animMap['_bonusALightAnim_1']._onComplete = function() {
            gr.getTimer().setTimeout(() => {
                gr.animMap['_bonusALightAnim_1'].play();
            }, 6000);
        };
        gr.getTimer().setTimeout(() => {
            gr.lib._bonusALight_2.show(true);
            gr.animMap['_bonusALightAnim_2'].play();
        }, 3000);
        gr.animMap['_bonusALightAnim_2']._onComplete = function() {
            gr.getTimer().setTimeout(() => {
                gr.animMap['_bonusALightAnim_2'].play();
            }, 6000);
        };
        gr.getTimer().setTimeout(() => {
            gr.lib._bonusALight_3.show(true);
            gr.animMap['_bonusALightAnim_3'].play();
        }, 6000);
        gr.animMap['_bonusALightAnim_3']._onComplete = function() {
            gr.getTimer().setTimeout(() => {
                gr.animMap['_bonusALightAnim_3'].play();
            }, 6000);
        };
        gr.getTimer().setTimeout(() => {
            gr.lib._bonusALight_4.show(true);
            gr.animMap['_bonusALightAnim_4'].play();
        }, 9000);
        gr.animMap['_bonusALightAnim_4']._onComplete = function() {
            gr.getTimer().setTimeout(() => {
                gr.animMap['_bonusALightAnim_4'].play();
            }, 6000);
        };
        if (gr.lib._bonusALight_5) {
            gr.getTimer().setTimeout(() => {
                gr.lib._bonusALight_5.show(true);
                gr.animMap['_bonusALightAnim_5'].play();
            }, 12000);
            gr.animMap['_bonusALightAnim_5']._onComplete = function() {
                gr.getTimer().setTimeout(() => {
                    gr.animMap['_bonusALightAnim_5'].play();
                }, 6000);
            };
        }
    }

    function initialBaseGame() {
        let index = 0;
        for (let i = 1; i < 4; i++) {
            for (let j = 1; j < 6; j++) {
                gr.lib['_stoneExplosion_' + i + '_' + j].setImage('stoneExplosion_0001');
                gr.lib['_stoneExplosion_' + i + '_' + j].show(true);
                gr.lib['_stoneLightAnim_' + i + '_' + j].needPlayAnim = true;
                gr.lib['_stoneLightAnim_' + i + '_' + j].reveal = false;
                gr.lib['_stoneLightAnim_' + i + '_' + j].show(false);
                gr.lib['_winSymbols_' + i + '_' + j].gotoAndPlay("WinningSymbols", 0.3, true);
                gr.lib['_stoneLightAnim_' + i + '_' + j].gameIndex = index;
                symbolButton[index] = new gladButton(gr.lib['_stoneLightAnim_' + i + '_' + j], "stoneLightAnim_0001", buttonRules);
                setSymbolRevealFun(gr.lib['_stoneLightAnim_' + i + '_' + j], i, j);
                gr.lib['_winSymbols_' + i + '_' + j].show(false);
                gr.lib['_runeLight' + i + '_' + j].show(false);
                gr.lib['_noWinSymbols_' + i + '_' + j].show(false);
                index++;
            }
        }
        for (let k = 1; k < 5; k++) {
            gr.lib['_amuletEffect_' + k].show(false);
            gr.lib['_runeEffect_' + k].show(false);
            gr.lib['_RuneSymbols_' + k].setImage('RuneSymbolsInactive_' + k);
            gr.lib['_amuletSymbols_' + k].setImage('AmuletSymbolsInactive_' + k);
        }
        for (let j = 1; j < 3; j++) {
            gr.lib['_AmuletMeterAnim_' + j].show(false);
            gr.lib['_AmuletMeterLightEffect_' + j].show(false);
        }
        gr.lib._amuletBonusWinText.show(false);
        gr.lib._runeBonusWinText.show(false);
    }

    function hideGem() {
        if (SKBeInstant.getGameOrientation() === "landscape") {
            for (let i = 1; i < 6; i++) {
                gr.lib['_bonusALight_' + i].show(false);
            }
        } else {
            for (let i = 1; i < 5; i++) {
                gr.lib['_bonusALight_' + i].show(false);
            }
        }
    }

    function initialRuneBonus() {
        if (isInit) {
            hideGem();
            initGemEffects();
        }
        gr.lib._bonusAGameSence.updateCurrentStyle({ '_opacity': 1 });
        gr.lib._bonusAGameSence.show(false);
        gr.lib._numbleText.setText('4');
        gr.lib._bonusATotalWinValue.setText('');
        gr.lib._runeBonusAmuletMeterAnim_1.show(false);
        gr.lib._runeBonusAmuletMeterLightEffect_1.show(false);
        for (let i = 1; i < 5; i++) {
            gr.lib['_bonusAmuletSymbols_' + i].setImage('AmuletSymbolsInactive_' + i);
            gr.lib['_bonusDoorWinValue_' + i].show(false);
            gr.lib['_bonusDoorRune_' + i].show(true);
            gr.lib['_bonusDoorRuneWin_' + i].show(false);
            gr.lib['_bonusDoorAmuletSymbols_' + i].show(false);
            gr.lib['_bonusAmuletEffect_' + i].show(false);
            gr.lib['_doorRuneEffect_' + i].show(false);
        }
        gr.lib._bonusAmuletWinText.show(false);
        gr.lib._doorEffect.show(false);
        for (let i = 1; i < 9; i++) {
            gr.lib['_bonusStoneRune_' + i].show(false);
            gr.lib['_bonusAStoneAnim_' + i].show(false);
            if (gr.lib['_effectBAnchro_' + i]) {
                gr.lib['_effectBAnchro_' + i].show(false);
            }
            gr.lib['_bonusAStoneBG_' + i].updateCurrentStyle({ '_opacity': 1 });
            gr.lib['_bonusAStoneBG_' + i].setImage('bonusStone' + i);
            gr.lib['_bonusAStoneBG_' + i].gameIndex = i;
            gr.lib['_bonusAStoneBG_' + i].reveal = false;
            gr.lib['_bonusAStoneBG_' + i].needPlayAnim = true;
            gr.lib['_bonusAStoneBG_' + i].pixiContainer.$sprite.cursor = "pointer";
            gr.lib['_bonusAStoneBG_' + i].pixiContainer.interactive = true;
            runeButton[i] = new gladButton(gr.lib['_bonusAStoneBG_' + i], 'bonusStone' + i, buttonRules);
            setRuneSymbolRevealFun(gr.lib['_bonusAStoneBG_' + i]);
            if (isInit) {
                runeButton[i].click(gr.lib['_bonusAStoneBG_' + i].revealFun);
            }
            hitAreaButton(gr.lib['_bonusAStoneBG_' + i], 0.4);
            gr.lib['_bonusAStoneLight_' + i].show(true);
            gr.animMap['_bonusAStoneLightAnim_' + i].play();
            gr.animMap['_bonusAStoneLightAnim_' + i]._onComplete = function() {
                gr.animMap['_bonusAStoneLightAnim_' + i].play();
            };
        }
    }

    function initialAmuletBonus() {
        gr.lib._bonusBGameSence.updateCurrentStyle({ '_opacity': 1 });
        gr.lib._bonusBGameSence.show(false);
        gr.lib._bonusBTotalWinValue.setText('');
        gr.lib._amuletBonusWinLight.show(false);

        for (let i = 1; i < 7; i++) {
            gr.lib['_bonusBwinNumbleValue_' + i].show(false);
            gr.lib['_bonusBSymbosExplsionAnim_' + i].show(false);
            gr.lib['_bonusBeffectBAnchro_' + i].show(false);
            gr.lib['_symbosS' + i + 'Light'].show(true);
            gr.lib['_symbosS' + i].show(true);
            gr.lib['_symbosS' + i].setImage('S' + i);
            gr.lib['_bonus2BallEffcet_' + i].show(true);
            gr.lib['_bonus2BallEffcet_' + i].updateCurrentStyle({ '_opacity': 1 });
            gr.lib['_bonus2BallEffcet_' + i].gotoAndPlay('bonus2BallEffcetA', 0.3, true);
            gr.lib['_symbosS' + i].gameIndex = i;
            amuletButton[i] = new gladButton(gr.lib['_symbosS' + i], 'S' + i, buttonRules);
            setAmuletSymbolRevealFun(gr.lib['_symbosS' + i]);
            gr.lib['_symbosS' + i].pixiContainer.$sprite.cursor = "pointer";
            if (isInit) {
                amuletButton[i].click(gr.lib['_symbosS' + i].revealFun);
            }
            gr.lib['_symbosS' + i].pixiContainer.interactive = true;
            hitAreaButton(gr.lib['_symbosS' + i], 0.4);
        }
    }

    function setAmuletSymbolRevealFun(symbol) {
        symbol.revealFun = function() {
            if (tutorialIsShown) {
                return;
            }
            symbolCh++;
            if (symbolCh > 6) {
                symbolCh = 3;
            }
            audio.play('BonusAmuletSelect', symbolCh);
            symbol.pixiContainer.interactive = false;
            symbol.pixiContainer.$sprite.cursor = "default";
            let prizeDetail = Number(Amulet.substring(1, 2));
            let multiple = amuletbonusLevel(Number(Amulet.substring(1, 2)));
            msgBus.publish('hiddenInfo');
            amuletSymbolsRevealed(symbol.gameIndex);
            gr.lib['_symbosS' + symbol.gameIndex + 'Light'].gotoAndPlay('bonusBSymbosAnim', 0.25);
            gr.getTimer().setTimeout(function() {
                gr.lib['_bonusBSymbosExplsionAnim_' + symbol.gameIndex].show(true);
                gr.lib['_bonusBSymbosExplsionAnim_' + symbol.gameIndex].gotoAndPlay('bonusBSymbosExplsionAnim' + symbol.gameIndex, 0.25);
            }, 300);
            gr.lib['_bonusBSymbosExplsionAnim_' + symbol.gameIndex].onComplete = function() {
                gr.lib['_bonusBSymbosExplsionAnim_' + symbol.gameIndex].show(false);
            };
            symbol.show(false);
            gr.getTimer().setTimeout(() => {
                gr.lib['_bonusBwinNumbleValue_' + symbol.gameIndex].show(true);
                gr.lib['_bonusBwinNumbleValue_' + symbol.gameIndex].setText(loader.i18n.Game['amuletMultipleText_' + prizeDetail]);
                gr.animMap['_bonusBwinValueAnim_' + symbol.gameIndex].play();
                gr.lib['_bonusBeffectBAnchro_' + symbol.gameIndex].show(true);
                gr.lib['_bonusBEffectLight_' + symbol.gameIndex].gotoAndPlay('doorRuneEffect2', 1, false);
            }, 800);
            gr.lib['_bonusBEffectLight_' + symbol.gameIndex].onComplete = function() {
                gr.lib['_bonusBeffectBAnchro_' + symbol.gameIndex].show(false);
                gr.lib._amuletBonusWinLight.show(true);
                gr.lib._amuletBonusWinLight.gotoAndPlay('amuletBonusWinLight', 0.3);
                gr.animMap._bonusBTotalWinValueAnim.play();
                jackpot *= multiple;
                if (jackpot > winValue) {
                    msgBus.publish('winboxError', { errorCode: '29000' });
                } else {
                    gr.lib._bonusBTotalWinValue.setText(SKBeInstant.formatCurrency(jackpot).formattedAmount);
                    msgBus.publish('updateWinValue', { value: jackpot });
                }
            };
            gr.lib._amuletBonusWinLight.onComplete = function() {
                gr.lib._amuletBonusWinLight.show(false);
            };
            symbol.reveal = true;
        };
    }

    function amuletSymbolsRevealed(gameIndex) {
        gr.lib._amuletBonusRevealAll.show(false);
        for (let i = 1; i < 7; i++) {
            gr.lib['_symbosS' + i].pixiContainer.interactive = false;
            gr.lib['_symbosS' + i].pixiContainer.$sprite.cursor = "default";
            fadeOutAmulet(gr.lib['_bonus2BallEffcet_' + i]);
            if (i !== gameIndex) {
                gr.lib['_symbosS' + i + 'Light'].show(false);
                gr.lib['_symbosS' + i].setImage('S' + i + 'Inactive');
            }
        }
        gr.getTimer().setTimeout(() => {
            if (gameError) {
                return;
            }
            changeGameSence();
        }, 4000);
    }

    function amuletbonusLevel(num) {
        let level;
        switch (num) {
            case 1:
                level = 10;
                break;
            case 2:
                level = 5;
                break;
            case 3:
                level = 4;
                break;
            case 4:
                level = 3;
                break;
            case 5:
                level = 2;
                break;
        }
        return level;
    }

    function fadeOutAmulet(symbol) {
        function fadeOut() {
            let currentOpacity = symbol._currentStyle._opacity;
            currentOpacity -= 0.03;
            symbol.updateCurrentStyle({ '_opacity': currentOpacity });
            if (currentOpacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                symbol.stopPlay();
                symbol.show(false);
            }
        }
        fadeOut();
    }

    function toBaseSence() {
        let bonus = null;
        if (isAmuletBonus) {
            bonus = gr.lib._bonusBGameSence;
        } else {
            bonus = gr.lib._bonusAGameSence;
        }
        let currentOpacity = bonus._currentStyle._opacity;
        currentOpacity -= 0.05;
        bonus.updateCurrentStyle({ '_opacity': currentOpacity });
        if (currentOpacity > 0) {
            requestAnimationFrame(toBaseSence);
        }
    }

    function changeGameSence() {
        if (jackpot !== winValue) {
            msgBus.publish('winboxError', { errorCode: '29000' });
            return;
        }
        gr.lib._baseGameSence.show(true);
        msgBus.publish('allRevealed');
        requestAnimationFrame(toBaseSence);
    }

    function onAssetsLoadedAndGameReady() {
        gr.lib._baseTransitions.show(false);
        gr.lib._bonusTransitions.show(false);
        gr.lib._baseTransitionsText.show(false);
        gr.lib._bonusTransitionsText.show(false);
        gr.lib._tutorial.show(false);
        gr.lib._winBoxError.show(false);
        gr.lib._ErrorScene.show(false);
        gr.lib._network.show(false);
        gr.lib._nonWinPlaque.show(false);
        gr.lib._winPlaque.show(false);
        gr.lib._bonusBGameSence.show(false);
        gr.lib._bonusAGameSence.show(false);
    }

    function fillWords() {
        letterTop(gr.lib._bonusLogo);
        if (SKBeInstant.getGameOrientation() === "landscape") {
            gr.lib._bonusLogo.setText(loader.i18n.Game['bonusLogo']);
        } else {
            gr.lib._bonusLogo.setText(loader.i18n.Game['bonusLogo01']);
        }
        gr.lib._bonusATotalWinText.setText(loader.i18n.Game['bonuswin']);
        gr.lib._bonusAmuletText.setText(loader.i18n.Game['amuletbonus']);
        gr.lib._bonusAmuletWinText.setText(loader.i18n.Game['amuletbonus']);
        gr.lib._bonusAPormptText.setText(loader.i18n.Game['ApormptText']);
        letterTop(gr.lib._bonusBLogo);
        gr.lib._bonusBLogo.setText(loader.i18n.Game['AMULETBONUS']);
        gr.lib._bonusBLogoAnim.setText(loader.i18n.Game['AMULETBONUS']);
        gr.lib._bonusBPormptText.setText(loader.i18n.Game['BpormptText']);
        gr.lib._bonusBTotalWinText.setText(loader.i18n.Game['totalbonuswin']);
    }

    function onGameParametersUpdated() {
        cloneGladAnim();
        setAutoFontFitText();
        fillWords();
        initialBaseGame();
        initialRuneBonus();
        initialAmuletBonus();
        if (SKBeInstant.config.customBehavior) {
            baseTransitions = Number(SKBeInstant.config.customBehavior.baseTransitions) || 0.2;
        } else if (loader.i18n.gameConfig) {
            baseTransitions = Number(loader.i18n.gameConfig.baseTransitions) || 0.2;
        } else {
            baseTransitions = 0.2;
        }
        if (SKBeInstant.config.customBehavior) {
            bonusTransitions = Number(SKBeInstant.config.customBehavior.bonusTransitions) || 0.2;
        } else if (loader.i18n.gameConfig) {
            bonusTransitions = Number(loader.i18n.gameConfig.bonusTransitions) || 0.2;
        } else {
            bonusTransitions = 0.2;
        }
        if (SKBeInstant.config) {
            if (!SKBeInstant.config.autoRevealEnabled) {
                haveReveal = false;
            }
        }
    }

    function setAutoFontFitText() {
        gr.lib._bonusLogo.autoFontFitText = true;
        gr.lib._bonusALogoAnim.autoFontFitText = true;
        gr.lib._bonusAmuletWinText.autoFontFitText = true;
        gr.lib._bonusAmuletText.autoFontFitText = true;
        gr.lib._bonusATotalWinText.autoFontFitText = true;
        gr.lib._bonusATotalWinValue.autoFontFitText = true;
        gr.lib._bonusAPormptText.autoFontFitText = true;
        gr.lib._numbleText.autoFontFitText = true;
        gr.lib._bonusDoorWinValue_1.autoFontFitText = true;
        gr.lib._bonusDoorWinValue_2.autoFontFitText = true;
        gr.lib._bonusDoorWinValue_3.autoFontFitText = true;
        gr.lib._bonusDoorWinValue_4.autoFontFitText = true;
        gr.lib._bonusBLogo.autoFontFitText = true;
        gr.lib._bonusBLogoAnim.autoFontFitText = true;
        gr.lib._bonusBPormptText.autoFontFitText = true;
        gr.lib._bonusBTotalWinText.autoFontFitText = true;
        gr.lib._bonusBTotalWinValue.autoFontFitText = true;
        gr.lib._bonusBTotalWinValue.autoFontFitText = true;
        gr.lib._baseTransitionsText.autoFontFitText = true;
        gr.lib._bonusTransitionsText.autoFontFitText = true;
        for (let i = 1; i < 7; i++) {
            gr.lib['_bonusBwinNumbleValue_' + i].autoFontFitText = true;
        }

    }

    function letterTop(text) {
        text.pixiContainer.$text._style._padding = 16;
    }

    function hitAreaButton(button, num) {
        button.pixiContainer.$sprite.hitArea = new PIXI.Circle(button._currentStyle._width / 2,
            button._currentStyle._height / 2, (button._currentStyle._height * num));
    }

    function onStartReveallAll() {
        revealAll = true;
    }

    function onTutorialIsShown() {
        tutorialIsShown = true;
    }

    function onTutorialIsHide() {
        tutorialIsShown = false;
    }



    function getBaseValue(data) {
        jackpot = data.value;
    }

    function centerToRightOnComplete(data) {
        gr.lib['_bonusAmuletEffect_' + (data.amuletNum - 4)].show(true);
        gr.lib['_bonusAmuletEffect_' + (data.amuletNum - 4)].gotoAndPlay('AmuletSymbolsEffect', 0.5, false);
        gr.lib['_bonusAmuletEffect_' + (data.amuletNum - 4)].onComplete = function() {
            gr.lib['_bonusAmuletEffect_' + (data.amuletNum - 4)].show(false);
            amuletBonusLight(data.amuletNum, 1);
        };
    }

    function onError() {
        gameError = true;
        gr.getTimer().setTimeout(function() {
            gr.getTicker().stop();
        }, 200);
    }

    msgBus.subscribe('getBaseValue', getBaseValue);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('jLotteryGame.assetsLoadedAndGameReady', onAssetsLoadedAndGameReady);
    msgBus.subscribe('jLottery.error', onError);
    msgBus.subscribe('winboxError', onError);
    msgBus.subscribe('startReveallAll', onStartReveallAll);
    msgBus.subscribe('resetAll', resetAll);
    msgBus.subscribe('centerToRightOnComplete', centerToRightOnComplete);
    msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
    msgBus.subscribe('tutorialIsHide', onTutorialIsHide);

    return {};
});