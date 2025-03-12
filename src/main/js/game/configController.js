/**
 * @module control some game config
 * @description control the customized data of paytable&help page and other customized config
 */
define({
  paytableHelpPreparedDatas : {
      "imageNames":[{
			"searchRegExp":/{WinningSymbols}/g,
			"spriteName":"WinningSymbols_0001"
		},		
		],
	},
  backgroundStyle: {
    "splashSize": "100% 100%",
    "gameSize": "100% 100%"
  },
  predefinedStyle: {
    "swirlName": "activityAnim",
    "splashLogoName": "logoLoader",
    landscape: {
      canvas: {
        width: 1440,
        height: 810
      },
      gameLogoDiv: {
        width: 1390,
        height: 466,
        y: 320,
      },
      progressSwirl: {
        width: 130,
        height: 130,
        animationSpeed: 0.5,
        loop: true,
        y: 600,
        scale: {
          x: 1,
          y: 1
        }
      },
      brandCopyRightDiv: {
        bottom: 20,
        fontSize: 18,
        color: "#70410b",
        fontFamily: '"Arial"'
      },
      progressTextDiv: {
        y: 600,
        style: {
          fontSize: 32,
          fill: "#ffffff",
          fontWeight: 800,
          fontFamily: "Oswald",
        }
      },
      copyRightDiv: {
          bottom: 20,
          fontSize: 20,
          color: "#70410b",
          fontFamily: '"Oswald"'
        },
    },
    portrait: {
      canvas: {
        width: 810,
        height: 1440
      },
      gameLogoDiv: {
        width: 1390,
        height: 466,
        y: 450,
        scale: {
          x: 0.64,
          y: 0.64
        }
      },
      progressSwirl: {
        width: 130,
        height: 130,
        animationSpeed: 0.5,
        loop: true,
        y: 1050,
        scale: {
          x: 1,
          y: 1
        }
      },
      brandCopyRightDiv: {
        bottom: 20,
        fontSize: 18,
        color: "#70410b",
        fontFamily: '"Arial"'
      },
      progressTextDiv: {
        y: 1050,
        style: {
          fontSize: 25,
          fill: "#ffffff",
          fontWeight: 800,
          fontFamily: "Oswald",
        }
      }
    }
  }
});
//# sourceMappingURL=configController.js.map
