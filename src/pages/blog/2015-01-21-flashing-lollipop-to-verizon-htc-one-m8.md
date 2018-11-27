---
title: Flashing Lollipop to Verizon HTC One (m8)
date: 2015-01-21 23:06:41 Z
tags:
- android
layout: post
draft: false
category: misc
---

Rooting and unlocking the Verizon m8 is surprisingly difficult- Verizon doesn't allow HTC to unlock the bootloader and many of the rooting utilities haven't yet been upgraded to support Android 4.4.4. Today, I worked out a set of steps to get my m8 rooted and running Lollipop. As a bonus, you can perform all of these steps using only your phone (no computer). 

Advance warning: it'll cost you $25 to unlock the bootloader with SunShine. Standard disclaimer: rooting/flashing is a risky process, this might not work for you, I have no support to provide if it doesn't, you might brick your phone, it's not my fault if you do.

1. Back up your entire phone- I recommend using [Helium](https://play.google.com/store/apps/details?id=com.koushikdutta.backup&hl=en). The Pro version lets you back up to Dropbox or Google Drive.
2. Download [WeakSauce 2](http://forum.xda-developers.com/showpost.php?p=57462117&postcount=1) and run it. This will temporarily root your phone, but it won't permaroot it. 
3. Download [SuperSu](https://play.google.com/store/apps/details?id=eu.chainfire.supersu&hl=en) from the Play Store (to make sure you're protected while running these steps). It'll warn you that the su binary is outdated- ignore this, trying to upgrade it will fail since WeakSauce only provides a temporary root.
4. Download [SunShine S-Off](http://theroot.ninja/) and run it. It'll verify that your bootloader can be unlocked (worked for me on Android 4.4.4), charge you $25, and unlock your bootloader. Simply follow the steps; they're all quite self-explanatory. SunShine has some pretty solid support over at their [website](http://theroot.ninja/) if you have any issues with this step.
5. Download [Flashify](https://play.google.com/store/apps/details?id=com.cgollner.flashify&hl=en) from the Play Store. Click `Recovery image` under the `Flash` tab. Select the `Download TWRP` option and select the latest version of TWRP. This will install TWRP- a recovery system that can install ROMs and perform other useful functionality.
6. Before booting to recovery, [download the Lollipop ROM](http://forum.xda-developers.com/showthread.php?t=2716306) and save it to your internal SD card. (You can try a different ROM but I've only tested this one. Always make sure your ROM matches your phone and carrier.)
7. Turn off your phone. Then, boot to recovery by holding down the Power and Volume Down keys. You should see the TeamWin flash screen and then TWRP will load. It will prompt you to (perma-)root your phone- select OK. Then, pick the Install option, navigate to wherever you saved the Lollipop ROM in the last step, and select it.
8. Follow the steps to select the apps and tweaks you want. Congrats! You're now running Lollipop! Once your apps have restored, you can use Helium or whatever to restore your data.
